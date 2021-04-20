
<template>
  <div class="switch-container">
    <el-switch
    class="button"
      v-model="value"
      @change="postValue"
      active-color="#13ce66"
      inactive-color="#7e807b"
      :active-text="this.settings.showOnOffLabels?'开':''"
      :inactive-text="this.settings.showOnOffLabels?'关':''">
    </el-switch>
  </div>
</template>

<script>
export default {
  name: 'ESwitch',
  inject: ['widgetInfo', 'config', 'id'],
  data () {
    return {
      deviceID: '',
      value: false,
      settings: {
        initialValue: false,
        title: '',
        showOnOffLabels: true,
        retrieveValueMethod: 'rpc',
        valueKey: 'value',
        getValueMethod: 'getValue',
        setValueMethod: 'setValue',
        parseValueFunction: 'return data ? true : false',
        convertValueFunction: 'return value',
        requestTimeout: 500
      },
      widgetsconfig: {}
    }
  },
  mounted () {
    this.initDatasources()
    this.initID()
  },
  methods: {
    initDatasources () {
      const defaultConfig = this.config && this.config.configuration
        ? this.config.configuration.widgets[this.id].config
        : JSON.parse(this.widgetInfo.descriptor.defaultConfig)
      this.widgetsconfig = { ...defaultConfig }
      this.settings = { ...defaultConfig.settings }
      this.settings.parseFunction = Function.call(this, 'data', this.settings.parseValueFunction)
    },
    initID () {
      const aliasID = this.widgetsconfig.targetDeviceAliasIds ? this.widgetsconfig.targetDeviceAliasIds[0] : ''

      // 别名id不存在
      if (!aliasID) {
        return
      }
      const device = this.config.configuration.entityAliases[aliasID]
      const entityType = device.filter.type
      // type类型
      if (entityType === 'entityName') {
        return
      }
      this.deviceID = this.getDeviceID(device).id
      this.getInitValue()
    },
    // 获取设备ID
    getDeviceID (device) {
      const entityType = device.filter.type
      const entityInfo = device.filter[entityType] instanceof Array
        ? {
          id: device.filter[entityType][0]
        }
        : {
          id: device.filter[entityType].id
        }
      return entityInfo
    },
    async postValue (value) {
      if (this.config && this.deviceID) {
        try {
          await this.$api.postRpcOneway(this.deviceID, {
            method: this.settings.setValueMethod || 'setValue',
            params: value,
            timeout: this.settings.requestTimeout || 500
          })
          this.$message.success('设置成功')
        } catch (error) {
        // this.$message.error('error')
        }
      }
    },
    async getInitValue () {
      try {
        const res = await this.$api.getRpcTwoway(this.deviceID, {
          method: this.settings.getValueMethod || 'getValue',
          timeout: this.settings.requestTimeout || 500
        }, true)
        if (res.data instanceof Boolean) {
          this.value = res.data
        } else {
          this.value = this.settings.parseFunction(res.data)
        }
      } catch (error) {
        // this.$message.error('error')
        this.value = this.settings.initialValue
      }
    }
  },
  watch: {

  }
}
</script>

<style lang="scss" scoped>
.switch-container {
    height: 100%;
  }

</style>
