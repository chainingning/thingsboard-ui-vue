/**
 * 属性
 */

import { request } from '@/utils/request'

export default {
  postUser: params => request({ url: '/api/user', method: 'post', params }),
  postChangePassword: params => request({ url: '/api/auth/changePassword', method: 'post', params }),
  postChangeCertKey: params => request({ url: '/api/auth/changeCertKey', method: 'post', params })
}
