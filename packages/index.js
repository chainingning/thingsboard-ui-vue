const install = function (Vue) {
  if (install.installed) return
  const requireComponents = require.context('./', true, /index\.js/)
  requireComponents.keys().forEach(fileName => {
    const reqCom = requireComponents(fileName)
    Object.keys(reqCom.default).forEach(component => {
      Vue.component(component, reqCom.default[component])
    })
  })
}

export default {
  install
}
