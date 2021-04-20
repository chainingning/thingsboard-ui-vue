import Vue from 'vue'
import axios from 'axios'

export default {
  data () {
    return {
      styleList: [],
      loading: false
    }
  },
  methods: {
    async render () {
      this.loading = true
      // render css
      const style = document.createElement('style')
      style.type = 'text/css'
      style.rel = 'stylesheet'
      const attributes = this.$refs.renderContainer.attributes
      const containerClass = `.${attributes[1].value}[${attributes[0].name}]`
      const res = await axios.post('/sassmeister/app/dart/compile', {
        input: `${containerClass} { ${this.cssCodes} }`,
        compiler: 'dart',
        syntax: 'scss',
        original_syntax: 'scss',
        output_style: 'expanded'
      })
      if (!res.data.error) {
        style.appendChild(document.createTextNode(res.data.css))
        document.getElementsByTagName('body')[0].appendChild(style)
        this.styleList.push(style)
        if (this.styleList.length > 1) {
          this.styleList[0].parentNode.removeChild(this.styleList[0])
          this.styleList.shift()
        }
      }
      // render js
      const script = document.createElement('script')
      script.type = 'text/javascript'
      script.text = `window.javascriptCodes = ${this.javascriptCodes}`
      document.getElementsByTagName('body')[0].appendChild(script)
      script.parentNode.removeChild(script)
      // render html
      const Component = Vue.extend({
        template: this.htmlCodes,
        ...window.javascriptCodes
      })
      const C = new Component().$mount()
      this.$refs.renderContainer.innerHTML = ''
      this.$refs.renderContainer.appendChild(C.$el)
      this.loading = false
    }
  }
}
