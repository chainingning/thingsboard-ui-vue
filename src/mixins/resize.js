import resize from 'vue-resize-directive'
export default {
  data () {
    return {
      mixinHeight: '0',
      mixinShowAfterRenderClass: false,
      mixinResizeTime: null,
      handleScrollX: null
    }
  },
  directives: {
    resize
  },
  mounted () {
    this.mixinResize()
  },
  updated () {
    this.mixinUpdatedTableHeight()
  },
  methods: {
    mixinResize () {
      // 防止一段时间内触发多次
      clearTimeout(this.mixinResizeTime)
      this.mixinResizeTime = setTimeout(async () => {
        await this.$nextTick()
        const appContainerHeight = this.$refs.appContainer.offsetHeight
        const filterContainerHeight = (this.$refs.filterContainer && this.$refs.filterContainer.offsetHeight) || 0
        const paginationHeight = (this.$refs.pagination && this.$refs.pagination.$el.offsetHeight) || 0
        this.mixinHeight = appContainerHeight - filterContainerHeight - paginationHeight - 2
      }, 100)
    },
    mixinUpdatedTableHeight () {
      if (this.handleScrollX) return
      /**
       * 用于隐藏固定高度时显示不必要的scrollX的定时器
       * 这是el-table初次渲染时宽度计算的bug，可在渲染后通过重新赋予overflow: auto调整
      */
      this.handleScrollX = setInterval(() => {
        // 检测是否已经生成table节点，如果不是就每隔0.5s检测一次
        // 只有生成了真实节点才能够通过修改overflow属性让浏览器重新计算
        if (this.$refs.configurationTable) {
          this.mixinShowAfterRenderClass = true
          clearInterval(this.handleScrollX)
        }
      }, 500)
    }
  },
  destroyed () {
    this.handleScrollX && clearInterval(this.handleScrollX)
    this.mixinResizeTime && clearTimeout(this.mixinResizeTime)
  }
}
