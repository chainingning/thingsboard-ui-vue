import Vue from 'vue'

let offsetWidth = 0
let offsetHeight = 0
let initPosition = ''
let marginLeft = 0

function fullscreen (el, binding) {
  const isFullscreen = binding.value
  const clientX = document.documentElement.clientWidth || document.body.clientWidth
  const clientY = document.documentElement.clientHeight || document.body.clientHeight
  el.style.width = (isFullscreen ? clientX : offsetWidth) + 'px'
  el.style.height = (isFullscreen ? clientY : offsetHeight) + 'px'
  el.style.position = isFullscreen ? 'fixed' : initPosition
  el.style.zIndex = isFullscreen ? 100 : 0
  el.style.marginLeft = isFullscreen ? 0 : marginLeft
  if (isFullscreen) {
    el.style.top = 0
    el.style.left = 0
  }
}

/**
 * 全屏指令
 * v-fullscreen="true" 全屏
*/
Vue.directive('fullscreen', {
  bind (el, binding, vnode) {
    initPosition = el.style.position
    marginLeft = el.style.marginLeft
    setTimeout(() => {
      offsetWidth = vnode.elm.offsetWidth
      offsetHeight = vnode.elm.offsetHeight
      fullscreen(el, binding)
    }, 0)
  },
  update (el, binding, vnode) {
    fullscreen(el, binding)
  }
})
