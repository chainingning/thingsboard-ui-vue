import router, { routerList, resetRouter } from '@/router'

const permission = {
  state: {
    permissionRouter: []
  },
  mutations: {
    // 权限路由
    SET_PERMISSION_ROUTER: (state, auth) => {
      resetRouter()
      if (auth) {
        state.permissionRouter = routerList.filter(router => router.auth.includes(auth))
        router.addRoutes(state.permissionRouter)
      } else {
        router.push({ path: '/login' })
      }
    }
  }
}

export default permission
