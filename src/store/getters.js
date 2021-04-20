const getters = {
  userInfo: state => {
    if (JSON.stringify(state.user.userInfo) === '{}') {
      return JSON.parse(window.sessionStorage.getItem('userInfo') || '{}')
    } else {
      return state.user.userInfo || {}
    }
  },
  permissionRouter: state => {
    return state.permission.permissionRouter
  },
  websocketData: state => state.websocket.websocketData,
  cashViewList: state => state.cash.cashViewList
}

export default getters
