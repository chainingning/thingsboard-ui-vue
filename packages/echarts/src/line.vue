// 折线图
<template>
  <div class="chart-container">
    <el-button v-if="widgetsconfig.displayTimewindow" type="primary" title="编辑时间窗口" @click="editTimeDialog" class="margin-bottom">
      <i class="el-icon-time el-icon--left"></i>{{timewindow | formatConfigTime}}
    </el-button>
    <div ref="chart" class="chart"></div>
    <time-window-dialog class="time" ref="timeWindowDialog" @submit="submitTimewindow"></time-window-dialog>
  </div>
</template>

<script>
import { getDate, formatTimestamp, formatTimeMs } from '@/utils'
import timeWindowDialog from '@/views/dashboards/components/time-window-dialog'
export default {
  name: 'ELine',
  inject: ['widgetInfo', 'config', 'id'],
  components: {
    timeWindowDialog
  },
  data () {
    return {
      option: {
        tooltip: {
          trigger: 'axis',
          formatter: function (params) {
            const time = `<div>${params[0].axisValue}</div>`
            const html = params.map(item => {
              return `<div>
                ${item.seriesName.replace(/^[0-9][0-9]-/, '')}: 
                ${!isNaN(Number(item.value[1])) ? Number(item.value[1]).toFixed(item.value[2] || 0) : ''}${item.value[3] || ''}
              </div>`
            }).join('')
            return `${time}${html}`
          }
        },
        color: [],
        legend: {
          formatter: function (name) {
            return name.replace(/^[0-9][0-9]-/, '')
          },
          data: []
        },
        xAxis: {
          type: 'category'
        },
        yAxis: {
          type: 'value'
        },
        series: []
      },
      echarts: null,
      timer: null,
      datasources: [],
      sendWsData: {
        attrSubCmds: [],
        historyCmds: [],
        tsSubCmds: []
      },
      cmdIdList: [],
      widgetsconfig: {},
      timewindow: {}
    }
  },
  computed: {
    wsData () {
      const wsData = {}
      this.$store.state.websocket.websocketData.forEach(item => {
        if (this.cmdIdList.includes(item.subscriptionId)) {
          wsData[item.subscriptionId] = item
          const data = wsData[item.subscriptionId].data
          data && Object.keys(data).forEach(key => {
            data[key] = data[key].sort((a, b) => a[0] - b[0]).slice(0, 30)
          })
        }
      })
      return wsData
    }
  },
  methods: {
    editTimeDialog () {
      if (!this.timewindow.selectedTab) {
        this.timewindow.selectedTab = 0
      }
      if (!this.timewindow.realtime) {
        this.timewindow.realtime = {
          interval: 1000,
          timewindowMs: 60000
        }
      }
      if (!this.timewindow.aggregation) {
        this.timewindow.aggregation = {
          type: 'NONE',
          limit: 200
        }
      }
      if (!this.timewindow.history) {
        const now = new Date().getTime()
        this.timewindow.history = {
          fixedTimewindow: {
            startTimeMs: now - 60000,
            endTimeMs: now
          },
          historyType: 1,
          interval: 1000,
          timewindowMs: 60000
        }
      }
      this.$refs.timeWindowDialog.openDialog(this.timewindow)
    },
    submitTimewindow (val) {
      this.timewindow = val
    },
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
      this.widgetsconfig = this.config
        ? this.config.configuration.widgets[this.id].config
        : JSON.parse(this.widgetInfo.descriptor.defaultConfig)
      this.datasources = this.widgetsconfig.datasources
      if (this.widgetsconfig.displayTimewindow) {
        this.timewindow = this.widgetsconfig.timewindow || {
          selectedTab: 0,
          realtime: {
            interval: 1000,
            timewindowMs: 60000
          },
          aggregation: {
            type: 'NONE',
            limit: 200
          }
        }
      } else {
        this.timewindow = (this.config && this.config.configuration.timewindow) || {
          selectedTab: 0,
          realtime: {
            interval: 1000,
            timewindowMs: 60000
          },
          aggregation: {
            type: 'NONE',
            limit: 200
          }
        }
      }
      let cmdId = 0
      const timewindow = {}
      const limit = this.timewindow.aggregation ? this.timewindow.aggregation.limit : 60
      if (this.timewindow.selectedTab === 1) {
        timewindow.interval = this.timewindow.aggregation && this.timewindow.aggregation.type !== 'NONE' && this.timewindow.history ? this.timewindow.history.interval : 1000
        if (this.timewindow.history && this.timewindow.history.historyType === 1) {
          timewindow.startTs = this.timewindow.history.fixedTimewindow && this.timewindow.history.fixedTimewindow.startTimeMs
          timewindow.endTs = this.timewindow.history.fixedTimewindow && this.timewindow.history.fixedTimewindow.endTimeMs
        } else {
          timewindow.timeWindow = this.timewindow.history ? this.timewindow.history.timewindowMs : 1000
          timewindow.endTs = new Date().getTime()
          timewindow.startTs = timewindow.endTs - timewindow.timeWindow
        }
        timewindow.limit = parseInt((timewindow.endTs - timewindow.startTs) / timewindow.interval) || limit
        timewindow.limit = this.timewindow.aggregation && this.timewindow.aggregation.type !== 'NONE' ? timewindow.limit : limit
      } else {
        timewindow.interval = this.timewindow.aggregation && this.timewindow.aggregation.type !== 'NONE' && this.timewindow.realtime ? this.timewindow.realtime.interval : 1000
        timewindow.timeWindow = this.timewindow.realtime ? this.timewindow.realtime.timewindowMs : 1000
        timewindow.startTs = Math.floor(new Date().getTime() / timewindow.interval) * timewindow.interval - timewindow.timeWindow
        timewindow.limit = parseInt((timewindow.timeWindow) / timewindow.interval) || limit
        timewindow.limit = this.timewindow.aggregation && this.timewindow.aggregation.type !== 'NONE' ? timewindow.limit : limit
      }
      this.datasources.forEach((item, index) => {
        item.limit = timewindow.limit
        if (item.type === 'entity') {
          this.getEntityList(item.entityAliasId).forEach(entity => {
            item.dataKeys.forEach((ele, i) => {
              this.fn(ele, item.type)
              const attrName = ele.type === 'timeseries' ? (this.timewindow.selectedTab === 1 ? 'historyCmds' : 'tsSubCmds') : 'attrSubCmds'
              const findWsData = this.sendWsData[attrName].find(ele => ele.entityId === entity.id)
              if (findWsData) {
                if (findWsData.keys instanceof Array) {
                  findWsData.keys.push({
                    name: ele.name,
                    index: [index, i]
                  })
                }
              } else {
                const entityData = {
                  entityId: entity.id,
                  entityType: entity.entityType,
                  keys: [
                    {
                      name: ele.name,
                      index: [index, i]
                    }
                  ],
                  agg: this.timewindow.aggregation ? this.timewindow.aggregation.type : 'NONE',
                  interval: timewindow.interval
                }
                if (this.timewindow.selectedTab === 1 && attrName === 'historyCmds') {
                  // if (this.timewindow.history && this.timewindow.history.historyType === 1) {
                  entityData.startTs = timewindow.startTs
                  entityData.endTs = timewindow.endTs
                  entityData.limit = timewindow.limit
                  // }
                } else if (attrName === 'tsSubCmds') {
                  entityData.timeWindow = timewindow.timeWindow
                  entityData.startTs = timewindow.startTs
                  entityData.limit = timewindow.limit
                } else {
                  delete entityData.agg
                  delete entityData.interval
                }
                // if (this.timewindow.selectedTab !== 1 || attrName !== 'attrSubCmds') {
                //   this.sendWsData[attrName].push(entityData)
                // }
                console.log(entityData)
                this.sendWsData[attrName].push(entityData)
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
      const legend = []
      const color = []
      const series = []
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
              if (keyData) {
                series.push({
                  name,
                  type: 'line',
                  data: keyData.map((row, r) => {
                    const prevVaule = (this.option.series.length && this.option.series[si - 1].data[r] && this.option.series[si - 1].data[r][1]) || 0
                    const timePrev = (this.option.series.length && this.option.series[si - 1].data[r] && this.option.series[si - 1].data[r][0]) || new Date().getTime()
                    const prevOrigValue = (this.option.series.length && this.option.series[si - 1].prevVauleList && this.option.series[si - 1].prevVauleList[r]) || 0
                    return [getDate({ timestamp: row[0] }), ele.fn(row[0], row[1], prevVaule, timePrev, prevOrigValue), ele.decimals, ele.units]
                  }),
                  prevVauleList: keyData.map(row => row[1])
                })
              } else {
                series.push({
                  name,
                  type: 'line',
                  data: []
                })
              }
            })
          })
        } else {
          item.dataKeys.forEach((ele, i) => {
            const name = `${index}${i}-${ele.label}`
            let time = new Date().getTime()
            color.push(ele.color)
            legend.push(name)
            si++
            const prevVaule = (this.option.series.length && this.option.series[si - 1].data[0][1]) || 0
            const timePrev = (this.option.series.length && this.option.series[si - 1].data[0][0]) || time
            const data = []
            for (let ii = 0; ii < 30; ii++) {
              time += 60000
              data.push([getDate({ timestamp: time }), ele.fn(time, 0, prevVaule, timePrev, 0), ele.decimals, ele.units])
            }
            series.push({
              name,
              type: 'line',
              data
            })
          })
        }
      })
      this.option.series = series
      this.option.legend.data = legend
      this.option.color = color
    },
    loop () {
      this.timer = setInterval(() => {
        this.setOption()
      }, 1000)
    },
    restart () {
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }
      this.$store.dispatch('websocketUnsubscribe', this.cmdIdList)
      this.sendWsData = {
        attrSubCmds: [],
        historyCmds: [],
        tsSubCmds: []
      }
      this.initData()
      this.loop()
    }
  },
  created () {
    this.initData()
    this.loop()
  },
  filters: {
    formatConfigTime: function (val) {
      var str = ''
      if (val.selectedTab === 1) {
        str = '历史 - '
        if (val.history.historyType === 1) {
          str = str + ' 从 ' + formatTimestamp(val.history.fixedTimewindow.startTimeMs) + ' 到 ' + formatTimestamp(val.history.fixedTimewindow.endTimeMs)
        } else {
          str = str + '最后 ' + formatTimeMs(val.history.timewindowMs)
        }
      } else {
        str = '实时 - 最后 ' + (val.realtime ? formatTimeMs(val.realtime.timewindowMs) : '1分')
      }
      return str
    }
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
    },
    timewindow: {
      deep: true,
      handler (newVal, oldVal) {
        if (this.widgetsconfig.displayTimewindow) {
          this.widgetsconfig.timewindow = newVal
        } else {
          if (this.config && this.config.configuration.timewindow) {
            this.config.configuration.timewindow = newVal
          } else {
            this.widgetsconfig.timewindow = newVal
          }
        }
        this.restart()
      }
    },
    'config.configuration.timewindow': {
      deep: true,
      handler (newVal, oldVal) {
        if (!this.widgetsconfig.displayTimewindow) {
          this.timewindow = newVal
        }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.chart-container {
  width: 100%;
  height: 100%;
  .chart {
    width: 100%;
    height: calc(100% - 40px);
  }
}
</style>
