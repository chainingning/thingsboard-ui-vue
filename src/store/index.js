import Vue from 'vue'
import Vuex from 'vuex'
import getters from './getters'

Vue.use(Vuex)

const modules = require.context('./modules', false, /\.js$/)

export default new Vuex.Store({
  getters,
  modules: Object.assign({}, ...modules.keys().map(key => ({
    [key.replace(/(^\.\/|\.js$)/g, '')]: modules(key).default
  })))
})
