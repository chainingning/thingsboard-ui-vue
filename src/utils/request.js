import axios from 'axios'
import { getToken, setToken } from '@/utils/token'
import { Message } from 'element-ui'
import api from '@/api'
import router from '@/router'

// 允许携带cookie
axios.defaults.withCredentials = true

// create an axios instance
const http = axios.create()

const pending = []
const removePending = config => {
  for (const p in pending) {
    if (pending[p].u === config.url + '&' + config.method) {
      pending[p].fn()
      pending.splice(p, 1)
    }
  }
}

// request interceptor
http.interceptors.request.use(
  config => {
    if (config.isToken) {
      config.headers['X-Authorization'] = `Bearer ${getToken('token')}`
    }
    if (!config.isLoop) {
      removePending(config)
      config.cancelToken = new axios.CancelToken(fn => {
        pending.push({ u: config.url + '&' + config.method, fn })
      })
    }
    return config
  },
  err => {
    return Promise.reject(err)
  }
)

// respone interceptor
http.interceptors.response.use(
  response => {
    if (!response.config.isLoop) {
      removePending(response.config)
    }
    return response
  },
  error => {
    return Promise.reject(error)
  }
)

/**
 * @param {String} url 路劲
 * @param {String} method 请求方式
 * @param {Object} params 参数
 * @param {String} baseURL 请求头
 * @param {Object} headers 请求头配置
 * @param {Number} timeout 请求时间
 * @param {Boolean} isToken 请求是否携带token
 * @param {Boolean} isLoop 接口是否轮询而不被取消
 * @return {AxiosPromise}
 */
let msgVisible = false
export const request = async ({ url, method = 'get', params, baseURL = 'BASE_URL', headers = {}, timeout, isToken = true, isLoop, isError = false }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await http({
        method,
        url: process.env.NODE_ENV === 'production' ? isError ? url : `${window.IP_CONFIG[baseURL]}${url}` : `${baseURL}${url}`,
        params: (method === 'get' || method === 'delete') && params,
        data: ((method === 'post' || method === 'put') && params) || null,
        headers: {
          ...headers
        },
        timeout: timeout || 30000,
        isToken: isToken,
        isLoop: isLoop || false
      })
      resolve(result)
    } catch (error) {
      switch (error.response.status) {
        case 401:
          switch (error.response.data.errorCode) {
            case 10:
              router.push({ path: '/login' })
              if (!msgVisible) {
                msgVisible = true
                Message({
                  type: 'error',
                  message: error.response.data.message,
                  onClose: () => {
                    msgVisible = false
                  }
                })
              }
              break
            case 11:
              if (getToken('refreshToken')) {
                try {
                  await postRefreshToken()
                  resolve(await request(Object.assign({}, error.response.config, {
                    url: `/${error.response.config.url.split('/').slice(1).join('/')}`,
                    baseURL: error.response.config.url.split('/')[0],
                    isError: true
                  })))
                } catch (error) {
                  router.push({ path: '/login' })
                }
              } else {
                router.push({ path: '/login' })
              }
              break
            case 15:
              router.push({ path: '/login/resetExpiredPassword', query: { resetToken: error.response.data.resetToken } })
              break
            case 16:
              router.push({ path: '/login/resetCertKey', query: { resetToken: error.response.data.resetToken } })
              break
            default:
              if (!msgVisible) {
                msgVisible = true
                Message({
                  type: 'error',
                  message: error.response.data.message,
                  onClose: () => {
                    msgVisible = false
                  }
                })
              }
              break
          }
          break
        case 403:
        case 404:
        case 409:
          if (!msgVisible) {
            msgVisible = true
            Message({
              type: 'error',
              message: '设备未连接',
              onClose: () => {
                msgVisible = false
              }
            })
          }
          break
        case 500:
          if (!msgVisible) {
            msgVisible = true
            Message({
              type: 'error',
              message: error.response.data,
              onClose: () => {
                msgVisible = false
              }
            })
          }
          break
        default:
          if (!msgVisible) {
            msgVisible = true
            Message({
              type: 'error',
              message: error.response.data.message,
              onClose: () => {
                msgVisible = false
              }
            })
          }
          break
      }
      if (error.response.status !== 401 || error.response.data.errorCode !== 11) {
        reject(error)
      }
    }
  })
}

let flag = true
let result = null
let timer = null
function postRefreshToken () {
  return new Promise(async (resolve, reject) => {
    try {
      if (flag) {
        flag = false
        result = null
        result = await api.postRefreshToken({
          refreshToken: getToken('refreshToken')
        })
        setToken(result.data.token, result.data.refreshToken)
        clearTimeout(timer)
        timer = setTimeout(() => {
          flag = true
        }, 5000)
      }
      const timer1 = setInterval(() => {
        if (result) {
          clearInterval(timer1)
          resolve()
        }
      }, 300)
    } catch (error) {
      reject(error)
    }
  })
}
