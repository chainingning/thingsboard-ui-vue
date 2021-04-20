const exportAllComponents = {}
const requireComponents = require.context('./', true, /\.vue/)
requireComponents.keys().forEach(fileName => {
  const reqCom = requireComponents(fileName)
  reqCom.default.install = function (Vue) {
    Vue.component(reqCom.default.name, reqCom.default)
  }
  if (reqCom.default && reqCom.default.name) {
    exportAllComponents[reqCom.default.name] = reqCom.default
  }
})

export default exportAllComponents
