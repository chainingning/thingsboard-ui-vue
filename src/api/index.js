/**
 * modules下各个函数名称不可重复
 */
const requireAll = requireContext => requireContext.keys().reduce((prev, cur) => {
  return Object.assign(prev, requireContext(cur).default)
}, {})
const req = require.context('./modules', false, /\.js$/)
export default requireAll(req) || {}
