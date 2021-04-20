<template>
  <component ref="component" :is="componentName" @submit="widgetInfo => $emit('submit', widgetInfo)"></component>
</template>

<script>
const requireComponentsName = {}
const requireComponents = require.context('./', false, /\.vue/)
requireComponents.keys().forEach(fileName => {
  const reqCom = requireComponents(fileName)
  if (reqCom.default && reqCom.default.name) {
    requireComponentsName[reqCom.default.name] = reqCom.default
  }
})
export default {
  components: {
    ...requireComponentsName
  },
  data () {
    return {
      componentName: ''
    }
  },
  methods: {
    openDialog ({ widgetInfo, config, type = 'edit', id }) {
      this.componentName = widgetInfo.descriptor.configTemplate
      if (!this.componentName) {
        this.$message.error('部件包名不正确')
      } else {
        setTimeout(() => {
          this.$refs.component.openDialog({
            widgetInfo,
            config,
            type,
            id
          })
        }, 0)
      }
    }
  }
}
</script>
