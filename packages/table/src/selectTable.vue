<template>
  <div class="table-container">
    <el-button v-if="widgetsconfig.displayTimewindow" type="primary" title="编辑时间窗口" @click="editTimeDialog" class="margin-bottom margin-right">
      <i class="el-icon-time el-icon--left"></i>{{timewindow | formatConfigTime}}
    </el-button>

    <el-select class="select-margin" v-model="activeTabName" filterable placeholder="请选择" @change="handleClick">
      <el-option
        v-for="(tab,tabIndex) in tabs"
        :key="tabIndex"
        :label="tab.label"
        :value="tab.index">
      </el-option>
    </el-select>
    <el-button type="primary" :loading="exportLoading" icon="el-icon-download" @click="exportExcel" class="margin-bottom margin-left">下载
    </el-button>

    <el-table :data="tableData"  :height="tableHeight"  @sort-change='tableSortChange'>
      <el-table-column
        v-for="(item, index) in listTitle"
        :key="index"
        :prop="item.property"
        :label="item.label"
        sortable
        :formatter="formatFn"
      >
      </el-table-column>
    </el-table>

    <el-pagination
      v-if="settings.displayPagination"
      @size-change="getList()"
      @current-change="getList()"
      :current-page.sync="page"
      background
      :page-size.sync="settings.defaultPageSize"
      :page-sizes="[parseInt(settings.defaultPageSize)]"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
    ></el-pagination>

    <time-window-dialog ref="timeWindowDialog" @submit="submitTimewindow"></time-window-dialog>
  </div>

</template>

<script>
import { formatTimestamp, formatTimeMs } from '@/utils'
import timeWindowDialog from '@/views/dashboards/components/time-window-dialog'
import FileSaver from 'file-saver'
import XLSX from 'xlsx'
export default {
  name: 'ETableSelect',
  inject: ['widgetInfo', 'config', 'id'],
  // props: {
  //   tableHeight: {
  //     type: String,
  //     default: 'calc(100% - 32px)'
  //   }

  // },
  components: {
    timeWindowDialog
  },
  data () {
    return {
      tableHeight: 'calc(100% - 32px)',
      widgetsconfig: {},
      timewindow: {},
      datasources: [],
      entityAliases: {},
      tabs: [],
      tabCount: 0,
      list: [],
      origList: [],
      listTitle: [],
      timer: null,
      page: 1,
      pageSize: 10,
      total: 0,
      // cmdIds: [],
      fnData: {},
      activeTabName: '0',
      // cmdIdsToEntityId: {},
      tableData: [],
      sort: {
        order: null,
        prop: ''
      },
      limit: 60,
      sendWsData: {
        attrSubCmds: [],
        historyCmds: [],
        tsSubCmds: []
      },
      listData: {},
      firstWsData: {},
      settings: {
        defaultPageSize: 10,
        displayPagination: true,
        showMilliseconds: true,
        showTimestamp: true
      },
      fnOrginData: {},
      timerLoopCurrent: null,
      exportLoading: false
      // cmdIdList: []
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
    tableSortChange (column) {
      this.sort.order = column.order
      this.sort.prop = column.prop
      this.getList()
    },
    handleClick (tab) {
      this.activeTabName = tab
      this.listTitle = this.tabs[this.activeTabName].listTitle || []
      this.list = []
      this.list = this.tabs[this.activeTabName].list
      this.total = this.list.length || 0
      this.getList()
    },
    getEntityList (entityAliasId) {
      const entityInfo = this.entityAliases[entityAliasId]
      const entityType = entityInfo.filter.type
      return entityInfo.filter[entityType] instanceof Array
        ? entityInfo.filter[entityType].map(id => {
          return {
            entityType: entityInfo.filter.entityType,
            id: id
          }
        })
        : [entityInfo.filter[entityType]]
    },
    fn (obj, type) {
      const isEntity = type === 'entity'
      const fnBody = isEntity ? obj.postFuncBody || 'return value' : obj.funcBody || 'return prevValue+1'
      obj.fn = isEntity ? Function.call(this, 'time', 'value', 'prevValue', 'timePrev', 'prevOrigValue', fnBody) : Function.call(this, 'time', 'prevValue', fnBody)
    },
    initDatasources () {
      this.widgetsconfig = this.config
        ? this.config.configuration.widgets[this.id].config
        : JSON.parse(this.widgetInfo.descriptor.defaultConfig)
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
      this.settings = {
        defaultPageSize: parseInt(this.widgetsconfig.settings.defaultPageSize) || 10,
        displayPagination: this.widgetsconfig.settings.displayPagination === undefined ? true : this.widgetsconfig.settings.displayPagination,
        showMilliseconds: this.widgetsconfig.settings.showMilliseconds === undefined ? false : this.widgetsconfig.settings.showMilliseconds,
        showTimestamp: this.widgetsconfig.settings.showTimestamp === undefined ? true : this.widgetsconfig.settings.showTimestamp
      }
      this.datasources = this.widgetsconfig.datasources
      this.entityAliases = (this.config && this.config.configuration.entityAliases) || {}
    },
    async initData () {
      // const datasources = [...this.datasources]
      let cmdId = 0
      this.tabs = []
      this.tabCount = 0
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
                if (this.timewindow.selectedTab !== 1 || attrName !== 'attrSubCmds') {
                  this.sendWsData[attrName].push(entityData)
                }
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
      await this.initTab()
      this.cmdIdList = await this.$store.dispatch('websocketsend', this.sendWsData)
      const timeType = this.timewindow && this.timewindow.selectedTab === 1 ? 'history' : 'realtime'
      var endTs = timewindow.endTs
      if (timeType === 'realtime') {
        endTs = timewindow.startTs + timewindow.timeWindow
      }
      this.tabs.forEach((activeTab, index) => {
        if (activeTab.type === 'function') {
          this.$set(activeTab, 'endTs', endTs)
          this.$set(activeTab, 'startTs', timewindow.startTs)
          this.$set(activeTab, 'interval', timewindow.interval)
          this.setFunctionTableInit(activeTab)
        }
      })
      this.setFunctionTable()
      if (timeType === 'realtime') {
        this.loop()
      }
    },
    async initTab () {
      for (let index = 0; index < this.datasources.length; index++) {
        var item = this.datasources[index]
        const listTitle = item.dataKeys
          ? item.dataKeys.map((ele, eleIndex) => {
            return {
              ...ele,
              property: ele.name + '-' + eleIndex,
              name: ele.name + '-' + eleIndex
            }
          }) : []
        if (this.settings.showTimestamp) {
          listTitle.unshift({
            property: 'timestamp',
            label: '时间戳',
            name: 'timestamp',
            type: 'timestamp',
            fn: (val) => { return this.settings.showMilliseconds ? formatTimestamp(val, 'yyyy-MM-dd HH:mm:ss.SSS') : formatTimestamp(val, 'yyyy-MM-dd HH:mm:ss') }
          })
        }
        if (item.type === 'entity') {
          await this.initEntityTabs(item, listTitle)
        } else {
          const activeTab = {
            ...item,
            label: item.name || 'FUNCTION',
            name: index.toString(),
            index: this.tabCount.toString(),
            listTitle: listTitle.map(row => {
              return {
                ...row,
                index: this.tabCount.toString()
              }
            }),
            type: item.type
          }
          this.tabs.push(activeTab)
          this.tabCount++
        }
        if (index === 0) {
          this.activeTabName = '0'
          this.listTitle = (this.tabs[0] && this.tabs[0].listTitle) || []
        }
      }
    },
    async initEntityTabs (item, listTitle) {
      const entityAliasId = item.entityAliasId
      const type = item.type
      const entityInfo = this.entityAliases[entityAliasId]
      const entityType = entityInfo.filter.type
      const entitylistInfo = entityInfo.filter[entityType] instanceof Array
        ? {
          entityType: entityInfo.filter.entityType,
          id: entityInfo.filter[entityType].join(',')
        }
        : entityInfo.filter[entityType]
      // var apiName = ''
      var params = {
        page: this.page - 1,
        pageSize: this.settings.defaultPageSize,
        startTime: 1606117543888,
        searchStatus: 'ANY',
        ascOrder: false
      }
      var result = null
      switch (entitylistInfo.entityType) {
        case 'DEVICE':
          result = await this.$api.getDevices(
            { ...params, deviceIds: entitylistInfo.id }
          )
          break
        case 'ASSET':
          result = await this.$api.getAssets(
            { ...params, assetIds: entitylistInfo.id }
          )
          break
        case 'ENTITY_VIEW':
          result = await this.$api.getEntityView(
            entitylistInfo.id
          )
          break
        case 'TENANT':
          result = await this.$api.getTenantInfos(this.$store.getters.userInfo.tenantId.id)
          break
        case 'CUSTOMER':
          result = await this.$api.getCustomersInfo(entitylistInfo.id)
          break
        case 'DASHBOARD':
          result = await this.$api.getDashboardInfo(entitylistInfo.id)
          break
        default:
          break
      }
      const tabs = result.data ? (result.data instanceof Array ? result.data : [result.data]) : []
      tabs.map((tab, index) => {
        this.tabs.push({
          ...item,
          label: tab.name,
          name: tab.id.id,
          index: this.tabCount.toString(),
          listTitle: listTitle.map(row => {
            return {
              ...row,
              index: this.tabCount.toString()
            }
          }),
          type: type
        })
        this.tabCount++
      })
    },
    formatFn (row, column, cellValue, index) {
      const listTitle = this.tabs[this.activeTabName] ? this.tabs[this.activeTabName].listTitle : []
      var value = row[column.property]
      if (listTitle.length > 0) {
        if (column.property === 'timestamp') {
          value = listTitle[0].fn(cellValue)
        } else {
          listTitle.forEach((item) => {
            if (item.property === column.property) {
              if (parseFloat(value) || parseFloat(value) === 0) {
                if (item.decimals || this.widgetsconfig.decimals) {
                  value = parseFloat(value).toFixed((item.decimals || item.decimals === 0) ? item.decimals : this.widgetsconfig.decimals)
                }
                value = value + (item.units ? item.units : this.widgetsconfig.units ? this.widgetsconfig.units : '')
              }
            }
          })
        }
      }
      return value
    },
    sum (arr) {
      var result = 0
      arr.forEach(item => {
        result += parseFloat(item)
      })
      return result || ''
    },
    avg (arr) {
      var result = 0
      arr.forEach(item => {
        result += parseFloat(item)
      })
      return arr.length > 0 ? ((result / arr.length) || '') : ''
    },
    getList () {
      const newList = this.sort.order ? [...this.list].sort(this.compare(this.sort.prop, this.sort.order)) : [...this.list]
      this.tableData = newList.slice((this.settings.defaultPageSize * (this.page - 1)), (this.settings.defaultPageSize * this.page))
    },
    loop () {
      this.timer = setInterval(() => {
        this.setFunctionTableLoop()
      }, ((this.timewindow.aggregation && this.timewindow.aggregation.type !== 'NONE' && this.timewindow.realtime && this.timewindow.realtime.interval >= 5000) ? 5000 : 1000))
      this.timerLoopCurrent = setInterval(() => {
        this.setFunctionTable()
      }, ((this.timewindow.aggregation && this.timewindow.aggregation.type !== 'NONE' && this.timewindow.realtime && this.timewindow.realtime.interval) || 1000))
    },
    compare (prop, order) {
      return function (obj1, obj2) {
        var val1 = obj1[prop]
        var val2 = obj2[prop]
        if (!isNaN(Number(val1)) && !isNaN(Number(val2))) {
          val1 = Number(val1)
          val2 = Number(val2)
        }
        if (order === 'ascending') {
          if (val1 < val2) {
            return -1
          } else if (val1 > val2) {
            return 1
          } else {
            return 0
          }
        } else {
          if (val1 > val2) {
            return -1
          } else if (val1 < val2) {
            return 1
          } else {
            return 0
          }
        }
      }
    },
    restart () {
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }
      if (this.timerLoopCurrent) {
        clearInterval(this.timerLoopCurrent)
        this.timerLoopCurrent = null
      }
      this.$store.dispatch('websocketUnsubscribe', this.cmdIdList)
      this.sendWsData = {
        attrSubCmds: [],
        historyCmds: [],
        tsSubCmds: []
      }
      this.initData()
    },
    getPrevValue (ele, timeList, prevObj) {
      const newTimeList = timeList.sort((a, b) => { return a.timestamp - b.timestamp })
      for (let i = 0; i < newTimeList.length; i++) {
        const prevValue = i === 0 ? 0 : prevObj[newTimeList[i - 1].timestamp][ele.property]
        const value = ele.fn(newTimeList[i].timestamp, newTimeList[i][ele.property], prevValue, i === 0 ? 0 : newTimeList[i - 1].timestamp, i === 0 ? 0 : newTimeList[i - 1][ele.property])
        if (!prevObj[newTimeList[i].timestamp]) {
          prevObj[newTimeList[i].timestamp] = {}
        }
        this.$set(prevObj[newTimeList[i].timestamp], ele.property, value)
      }
    },
    setEntityTable (activeTab, timeWindow, interval) {
      var list = []
      const limit = activeTab.limit
      const listTitle = activeTab.listTitle || []
      var obj = {}
      var firstObj = {}
      listTitle.forEach((ele) => {
        if (ele.type !== 'timestamp') {
          const cmdId = String(this.cmdIdList[ele.cmdId[activeTab.name] - 1])
          const { data } = this.listData[cmdId] || {}
          const keyData = (data && (data[ele.name.split('-')[0]] || null)) || null
          if (keyData) {
            firstObj[ele.name] = this.firstWsData[cmdId][ele.name.split('-')[0]]
            keyData.forEach(row => {
              if (this.timewindow.aggregation.type === 'NONE' || row[0] <= firstObj[ele.name]) {
                if (!obj[row[0]]) {
                  obj[row[0]] = {}
                }
                obj[row[0]][ele.name] = row[1]
              } else {
                const newDatesLen = Math.floor((row[0] - firstObj[ele.name]) / interval)
                const newDate = newDatesLen * interval + firstObj[ele.name]
                if (!obj[newDate]) {
                  obj[newDate] = {}
                }
                if (!obj[newDate][ele.name]) {
                  obj[newDate][ele.name] = []
                }
                obj[newDate][ele.name].push(row[1])
              }
            })
          }
        }
      })
      const timekeys = Object.keys(obj).sort((a, b) => { return b - a })
      const timefilterkeys = timekeys.filter((item, index) => {
        return timeWindow && parseInt(timekeys[0]) - parseInt(item) < timeWindow && index < limit
      })
      list = timefilterkeys.map((item, index) => {
        if (this.timewindow.aggregation && this.timewindow.aggregation.type !== 'NONE') {
          var a = {}
          Object.keys(obj[item]).forEach((key) => {
            if (obj[item][key] instanceof Array) {
              if (this.timewindow.aggregation.type === 'COUNT') {
                a[key] = obj[item][key].length || 0
              } else if (this.timewindow.aggregation.type === 'MIN') {
                a[key] = Math.min(...obj[item][key]) || ''
              } else if (this.timewindow.aggregation.type === 'MAX') {
                a[key] = Math.max(...obj[item][key]) || ''
              } else if (this.timewindow.aggregation.type === 'AVG') {
                a[key] = this.avg(obj[item][key])
              } else if (this.timewindow.aggregation.type === 'SUM') {
                a[key] = this.sum(obj[item][key])
              }
            } else {
              a[key] = obj[item][key]
            }
          })
          return { ...a, timestamp: parseInt(item) }
        } else {
          return { ...obj[item], timestamp: parseInt(item) }
        }
      })
      this.origList = list
      var prevObj = {}
      listTitle.forEach((item) => {
        if (item.type !== 'timestamp') {
          // if (list[0] && list[0][item.property]) {
          //   this.getPrevValue(item, list[0], prevObj)
          // }
          this.getPrevValue(item, list, prevObj)
        }
      })
      const fnlist = timefilterkeys.map((item, index) => {
        return { ...prevObj[item], timestamp: parseInt(item) }
      })
      this.$set(activeTab, 'list', fnlist)
      if (activeTab.index === this.activeTabName) {
        this.listTitle = this.tabs[this.activeTabName].listTitle || []
        this.list = fnlist
        this.total = this.list.length || 0
        this.getList()
      }
    },
    setFunctionTable () {
      this.tabs.forEach((activeTab) => {
        if (activeTab.type === 'function') {
          var list = []
          const limit = activeTab.limit
          const listTitle = activeTab.listTitle || []
          const startTs = activeTab.startTs
          const timeWindow = activeTab.endTs - activeTab.startTs
          const interval = activeTab.interval
          const fnObj = activeTab.fnObj
          var obj = {}

          if (this.timewindow.aggregation && this.timewindow.aggregation.type !== 'NONE') {
            Object.keys(fnObj).forEach((item) => {
              const newDatesLen = Math.floor((item - startTs) / interval)
              const newDate = newDatesLen * interval + startTs
              if (!obj[newDate]) {
                obj[newDate] = {}
              }
              listTitle.forEach((ele) => {
                if (!obj[newDate][ele.name]) {
                  obj[newDate][ele.name] = []
                }
                obj[newDate][ele.name].push(fnObj[item][ele.name])
              })
            })
          } else {
            obj = fnObj
          }
          const timekeys = Object.keys(obj).sort((a, b) => { return b - a })
          const timefilterkeys = timekeys.filter((item, index) => {
            return timeWindow && parseInt(timekeys[0]) - parseInt(item) < timeWindow && index < limit
          })
          list = timefilterkeys.map((item, index) => {
            if (this.timewindow.aggregation && this.timewindow.aggregation.type !== 'NONE') {
              var a = {}
              Object.keys(obj[item]).forEach((key) => {
                if (obj[item][key] instanceof Array) {
                  if (this.timewindow.aggregation.type === 'COUNT') {
                    a[key] = obj[item][key].length || 0
                  } else if (this.timewindow.aggregation.type === 'MIN') {
                    a[key] = Math.min(...obj[item][key]) || ''
                  } else if (this.timewindow.aggregation.type === 'MAX') {
                    a[key] = Math.max(...obj[item][key]) || ''
                  } else if (this.timewindow.aggregation.type === 'AVG') {
                    a[key] = this.avg(obj[item][key])
                  } else if (this.timewindow.aggregation.type === 'SUM') {
                    a[key] = this.sum(obj[item][key])
                  }
                } else {
                  a[key] = obj[item][key]
                }
              })
              return { ...a, timestamp: parseInt(item) }
            } else {
              return { ...obj[item], timestamp: parseInt(item) }
            }
          })
          this.$set(activeTab, 'list', list)
          if (activeTab.index === this.activeTabName) {
            this.listTitle = this.tabs[this.activeTabName].listTitle || []
            this.list = list
            this.total = this.list.length || 0
            this.getList()
          }
        }
      })
    },
    // 函数表格初始值
    setFunctionTableInit (activeTab) {
      const listTitle = activeTab.listTitle || []
      const endTs = activeTab.endTs
      const startTs = activeTab.startTs
      const interval = activeTab.interval
      const max = this.timewindow.aggregation && this.timewindow.aggregation.type !== 'NONE' ? (30 * 24 * 3600 / 5) : activeTab.limit
      var loopInterval = interval >= 5000 ? 5000 : 1000
      var timeList = []
      for (let i = endTs - (loopInterval / 2), index = 0; i >= startTs; i = i - loopInterval, index++) {
        if (index < max) {
          timeList.push({ timestamp: i })
        } else {
          break
        }
      }
      var prevObj = {}
      listTitle.forEach((ele) => {
        if (ele.type !== 'timestamp') {
          this.getPrevFnValue(ele, timeList, prevObj)
        }
      })
      this.$set(activeTab, 'fnObj', prevObj)
    },
    // 函数表格原始函数循环增加
    setFunctionTableLoop () {
      // var timestamp = new Date().getTime()
      this.tabs.forEach((activeTab, index) => {
        if (activeTab.type === 'function') {
          const max = this.timewindow.aggregation && this.timewindow.aggregation.type !== 'NONE' ? (30 * 24 * 3600 / 5) : activeTab.limit
          const fnObj = activeTab.fnObj || {}
          const fnArr = Object.keys(fnObj)
          const prevTimestamp = parseInt(fnArr[fnArr.length - 1])
          const timestamp = (activeTab.interval >= 5000 ? 5000 : 1000) + prevTimestamp
          const listTitle = activeTab.listTitle || []
          if (Object.keys(fnObj).length >= max) {
            delete fnObj[parseInt(fnArr[0])]
          }
          var obj = { ...fnObj }
          listTitle.forEach((ele) => {
            if (ele.type !== 'timestamp') {
              if (!obj[timestamp]) {
                obj[timestamp] = {}
              }
              obj[timestamp][ele.name] = ele.fn(timestamp, fnObj[prevTimestamp][ele.name])
            }
          })
          this.$set(activeTab, 'fnObj', obj)
        }
      })
    },
    // 函数获取前一个
    getPrevFnValue (ele, timeList, prevObj) {
      const newTimeList = timeList.sort((a, b) => { return a.timestamp - b.timestamp })
      for (let i = 0; i < newTimeList.length; i++) {
        const prevValue = i === 0 ? 0 : prevObj[newTimeList[i - 1].timestamp][ele.property]
        const value = ele.fn(newTimeList[i].timestamp, prevValue)
        if (!prevObj[newTimeList[i].timestamp]) {
          prevObj[newTimeList[i].timestamp] = {}
        }
        this.$set(prevObj[newTimeList[i].timestamp], ele.property, value)
      }
    },
    exportExcel () {
      this.exportLoading = true
      const tabList = this.tabs.filter(tab => {
        return !tab.list
      })
      if (tabList.length > 0) {
        this.$message.warning('数据还在加载中请稍后再试')
        this.exportLoading = false
        return
      }
      var wopts = {
        bookType: 'xlsx',
        bookSST: true,
        type: 'binary'
      }
      var workBook = {
        SheetNames: [],
        Sheets: {},
        Props: {}
      }
      const workBookName = this.widgetsconfig.title + ' ' + formatTimestamp(new Date().getTime(), 'yyyy-MM-dd HH:mm:ss')

      this.tabs.forEach((tab, index) => {
        const count = workBook.SheetNames.filter((item) => { return item === tab.label }).length
        const sheetName = tab.label + (count !== 0 ? ('(' + (count + 1) + ')') : '')
        workBook.SheetNames.push(sheetName)
        var headerDisplay = {}
        const header = tab.listTitle.map((item) => {
          headerDisplay[item.property] = item.label
          return item.property
        })
        const data = this.formatJson(tab.listTitle, tab.list)
        const newData = [headerDisplay, ...data]
        // 展示的名称
        workBook.Sheets[sheetName] = XLSX.utils.json_to_sheet(newData, { header: header, skipHeader: true })
      })

      // 3、XLSX.write() 开始编写Excel表格
      // 4、changeData() 将数据处理成需要输出的格式
      const blob = new Blob([this.changeData(XLSX.write(workBook, wopts))], { type: 'application/octet-stream' })
      FileSaver.saveAs(blob, workBookName + '.xlsx')
      setTimeout(() => {
        this.exportLoading = false
      }, 3000)
    },
    formatJson (listTitle, jsonData) {
      return jsonData.map(row => {
        const obj = {}
        listTitle.forEach(item => {
          let value = row[item.property]
          if (item.property === 'timestamp') {
            value = listTitle[0].fn(value)
          } else {
            if (parseFloat(value) || parseFloat(value) === 0) {
              if (item.decimals || this.widgetsconfig.decimals) {
                value = parseFloat(value).toFixed((item.decimals || item.decimals === 0) ? item.decimals : this.widgetsconfig.decimals)
              }
              value = value + (item.units ? item.units : this.widgetsconfig.units ? this.widgetsconfig.units : '')
            }
          }
          obj[item.property] = value
        })
        return obj
      })
    },
    changeData (s) {
    // 如果存在ArrayBuffer对象(es6) 最好采用该对象
      if (typeof ArrayBuffer !== 'undefined') {
      // 1、创建一个字节长度为s.length的内存区域
        const buf = new ArrayBuffer(s.length)

        // 2、创建一个指向buf的Unit8视图，开始于字节0，直到缓冲区的末尾
        var view = new Uint8Array(buf)

        // 3、返回指定位置的字符的Unicode编码
        for (let i = 0; i !== s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF
        return buf
      } else {
        const buf = new Array(s.length)
        for (let i = 0; i !== s.length; ++i) buf[i] = s.charCodeAt(i) & 0xFF
        return buf
      }
    }
  },
  computed: {
    wsData () {
      const wsData = {}
      this.$store.state.websocket.websocketData.forEach(item => {
        if (this.cmdIdList && this.cmdIdList.includes(item.subscriptionId)) {
          wsData[item.subscriptionId] = item
        }
      })
      return wsData
    }
  },
  watch: {
    'config.configuration.timewindow': {
      deep: true,
      handler (newVal, oldVal) {
        if (!this.widgetsconfig.displayTimewindow) {
          // this.restart()
          this.timewindow = newVal
        }
      }
    },
    wsData: {
      deep: true,
      handler (newVal, oldVal) {
        if (Object.keys(newVal).length > 0) {
          Object.keys(newVal).map((item) => {
            if (Object.keys(this.listData).indexOf(item) === -1) {
              this.firstWsData[item] = {}
              Object.keys(newVal[item].data).forEach((key) => {
                const len = newVal[item].data[key].length
                this.firstWsData[item][key] = newVal[item].data[key][len - 1][0]
              })
            }
          })
          this.listData = newVal
          const timeType = this.timewindow && this.timewindow.selectedTab === 1 ? 'history' : 'realtime'
          var timeWindow = null
          if (timeType === 'realtime') {
            timeWindow = this.timewindow.realtime ? this.timewindow.realtime.timewindowMs : 1000
          } else {
            if (this.timewindow.history.historyType === 1) {
              const startTs = this.timewindow.history.fixedTimewindow && this.timewindow.history.fixedTimewindow.startTimeMs
              const endTs = this.timewindow.history.fixedTimewindow && this.timewindow.history.fixedTimewindow.endTimeMs
              timeWindow = parseInt(endTs - startTs)
            } else {
              timeWindow = this.timewindow.history ? this.timewindow.history.timewindowMs : 1000
            }
          }
          var interval = timeType === 'history' ? (this.timewindow.history ? this.timewindow.history.interval : 1000) : (this.timewindow.realtime ? this.timewindow.realtime.interval : 1000)
          this.tabs.forEach((activeTab, index) => {
            if (activeTab.type !== 'function') {
              this.setEntityTable(activeTab, timeWindow, interval)
            }
          })
          // newVal(()=>{

          // })
        }
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
    }
  },
  created () {
    this.initDatasources()
    // this.initData()
  },
  mounted () {
    // this.loop()
  },
  beforeDestroy () {
    clearInterval(this.timer)
    this.timer = null
    clearInterval(this.timerLoopCurrent)
    this.timerLoopCurrent = null
    // this.wsDataHistory = {}
    this.$store.dispatch('websocketUnsubscribe', this.cmdIdList)
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
  }
}
</script>
<style type="text/css" lang="scss" scoped>
.table-container{
  height: calc(100% - 70px);
  .margin-bottom {
    margin-bottom: 10px;
  }
  .margin-right{
    margin-right: 10px;
  }
  .select-margin{
    margin: 10px 10px 10px 0;
  }
}
</style>
