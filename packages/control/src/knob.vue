
<template>
  <div class="knob-container">
    <div ref="chart" class="chart" :id="'chartContent' + (id || '')">
    </div>
  </div>
</template>

<script>
export default {
  name: 'EKnob',
  inject: ['widgetInfo', 'config', 'id'],
  data () {
    return {
      option: {
        // tooltip: { formatter: '{a}<br/>' },
        series: [{
          // name: '业务指标',
          type: 'gauge',
          radius: '95%',
          center: ['50%', '50%'],
          detail: { formatter: '{value}' },
          axisLine: { lineStyle: { width: 15 } },
          splintLine: { length: 15 },
          data: [{
            value: 0,
            name: ''
          }],
          title: {
            show: true,
            offsetCenter: [0, '80%'], // x, y，单位px
            textStyle: { // 其余属性默认使用全局文本样式，详见TEXTSTYLE
              fontWeight: 'bolder'
            }
          },
          min: 0, // 最小的数据值,默认 0 。映射到 minAngle。
          max: 100,
          startAngle: 225,
          endAngle: -45
        }]
      },
      deviceID: '',
      value: 0,
      widgetsconfig: {},
      settings: {
        getValueMethod: 'getValue',
        initialValue: 50,
        maxValue: 80,
        minValue: 10,
        requestTimeout: 500,
        setValueMethod: 'setValue',
        title: ''
      }
    }
  },
  mounted () {
    this.initDatasources()
    this.init()
    this.$erd.listenTo(document.getElementById('chartContent' + (this.id || '')), (element) => {
      this.$nextTick(() => {
        // 使echarts尺寸重置
        this.echarts.resize()
      })
    })
    this.initID()
    // if (this.config) {
    //   this.initID()
    // }
  },
  methods: {
    init () {
      var _this = this
      if (!this.echarts) {
        this.echarts = this.$echarts.init(this.$refs.chart)
      }
      this.echarts.setOption(this.option)
      this.echarts._zr.on('mousedown', event => {
        this.changeValue(event)
        this.echarts._zr.on('mousemove', this.changeValue)
      })
      this.echarts._zr.on('mouseup', event => {
        this.echarts._zr.off('mousemove', this.changeValue)
        if (_this.deviceID) {
          _this.postValue()
        }
      })
    },
    changeValue (event) {
      const x = this.$refs.chart.offsetWidth / 2
      const y = this.$refs.chart.offsetHeight / 2
      const x2 = event.offsetX
      const y2 = event.offsetY
      const diffX = x2 - x
      const diffY = y2 - y
      const maxAngle = 270
      // 返回角度,不是弧度
      const tanAngle = 360 * Math.atan(diffY / diffX) / (2 * Math.PI)
      let currentAngle = 0
      if (diffY > 0 && diffX <= 0 && tanAngle > -90 && tanAngle < -45) {
        currentAngle = 0
      } else if (diffX <= 0 && tanAngle >= -45 && tanAngle <= 90) {
        currentAngle = tanAngle + 45
      } else if (diffX > 0 && tanAngle > -90 && tanAngle <= 45) {
        currentAngle = tanAngle + 225
      } else {
        currentAngle = maxAngle
      }
      const maxValue = parseFloat(this.settings.maxValue) || 100
      const minValue = parseFloat(this.settings.minValue) || 0
      this.value = ((maxValue - minValue) * currentAngle / maxAngle + minValue).toFixed(this.widgetsconfig.decimals || 0)
      this.option.series[0].data[0].value = this.value
    },
    initDatasources () {
      const defaultConfig = this.config && this.config.configuration
        ? this.config.configuration.widgets[this.id].config
        : JSON.parse(this.widgetInfo.descriptor.defaultConfig)
      this.widgetsconfig = { ...defaultConfig }
      this.settings = { ...defaultConfig.settings }
      const option = { ...this.option }
      option.series[0].data[0].value = (parseFloat(this.settings.initialValue) || parseFloat(this.settings.minValue || 0)).toFixed(this.widgetsconfig.decimals || 0)
      option.series[0].data[0].name = this.settings.title + (this.widgetsconfig.units ? ('(' + this.widgetsconfig.units + ')') : '')
      option.series[0].min = parseFloat(this.settings.minValue || 0)
      option.series[0].max = parseFloat(this.settings.maxValue || 100)
      this.option = option
    },
    initID () {
      // if (!this.config.configuration) {
      //   return
      // }
      // var an = en.datasources[0].dataKeys[0].funcBody
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
    async postValue () {
      try {
        await this.$api.postRpcOneway(this.deviceID, {
          method: this.settings.setValueMethod || 'setValue',
          params: this.value,
          timeout: this.settings.requestTimeout || 500
        })
        this.$message.success('设置成功')
      } catch (error) {
        // this.$message.error('error')
      }
    },
    async getInitValue () {
      try {
        const res = await this.$api.getRpcTwoway(this.deviceID, {
          method: this.settings.getValueMethod || 'getValue',
          timeout: this.settings.requestTimeout || 500
        }, true)
        if (Number.isNaN(parseFloat(res.data))) {
          this.value = (this.settings.initialValue ? this.settings.initialValue : this.settings.minValue).toFixed(this.widgetsconfig.decimals || 0)
        } else {
          this.value = res.data
        }
        this.option.series[0].data[0].value = this.value
      } catch (error) {
        this.value = parseFloat(this.settings.initialValue ? this.settings.initialValue : this.settings.minValue).toFixed(this.widgetsconfig.decimals || 0)
        this.option.series[0].data[0].value = this.value
        // this.$message.error('error')
      }
    }
  },
  watch: {
    option: {
      deep: true,
      handler () {
        this.init()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
  .knob-container {
    height: 100%;
  }
  .chart{
    height: 100%;
    width:100%;
  }
</style>
