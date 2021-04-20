<script>
import Vue from 'vue'

export default {
  props: {
    widgetInfo: {
      type: Object
    },
    config: {
      type: Object
    },
    id: {
      type: String
    }
  },
  data () {
    return {
      style: null,
      timer: null
    }
  },
  methods: {
    handleCss (css, handleCssCode = '') {
      if (css) {
        const addClassName = 'render-component'
        console.log(this.$el.className)
        this.$el.className = this.$el.className ? `${this.$el.className} ${addClassName}` : addClassName
        css = css.replace(/[\r\n\s]/g, '').replace(/};/g, '}')
        css.split('}').forEach(str => {
          if (str) {
            handleCssCode += `.${addClassName}[${this.$el.attributes[0].name}] ${str}}\n`
          }
        })
      }
      return handleCssCode
    },
    importCss (css) {
      if (this.style) {
        this.style.parentNode.removeChild(this.style)
        this.style = null
      }
      if (!css) return
      this.style = document.createElement('style')
      this.style.type = 'text/css'
      this.style.rel = 'stylesheet'
      this.style.appendChild(document.createTextNode(this.handleCss(css)))
      document.getElementsByTagName('body')[0].appendChild(this.style)
      this.$once('hook:beforeDestroy', () => {
        this.style && this.style.parentNode.removeChild(this.style)
        this.style = null
      })
    },
    importJs (js) {
      if (js) {
        return Function.call(this, `return ${js}`)()
      } else {
        return {}
      }
    }
  },
  render (h) {
    if (JSON.stringify(this.widgetInfo) === '{}' || !this.widgetInfo) {
      return h()
    }
    const { descriptor } = this.widgetInfo || {}
    const { controllerScript } = descriptor || {}
    const widgetInfo = this.widgetInfo
    const config = this.config
    const id = this.id
    const renderCom = Vue.component('render-component', {
      template: descriptor.templateHtml || '<div></div>',
      provide () {
        return {
          widgetInfo,
          config,
          id
        }
      },
      ...this.importJs(controllerScript)
    })
    return h(renderCom)
  },
  watch: {
    widgetInfo: {
      deep: true,
      handler (n) {
        console.log('updateWidgetInfo', n)
        clearInterval(this.timer)
        this.timer = setInterval(() => {
          if (this.$el) {
            this.importCss(this.widgetInfo.descriptor.templateCss)
            clearInterval(this.timer)
          }
        }, 300)
      }
    }
  }
}
</script>

<style lang="scss">
  .render-component {
    height: 100%;
  }
</style>
