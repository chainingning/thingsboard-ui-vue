import { getToken } from '@/utils/token'

function mergeObject (target, source) {
  for (const key in source) {
    if (typeof source[key] === 'object') {
      for (const _key in source[key]) {
        if (Object.prototype.hasOwnProperty.call(target[key], _key)) {
          if (source[key][_key] instanceof Array) {
            target[key][_key] = [...target[key][_key], ...source[key][_key]].sort((a, b) => b[0] - a[0])
          } else {
            target[key][_key] = source[key][_key]
          }
        } else {
          target[key][_key] = source[key][_key]
        }
      }
    } else {
      Object.assign(target, source[key])
    }
  }
  return target
}

const websocket = {
  state: {
    cmdId: 1,
    cmdIdList: [],
    websocket: null,
    sendData: {},
    websocketData: [],
    timer: null,
    sendDataList: []
  },
  mutations: {
    setWebsocketData: (state, data) => {
      if (state.websocketData.some(item => item.subscriptionId === data.subscriptionId)) {
        for (let i = 0; i < state.websocketData.length; i++) {
          const itemInfo = state.websocketData[i]
          if (itemInfo.subscriptionId === data.subscriptionId) {
            state.websocketData[i] = mergeObject(itemInfo, data)
            break
          }
        }
      } else {
        state.websocketData.push(data)
      }
      state.websocketData = [...state.websocketData]
    },
    deleteWebsocketData: (state, cmdIdList) => {
      if (cmdIdList) {
        state.websocketData = state.websocketData.filter(item => cmdIdList.includes(item.subscriptionId))
      } else {
        state.websocketData = []
      }
    },
    setSendData: (state, data) => {
      const key = data.cmdIdList.join()
      state.sendData[key] = data.data
    },
    deleteSendData: (state, key) => {
      if (key) {
        delete state.sendData[key]
      } else {
        state.sendData = {}
      }
    }
  },
  actions: {
    initWebSocket ({ state, dispatch }, wsUrl) {
      state.websocket = new WebSocket(wsUrl)
      state.websocket.onopen = () => dispatch('websocketonopen')
      state.websocket.onmessage = e => dispatch('websocketonmessage', e)
      state.websocket.onerror = () => dispatch('websocketonerror')
      state.websocket.onclose = () => dispatch('websocketclose')
    },
    // 连接成功
    websocketonopen () {
      console.log('websocket连接成功')
    },
    // 数据接收
    websocketonmessage ({ commit }, e) {
      commit('setWebsocketData', (e && JSON.parse(e.data)) || null)
    },
    // 错误
    websocketonerror ({ state }, e) {
      console.log('websocket连接错误', e)
    },
    // 关闭
    websocketclose ({ state, commit }) {
      state.websocket = null
      state.timer && clearTimeout(state.timer)
      state.timer = null
      console.log('websocket关闭')
    },
    // 数据发送
    websocketsend ({ state, dispatch, commit }, data) {
      if (!data.attrSubCmds.length && !data.historyCmds.length && !data.tsSubCmds.length) return
      state.sendDataList.push(data)
      if (!state.websocket) {
        const wsUrl = `${this._vm.$ip('WEBSOCKET_URL')}/api/ws/plugins/telemetry?token=${getToken('token')}`
        dispatch('initWebSocket', wsUrl)
      }
      let cmdId = state.cmdId
      const cmdIdList = []
      for (const key in data) {
        data[key] = data[key].map(ele => {
          cmdIdList.push(cmdId)
          return Object.assign(ele, { cmdId: cmdId++ })
        })
      }
      state.cmdIdList.push(cmdIdList)
      state.cmdId = cmdId
      state.timer && clearTimeout(state.timer)
      state.timer = setTimeout(() => {
        if (state.websocket.readyState === 1) {
          state.sendDataList.forEach((item, index) => {
            state.websocket.send(JSON.stringify(item))
            commit('setSendData', {
              data: item,
              cmdIdList: state.cmdIdList[index]
            })
          })
          state.sendDataList = []
          state.cmdIdList = []
          clearTimeout(state.timer)
        }
      }, 300)
      return cmdIdList
    },
    // 全部数据退订
    websocketAllUnsubscribe ({ state, commit }) {
      if (!state.websocket) return false
      for (const key in state.sendData) {
        const sendData = state.sendData[key]
        for (const _key in sendData) {
          sendData[_key] = sendData[_key].map(ele => Object.assign(ele, { unsubscribe: true }))
        }
        state.websocket.send(JSON.stringify(sendData))
      }
      commit('deleteSendData')
      commit('deleteWebsocketData')
    },
    // 数据退订
    websocketUnsubscribe ({ state, commit }, cmdIdList = []) {
      if (!state.websocket) return false
      const cmdId = cmdIdList.sort((a, b) => a - b).join()
      for (const key in state.sendData) {
        const sendData = state.sendData[key]
        if (key === cmdId) {
          for (const _key in sendData) {
            sendData[_key] = sendData[_key].map(ele => Object.assign(ele, { unsubscribe: true }))
          }
          state.websocket.send(JSON.stringify(sendData))
          commit('deleteSendData', cmdId)
          commit('deleteWebsocketData', cmdIdList)
        }
      }
    }
  }
}

export default websocket
