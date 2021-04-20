import Vue from 'vue'

import App from './App.vue'
import router from './router'
import store from './store'

import './assets/scss/index.scss'
import api from './api'
import './plugins'
import './components'
import * as filters from './filters'
import '@/directive'
import packages from '../packages'
import ElementResizeDetectorMaker from 'element-resize-detector'

Vue.prototype.$api = api
Vue.prototype.$ip = baseURL => {
  if (process.env.NODE_ENV === 'production') {
    return window.IP_CONFIG[baseURL]
  } else {
    return require('./config/proxyIp')[baseURL]
  }
}
Vue.prototype.$erd = ElementResizeDetectorMaker()
// 全局注册过滤器
Object.keys(filters).forEach(k => Vue.filter(k, filters[k]))

Vue.config.productionTip = false

Vue.use(packages)

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
