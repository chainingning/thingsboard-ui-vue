// 环图
<template>
  <div ref="chart" class="chart"></div>
</template>

<script>
export default {
  name: 'ERing',
  inject: ['widgetInfo', 'config', 'id'],
  data () {
    return {
      option: {
        tooltip: {
          formatter: function ({ data, value }) {
            return `${data.name.replace(/^[0-9][0-9]-/, '')}: ${!isNaN(Number(value)) ? Number(value).toFixed(data.decimals || 0) : ''}${data.units || ''}`
          }
        },
        color: [],
        legend: {
          formatter: function (name) {
            return name.replace(/^[0-9][0-9]-/, '')
          },
          data: []
        },
        series: [
          {
            type: 'pie',
            radius: ['50%', '70%'],
            itemStyle: {
              normal: {
                label: {
                  position: 'inner',
                  fontSize: 10,
                  formatter: ({ percent, value }) => {
                    return this.currentConfig.percentage ? percent.toFixed(0) + '%' : value
                  }
                }
              }
            },
            data: []
          },
          {
            type: 'pie',
            radius: ['50%', '70%'],
            itemStyle: {
              normal: {
                label: {
                  position: 'outer',
                  formatter: function ({ name }) {
                    return name.replace(/^[0-9][0-9]-/, '')
                  }
                }
              }
            },
            data: []
          }
        ]
      },
      echarts: null,
      timer: null,
      currentConfig: {},
      datasources: [],
      sendWsData: {
        attrSubCmds: [],
        historyCmds: [],
        tsSubCmds: []
      },
      cmdIdList: []
    }
  },
  computed: {
    wsData () {
      const wsData = {}
      this.$store.state.websocket.websocketData.forEach(item => {
        if (this.cmdIdList.includes(item.subscriptionId)) {
          wsData[item.subscriptionId] = item
        }
      })
      return wsData
    }
  },
  methods: {
    initEchart () {
      if (!this.echarts) {
        this.echarts = this.$echarts.init(this.$refs.chart)
      }
      this.echarts.setOption(this.option)
    },
    getEntityList (entityAliasId) {
      const entityInfo = this.config.configuration.entityAliases[entityAliasId]
      const entityType = entityInfo.filter.type
      return entityInfo.filter[entityType] instanceof Array
        ? entityInfo.filter[entityType].map(id => {
          return {
            entityType: entityInfo.filter.entityType,
            id
          }
        })
        : [entityInfo.filter[entityType]]
    },
    fn (obj, type) {
      const isEntity = type === 'entity'
      const fnBody = isEntity ? obj.postFuncBody || 'return value' : obj.funcBody
      obj.fn = Function.call(this, 'time', 'value', 'prevVaule', 'timePrev', 'prevOrigValue', fnBody)
    },
    async initData () {
      this.currentConfig = this.config
        ? this.config.configuration.widgets[this.id].config
        : JSON.parse(this.widgetInfo.descriptor.defaultConfig)
      this.datasources = this.currentConfig.datasources
      let cmdId = 0
      this.datasources.forEach((item, index) => {
        if (item.type === 'entity') {
          this.getEntityList(item.entityAliasId).forEach(entity => {
            item.dataKeys.forEach((ele, i) => {
              this.fn(ele, item.type)
              const attrName = ele.type === 'timeseries' ? 'tsSubCmds' : 'attrSubCmds'
              const findWsData = this.sendWsData[attrName].find(ele => ele.entityId === entity.id)
              if (findWsData) {
                findWsData.keys.push({
                  name: ele.name,
                  index: [index, i]
                })
              } else {
                this.sendWsData[attrName].push({
                  entityId: entity.id,
                  entityType: entity.entityType,
                  keys: [
                    {
                      name: ele.name,
                      index: [index, i]
                    }
                  ]
                })
              }
            })
          })
        } else {
          item.dataKeys.forEach(ele => {
            this.fn(ele, item.type)
          })
        }
      })
      Object.keys(this.sendWsData).forEach((key, index) => {
        this.sendWsData[key] = this.sendWsData[key].map(row => {
          cmdId++
          return {
            ...row,
            keys: [...new Set(row.keys.map(ele => {
              const info = this.datasources[ele.index[0]].dataKeys[ele.index[1]]
              if (!info.cmdId) {
                info.cmdId = {}
              }
              info.cmdId[row.entityId] = cmdId
              return ele.name
            }))].join(',')
          }
        })
      })
      this.cmdIdList = await this.$store.dispatch('websocketsend', this.sendWsData)
    },
    setOption () {
      const _data = []
      const legend = []
      const color = []
      let si = 0
      this.datasources.forEach((item, index) => {
        if (item.type === 'entity') {
          this.getEntityList(item.entityAliasId).forEach(entity => {
            item.dataKeys.forEach((ele, i) => {
              const cmdId = String(this.cmdIdList[ele.cmdId[entity.id] - 1])
              const { data } = this.wsData[cmdId] || {}
              const keyData = (data && (data[ele.name] || null)) || null
              const name = `${index}${i}-${ele.label}`
              if (!legend.includes(name)) {
                color.push(ele.color)
                legend.push(name)
                si++
              }
              const prevVaule = (this.option.series.length && this.option.series[0].data && this.option.series[0].data.value) || 0
              const timePrev = (
                this.option.series[0].data[si - 1] &&
                this.option.series[0].data[si - 1].timePrevList &&
                this.option.series[0].data[si - 1].timePrevList[0]
              ) || new Date().getTime()
              const prevOrigValue = (this.option.series[0].data.prevVauleList && this.option.series[0].data.prevVauleList[0]) || 0
              if (keyData) {
                _data.push({
                  value: ele.fn(keyData[0][0], keyData[0][1], prevVaule, timePrev, prevOrigValue),
                  name,
                  timePrevList: [keyData[0][0]],
                  prevVauleList: [keyData[0][1]],
                  decimals: ele.decimals,
                  units: ele.units
                })
              } else {
                _data.push({
                  value: ele.fn(new Date().getTime(), 0, prevVaule, 0, 0),
                  name,
                  decimals: ele.decimals,
                  units: ele.units
                })
              }
            })
          })
        } else {
          item.dataKeys.forEach((ele, i) => {
            const name = `${index}${i}-${ele.label}`
            color.push(ele.color)
            legend.push(name)
            si++
            const prevVaule = (this.option.series.length && this.option.series[0].data.value) || 0
            const timePrev = (
              this.option.series.length &&
              this.option.series[0].data[si - 1] &&
              this.option.series[0].data[si - 1].timePrevList[0]
            ) || new Date().getTime()
            const time = new Date().getTime()
            _data.push({
              value: ele.fn(time, 0, prevVaule, timePrev, 0),
              name,
              timePrevList: [time],
              decimals: ele.decimals,
              units: ele.units
            })
          })
        }
      })
      this.option.series[0].data = _data
      this.option.series[1].data = _data
      this.option.legend.data = legend
      this.option.color = color
    },
    loop () {
      this.timer = setInterval(() => {
        this.setOption()
      }, 1000)
    }
  },
  created () {
    this.initData()
    this.loop()
  },
  beforeDestroy () {
    clearInterval(this.timer)
    this.timer = null
    this.$store.dispatch('websocketUnsubscribe', this.cmdIdList)
  },
  watch: {
    option: {
      deep: true,
      handler () {
        this.initEchart()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.chart {
  width: 100%;
  height: 100%;
}
</style>
