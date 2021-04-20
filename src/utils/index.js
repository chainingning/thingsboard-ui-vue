import uuid from 'uuid'
/**
 * 扁平化树形ID，找出属于该ID的一组数据
 * @param {Array} array - 操作的数组
 * @param {String} id - 想筛选出某级ID
 * @param {Boolean} act - 第一次递归标识符，不用传
 * @param {Array} reArr - 最后筛选出来的值，不用传
 */
export function flatChildrenId (array, id, key = id, name = key, children = 'children', act = true, reArr = [], find = false) {
  for (let i = 0; i < array.length; i++) {
    // 递归先把树形分类扁平化
    const e = array[i]
    if (e[key] === id) {
      find = true
      reArr.push(e[name])
      break
    }
    if (Array.isArray(e[children])) {
      const rc = flatChildrenId(e[children], id, key, name, children, false, reArr, find)
      find = rc.find
      reArr = rc.reArr
      if (find) {
        reArr.unshift(e[name])
        break
      }
    }
  }
  // 最终筛选出符合条件的一组
  if (act) return reArr.length ? reArr : [id]
  return {
    find,
    reArr
  }
}

/**
 * 获取时间，带格式
 * @param {Object} params
 * @param {Number} params.timestamp - 时间戳，可传/不穿，默认为当前时间
 * @param {String} params.format - 获取的时间格式，注意中间以空格切分“日期”和“时间”
 *                               - yyyy-MM-dd HH:mm:ss
 *                               - yyyy-MM-dd
 *                               - ...自定义
 */
export function getDate ({
  timestamp = null,
  format = 'yyyy-MM-dd HH:mm:ss'
} = {}) {
  const addZero = (num, len = 2) => (`0${num}`).slice(-len)
  try {
    let formatDate = ''
    const date = timestamp ? new Date(timestamp) : new Date()
    const objData = {}
    objData.yyyy = date.getFullYear()
    objData.MM = addZero(date.getMonth() + 1)
    objData.dd = addZero(date.getDate())
    objData.HH = addZero(date.getHours())
    objData.mm = addZero(date.getMinutes())
    objData.ss = addZero(date.getSeconds())

    format.split(' ').forEach(time => {
      formatDate = formatDate.length ? formatDate + ' ' : formatDate
      // 匹配非英文字母
      const other = time.match(/[^A-Za-z]+/g)
      // 匹配非其他字符
      time.match(/[A-Za-z]+/g).forEach((str, key) => {
        formatDate += `${objData[str]}${other[key] || ''}`
      })
    })
    return formatDate
  } catch (e) {
    console.log(e)
  }
}

// 深拷贝
export function deepCopy (obj) {
  var result = Array.isArray(obj) ? [] : {}
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        result[key] = deepCopy(obj[key])
      } else {
        result[key] = obj[key]
      }
    }
  }
  return result
}

// 转 base64
export function getBase64 (file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    let fileResult = ''
    reader.readAsDataURL(file)
    reader.onload = () => {
      fileResult = reader.result
    }
    reader.onerror = error => {
      reject(error)
    }
    reader.onloadend = () => {
      resolve(fileResult)
    }
  })
}

// 复制
export function copy (code) {
  const input = document.createElement('input')
  input.value = code
  document.body.appendChild(input)
  input.select()
  document.execCommand('copy')
  document.body.removeChild(input)
}

// base64转换成blob流
export function dataURItoBlob (base64Data) {
  var byteString = ''
  if (base64Data.split(',')[0].indexOf('base64') >= 0) {
    byteString = atob(base64Data.split(',')[1])
  } else {
    byteString = unescape(base64Data.split(',')[1])
  }
  var mimeString = base64Data.split(',')[0].split(':')[1].split(';')[0]
  var ia = new Uint8Array(byteString.length)
  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i)
  }
  var blob = new Blob([ia], {
    type: mimeString
  })
  return blob
}

/**
 * @param {Array} header
 * @param {Array} filterVal
 * @param {Array} data
 * @param {String} filename
 */
export function exportTable (header, filterVal, data, filename) {
  import('@/vendor/Export2Excel').then(excel => {
    data = data.map(v => filterVal.map(j => {
      return v[j]
    }))
    excel.export_json_to_excel({
      header,
      data,
      filename
    })
  })
}

export function ellipsis (str, width = 172) {
  if (getFontWidth(str) < 172) {
    return str
  } else {
    const length = str.split('').length
    for (let i = 0; i < length; i++) {
      if (getFontWidth(str.slice(0, i + 1)) >= width) {
        return str.slice(0, i - 6) + '...'
      }
    }
  }
}

export function getFontWidth (str, fontSize = '14px', style = { fontSize, display: 'inline-block' }) {
  const $span = document.createElement('span')
  $span.innerText = str
  for (const key in style) {
    $span.style[key] = style[key]
  }
  document.body.appendChild($span)
  const $width = Math.ceil(parseFloat(window.getComputedStyle($span).width))
  document.body.removeChild($span)
  return $width
}

export function isHasOwnProperty (obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key)
}

// 随机生成uuid
export function getUuid () {
  // function S4 () {
  //   return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)
  // }
  // return (S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4())
  return uuid()
}
// 格式化时间
export function formatTimestamp (timestamp, format = 'yyyy-MM-dd HH:mm:ss') {
  const addZero = (num, len = 2) => (`0${num}`).slice(-len)
  try {
    let formatDate = ''
    const date = timestamp ? new Date(timestamp) : new Date()
    const objData = {}
    objData.yyyy = date.getFullYear()
    objData.MM = addZero(date.getMonth() + 1)
    objData.dd = addZero(date.getDate())
    objData.HH = addZero(date.getHours())
    objData.mm = addZero(date.getMinutes())
    objData.ss = addZero(date.getSeconds())
    objData.SSS = addZero(date.getMilliseconds(), 3)

    format.split(' ').forEach(time => {
      formatDate = formatDate.length ? formatDate + ' ' : formatDate
      // 匹配非英文字母
      const other = time.match(/[^A-Za-z]+/g)
      // 匹配非其他字符
      time.match(/[A-Za-z]+/g).forEach((str, key) => {
        formatDate += `${objData[str]}${other[key] || ''}`
      })
    })
    return formatDate
  } catch (e) {
    console.log(e)
  }
}

export function formatTimeMs (val) {
  const diff = Math.ceil(val / 1000)
  if (diff < 60) { // less 1 hour
    return Math.ceil(diff) + '秒'
  } else if (diff < 3600) { // less 1 hour
    return Math.ceil(diff / 60) + '分'
  } else if (diff < 3600 * 24) {
    return Math.ceil(diff / 3600) + '小时'
  } else if (diff >= 3600 * 24 && diff <= 3600 * 24 * 30) {
    return parseInt(diff / 3600 / 24) + '天'
  } else if (diff > 3600 * 24 * 30) { // 不精确
    return parseInt(diff / 3600 / 24 / 30) + '月'
  }
}

/**
 *  深度比较两个对象是否相同
 * @param {Object} oldData
 * @param {Object} newData
 */
export function equalsObj (oldData, newData) {
  /**
   * 判断此对象是否是Object类型
   * @param {Object} obj
   */
  function isObject (obj) {
    return Object.prototype.toString.call(obj) === '[object Object]'
  }
  /**
   * 判断此类型是否是Array类型
   * @param {Array} arr
   */
  function isArray (arr) {
    return Object.prototype.toString.call(arr) === '[object Array]'
  }
  // 类型为基本类型时,如果相同,则返回true
  if (oldData === newData) return true
  if (isObject(oldData) && isObject(newData) && Object.keys(oldData).length === Object.keys(newData).length) {
    // 类型为对象并且元素个数相同
    // 遍历所有对象中所有属性,判断元素是否相同
    for (const key in oldData) {
      if (Object.prototype.hasOwnProperty.call(oldData, key)) {
        if (!equalsObj(oldData[key], newData[key])) {
          return false
        }
      }
    }
  } else if (isArray(oldData) && isArray(oldData) && oldData.length === newData.length) {
    // 类型为数组并且数组长度相同

    for (let i = 0, length = oldData.length; i < length; i++) {
      if (!equalsObj(oldData[i], newData[i])) {
        return false
      }
    }
  } else {
    // 其它类型,均返回false
    return false
  }
  // 走到这里,说明数组或者对象中所有元素都相同,返回true
  return true
}

// 随机生成颜色
export function randomColor () {
  return `#${Math.random().toString(16).slice(-6)}`
}
