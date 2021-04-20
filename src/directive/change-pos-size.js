import Vue from 'vue'

// 改变应用库部件大小位置全屏
let operType = '' // 操作类型 resize:调节大小 move:移动位置
let isResizing = false // 正在调节部件大小
let isMoving = false // 正在调节部件位置
let isResized = false // 是否调节过部件大小
const colNum = 12 // 页面格数
let coefficient = 100 // 放大系数
const leftWidth = 220 // 左边菜单宽度
const topHeight = 140 // 上部菜单栏高度
const resizeBorder = 10 // 调整大小有效范围
const moveHeader = 50 // 可拖动范围
let isFullscreen = false // 是否全屏
let initPosition = 'absolute' // 部件初始定位

Vue.directive('change-pos-size', {
  bind (el, binding, vnode) {
    initPosition = el.style.position
    initPosSize(el, binding)
    changePosSize(el, binding, vnode)
  },
  update (el, binding, vnode, oldVnode) {
    setTimeout(() => {
      isFullscreen = binding.value.fullscreen
      initPosSize(el, binding)
      fullscreen(el, binding, vnode)
      changePosSize(el, binding, vnode)
    }, 0)
  }
})

function initPosSize (el, binding) { // 计算部件位置大小
  let parentWidth = document.body.clientWidth - leftWidth
  if (el.parentNode) {
    parentWidth = el.parentNode.style.width ? parseInt(el.parentNode.style.width) : (document.body.clientWidth - leftWidth)
  }
  coefficient = parseInt(parentWidth / colNum + '')
  el.style.position = initPosition
  el.style.width = `${binding.value.sizeX * coefficient}px`
  el.style.height = `${binding.value.sizeY * coefficient}px`
  el.style.top = binding.value.row ? `${binding.value.row * coefficient}px` : '0px'
  el.style.left = binding.value.col ? `${binding.value.col * coefficient}px` : '0px'
}

function changePosSize (el, binding, vnode) {
  if (!binding.arg || isFullscreen) { // 非编辑状态以及全屏状态不可编辑
    operType = ''
    el.style.cursor = 'default'
    el.onmousedown = null
    el.onmousemove = null
    document.onmouseup = null
    return
  }
  el.style.position = 'absolute'
  el.onmousemove = ev => { // 监听鼠标位置改变鼠标样式
    const elMoveX = ev.offsetX
    const elMoveY = ev.offsetY
    const { offsetWidth, offsetHeight } = vnode.elm
    const disL = elMoveX
    const disR = offsetWidth - elMoveX
    const disT = elMoveY
    const disB = offsetHeight - elMoveY
    if (disL <= resizeBorder) { // 左边
      el.style.cursor = 'e-resize'
      operType = 'resize'
      if (disB <= resizeBorder) { // 左下角
        el.style.cursor = 'sw-resize'
      } else if (disT <= resizeBorder) { // 左上角
        el.style.cursor = 'se-resize'
      }
    } else if (disR <= resizeBorder) { // 右边
      el.style.cursor = 'e-resize'
      operType = 'resize'
      if (disB <= resizeBorder) { // 右下角
        el.style.cursor = 'se-resize'
      } else if (disT <= resizeBorder) { // 右上角
        el.style.cursor = 'sw-resize'
      }
    } else if (disB <= resizeBorder) { // 下边
      el.style.cursor = 'n-resize'
      operType = 'resize'
    } else if (disT <= resizeBorder) { // 上边
      el.style.cursor = 'n-resize'
      operType = 'resize'
    } else if (disT <= moveHeader && disT > resizeBorder) { // 上边拖动
      el.style.cursor = 'move'
      operType = 'move'
    } else {
      el.style.cursor = 'default'
      operType = ''
    }
  }
  el.onmousedown = ev => {
    el.style.zIndex = '100'
    const { offsetWidth, offsetHeight, offsetTop, offsetLeft } = vnode.elm
    // 父对象滚动位置
    const parTop = vnode.elm.parentNode.scrollTop
    const parLeft = vnode.elm.parentNode.scrollLeft
    // 方块上下左右四个边的位置和方块的长宽
    const T0 = offsetTop
    const B0 = offsetTop + offsetHeight
    const L0 = offsetLeft
    const R0 = offsetLeft + offsetWidth
    const W = offsetWidth
    const H = offsetHeight
    // 设置方块的识别范围
    const areaT = T0 + resizeBorder
    const areaB = B0 - resizeBorder
    const areaL = L0 + resizeBorder
    const areaR = R0 - resizeBorder
    const mouseDownX = ev.pageX
    const mouseDownY = ev.pageY
    const top = parseInt(el.style.top) || 0
    const left = parseInt(el.style.left) || 0
    // 判断改变方块的大小的方向
    const changeL = mouseDownX - leftWidth < areaL - parLeft
    const changeR = mouseDownX - leftWidth > areaR - parLeft
    const changeT = mouseDownY - topHeight < areaT - parTop
    const changeB = mouseDownY - topHeight > areaB - parTop
    if (operType === 'resize') {
      isResizing = true
    }
    if (operType === 'move') {
      isMoving = true
    }
    document.onmousemove = ev => {
      const mouseMoveX = ev.pageX
      const mouseMoveY = ev.pageY
      if (isResizing) {
        // 根据改变方块大小的方向不同进行大小的改变
        // 左
        if (changeL) {
          el.style.width = (mouseDownX - mouseMoveX) + W + 'px'
          el.style.left = L0 - (mouseDownX - mouseMoveX) + 'px'
          isResized = true
        }
        // 右
        if (changeR) {
          el.style.width = (mouseMoveX - mouseDownX) + W + 'px'
          isResized = true
        }
        // 上
        if (changeT) {
          el.style.height = (mouseDownY - mouseMoveY) + H + 'px'
          el.style.top = T0 - (mouseDownY - mouseMoveY) + 'px'
          isResized = true
        }
        // 下
        if (changeB) {
          el.style.height = (mouseMoveY - mouseDownY) + H + 'px'
          isResized = true
        }
        // 限定范围
        if (parseInt(el.style.width) < coefficient * 2) {
          el.style.width = coefficient * 2 + 'px'
        }
        if (parseInt(el.style.height) < coefficient) {
          el.style.height = coefficient + 'px'
        }
      }
      if (isMoving) {
        const moveX = mouseMoveX - mouseDownX
        const moveY = mouseMoveY - mouseDownY
        el.style.left = left + moveX + 'px'
        el.style.top = top + moveY + 'px'
        // 限定拖动范围
        if (parseInt(el.style.left) < 0) {
          el.style.left = '0px'
        }
        if (parseInt(el.style.top) < 0) {
          el.style.top = '0px'
        }
      }
    }
    document.onmouseup = ev => {
      el.style.zIndex = '0'
      operType = ''
      isResizing = false
      isMoving = false
      if (document.onmousemove) {
        const arr = elTLToArr(el)
        binding.value.row = arr[0]
        binding.value.col = arr[1]
        if (isResized) { // 调节过部件大小需要赋值
          const arr = elWHToArr(el)
          binding.value.sizeX = arr[0]
          binding.value.sizeY = arr[1]
        }
        vnode.context[binding.expression] = binding.value
      }
      document.onmousemove = null
    }
  }
}

function fullscreen (el, binding, vnode) {
  const clientX = document.documentElement.clientWidth || document.body.clientWidth
  const clientY = document.documentElement.clientHeight || document.body.clientHeight
  if (isFullscreen) {
    el.style.width = clientX + 'px'
    el.style.height = clientY + 'px'
    el.style.position = 'fixed'
    el.style.zIndex = 100
    el.style.top = 0
    el.style.left = 0
  } else {
    el.style.zIndex = 0
    initPosSize(el, binding, vnode)
  }
}

function elWHToArr (el) {
  const W = parseInt(el.style.width) / coefficient
  const H = parseInt(el.style.height) / coefficient
  const rw = W < 2 ? 2 : W
  const rh = H < 1 ? 1 : H
  return [rw, rh]
}

function elTLToArr (el) {
  const T = parseInt(el.style.top) / coefficient
  const L = parseInt(el.style.left) / coefficient
  return [T, L]
}
