<template>
  <div>
    <h1 class="text" @click="goUrl">{{settings.buttonText}}</h1>
  </div>
</template>

<script>
export default {
  name: 'ELinkButton',
  inject: ['widgetInfo', 'config', 'id'],
  data () {
    return {
      settings: {
        buttonText: '',
        linkUrl: ''
      }
    }
  },
  methods: {
    goUrl () {
      window.open(this.settings.linkUrl)
    }
  },
  created () {
    const { settings } = this.config
      ? this.config.configuration.widgets[this.id].config
      : JSON.parse(this.widgetInfo.descriptor.defaultConfig)
    this.settings = Object.assign({}, settings)
  }
}
</script>

<style lang="scss" scoped>
  .text {
    cursor: pointer;
  }
</style>
