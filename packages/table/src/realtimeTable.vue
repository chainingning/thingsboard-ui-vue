<template>
  <div class="table-container">
    <el-row class="topControl" :gutter="20">
      <el-col :span="18">
        <el-input v-model="input" v-if="datasources[0].type === 'entity'" placeholder="搜索设备名" clearable class="input"></el-input>
      </el-col>
      <el-col :span="6" class="downloadButton">
          <el-button type="primary" icon="el-icon-download" @click="getExcel(listTitle, latestData, title)">下载</el-button>
      </el-col>
    </el-row>
    <el-table :data="tableData"  :height="tableHeight">
      <el-table-column
        v-for="(item, index) in listTitle"
        :key="index"
        :prop="item.property"
        :label="item.label"
        sortable
        :formatter="formatFn"
      ></el-table-column>
    </el-table>
    <div>
      <el-pagination
        v-if="settings.displayPagination"
        background
        :current-page.sync="page"
        layout="prev, pager, next"
        :page-size.sync="settings.defaultPageSize"
        :total="total"
        @current-change="changePage()"
      ></el-pagination>
    </div>
  </div>
</template>

<script>
import { formatTimestamp } from '@/utils'
export default {
  name: 'ETableRealtime',
  inject: ['widgetInfo', 'config', 'id'],
  props: {
    tableHeight: {
      type: String,
      default: 'calc(100% - 32px)'
    },
    isTimestamp: {
      type: Boolean,
      default: true
    }
  },
  data () {
    return {
      widgetsconfig: {},
      title: '',
      input: '',
      timewindow: {},
      total: 0,
      latestData: [],
      prevOrigData: [],
      prevData: [],
      tabs: [],
      tabCount: 0,
      entityType: '',
      entityAliases: {},
      datasources: [],
      tableData: [],
      limit: 60,
      page: 1,
      sendWsData: {
        attrSubCmds: [],
        historyCmds: [],
        tsSubCmds: []
      },
      timer: null,
      listTitle: [],
      listData: {},
      settings: {
        defaultPageSize: 10,
        displayPagination: true,
        showMilliseconds: true,
        showTimestamp: true,
        showEntityType: true,
        showDeviceTimestamp: false
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
  methods: {
    getExcel (listTitle, latestData, title) {
      const tHeader = []
      const filterVal = []
      const list = latestData
      listTitle.forEach(item => {
        tHeader.push(item.label)
        filterVal.push(item.property)
      })
      const data = this.formatJson(filterVal, list)
      const now = new Date().getTime()
      const time = formatTimestamp(now)
      const tableTitle = title + '-' + time + '实时数据'
      require.ensure([], () => {
        import('@/vendor/Export2Excel').then(excel => {
          excel.export_json_to_excel({
            header: tHeader,
            sheetName: tableTitle,
            data,
            filename: tableTitle
          })
        })
      })
    },
    formatJson (filterVal, jsonData) {
      return jsonData.map(v => filterVal.map(j => v[j]))
    },
    isNumber (val) {
      const regPos = /^\d+(\.\d+)?$/
      const regNeg = /^(-(([0-9]+\.[0-9]*[1-9][0-9]*)|([0-9]*[1-9][0-9]*\.[0-9]+)|([0-9]*[1-9][0-9]*)))$/
      if (regPos.test(val) || regNeg.test(val)) {
        return true
      } else {
        return false
      }
    },
    removeIndex (inputString) {
      let newString = ''
      let strArray = []
      strArray = inputString.split('-')
      strArray.pop()
      newString = strArray.join('-')
      return newString
    },
    // 搜索
    searchData (latestData) {
      var searchedData = []
      latestData.forEach(device => {
        if (device.device.includes(this.input)) {
          searchedData.push(device)
        }
      })
      return searchedData
    },
    formatFn (row, column, cellValue, index) {
      const listTitle = this.listTitle
      var value = row[column.property]
      if (listTitle.length > 0) {
        if (column.property === 'timestamp') {
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
    // 通过subscribtionId获取cmdId
    getCmdId (subscriptionId) {
      let currentCmdId
      this.cmdIdList.forEach((item, index) => {
        if (subscriptionId === item) {
          currentCmdId = index + 1
        }
      })
      return currentCmdId
    },
    // 通过cmdId返回wsData数据段属于遥测数据还是属性
    getWsDataType (cmdId) {
      let type = ''
      this.datasources[0].dataKeys.forEach(item => {
        Object.keys(item.cmdId).forEach(currentId => {
          if (cmdId === item.cmdId[currentId]) {
            type = item.type
          }
        })
      })
      return type
    },
    // 通过subscribtionId获取设备标签
    getDeviceLabel (subscriptionId) {
      let deviceLabel = ''
      let currentCmdId = 0
      let currentDeviceName = ''
      // 获取subscribtionId对应的cmdId
      this.cmdIdList.forEach((item, index) => {
        if (subscriptionId === item) {
          currentCmdId = index + 1
        }
      })
      this.datasources[0].dataKeys.forEach(dataKey => {
        Object.keys(dataKey.cmdId).forEach(deviceName => {
          if (currentCmdId === dataKey.cmdId[deviceName]) {
            currentDeviceName = deviceName
          }
        })
      })
      // 通过获取到的cmdId寻找设备名
      this.tabs.forEach(tab => {
        if (currentDeviceName === tab.name) {
          deviceLabel = tab.label
        }
      })
      return deviceLabel
    },
    async initEntityDevices (item, listTitle) {
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
        pageSize: this.pageSize,
        startTime: 1606117543888,
        searchStatus: 'ANY',
        ascOrder: false
      }
      var result = null
      switch (entitylistInfo.entityType) {
        case 'DEVICE':
          this.entityType = '设备'
          result = await this.$api.getDevices(
            { ...params, deviceIds: entitylistInfo.id }
          )
          break
        case 'ASSET':
          this.entityType = '资产'
          result = await this.$api.getAssets(
            { ...params, assetIds: entitylistInfo.id }
          )
          break
        case 'ENTITY_VIEW':
          this.entityType = '实体视图'
          result = await this.$api.getEntityView(
            entitylistInfo.id
          )
          break
        case 'TENANT':
          this.entityType = '租户'
          result = await this.$api.getTenantInfos(this.$store.getters.userInfo.tenantId.id)
          break
        case 'CUSTOMER':
          this.entityType = '顾客'
          result = await this.$api.getCustomersInfo(entitylistInfo.id)
          break
        case 'DASHBOARD':
          this.entityType = '仪表盘'
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
      console.log('print tabs')
      console.log(this.tabs)
    },
    async initDevices () {
      for (let index = 0; index < this.datasources.length; index++) {
        var item = this.datasources[index]
        var limit = null
        const listTitle = item.dataKeys
          ? item.dataKeys.map((ele, eleIndex) => {
            this.fn(ele, item.type)
            limit = ele.limit ? ele.limit : limit
            if (item.type === 'entity') {
              return {
                ...ele,
                property: ele.name + '-' + ele.type + '-' + eleIndex,
                name: ele.name + '-' + ele.type + '-' + eleIndex
              }
            } else {
              return {
                ...ele,
                property: ele.name + '-' + eleIndex,
                name: ele.name + '-' + eleIndex
              }
            }
          }) : []
        // console.log('print listTitle')
        // console.log(listTitle)
        item.limit = limit
        if (item.type === 'entity' && this.settings.showEntityType === true) {
          listTitle.unshift({
            property: 'entityType',
            label: '实体类型',
            name: 'entityType',
            type: 'entityType'
          })
        }
        if (this.settings.showDeviceTimestamp) {
          listTitle.unshift({
            property: 'timestamp',
            label: '时间戳',
            name: 'timestamp',
            type: 'timestamp'
          })
        }
        if (item.type === 'entity') {
          await this.initEntityDevices(item, listTitle)
        } else {
          this.tabs.push({
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
          })
          this.tabCount++
        }
        if (this.datasources[0].type === 'entity') {
          listTitle.unshift({
            property: 'device',
            label: '实体名',
            name: 'device',
            type: 'device'
          })
        } else {
          listTitle.unshift({
            property: 'function',
            label: 'function',
            name: 'function',
            type: 'function'
          })
        }
        this.listTitle = listTitle
        console.log('print this.listTitle')
        console.log(this.listTitle)
      }
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
      obj.fn = Function.call(this, 'time', 'value', 'prevValue', 'prevTime', 'prevOrigValue', fnBody)
    },
    async initData () {
      // console.log('config')
      // console.log(this.config)
      this.widgetsconfig = this.config
        ? this.config.configuration.widgets[this.id].config
        : JSON.parse(this.widgetInfo.descriptor.defaultConfig)
      this.settings = {
        defaultPageSize: parseInt(this.widgetsconfig.settings.defaultPageSize) || 10,
        displayPagination: this.widgetsconfig.settings.displayPagination === undefined ? true : this.widgetsconfig.settings.displayPagination,
        showMilliseconds: this.widgetsconfig.settings.showMilliseconds === undefined ? false : this.widgetsconfig.settings.showMilliseconds,
        showTimestamp: this.widgetsconfig.settings.showTimestamp === undefined ? true : this.widgetsconfig.settings.showTimestamp,
        showEntityType: this.widgetsconfig.settings.showEntityType === undefined ? true : this.widgetsconfig.settings.showEntityType,
        showDeviceTimestamp: this.widgetsconfig.settings.showDeviceTimestamp === undefined ? false : this.widgetsconfig.settings.showDeviceTimestamp
      }
      this.title = this.widgetsconfig.title
      this.datasources = this.widgetsconfig.datasources
      console.log('datatsource')
      console.log(this.widgetsconfig)
      console.log(this.datasources)
      this.entityAliases = (this.config && this.config.configuration.entityAliases) || {}
      let cmdId = 0
      // console.log('输出datasources')
      // console.log(this.datasources)
      this.datasources.forEach((item, index) => {
        if (item.type === 'entity') {
          // console.log('print item')
          // console.log(item)
          this.getEntityList(item.entityAliasId).forEach(entity => {
            // console.log('输出实体')
            // console.log(entity)
            item.dataKeys.forEach((ele, i) => {
              // console.log('输出数据键')
              // console.log(ele)
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
              // console.log('输出sendws')
              // console.log(this.sendWsData)
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
      await this.initDevices()
      this.cmdIdList = await this.$store.dispatch('websocketsend', this.sendWsData)
      // console.log('print cmdidlist')
      // console.log(this.cmdIdList)
      if (this.datasources[0].type === 'function') {
        this.setFunctionTable()
      }
    },
    sortUnitData (column) {
      const fieldName = column.prop
      var sortingType = column.order
      if (sortingType !== null) {
        // 降序
        if (sortingType === 'descending') {
          this.tableData = this.tableData.sort(function (a, b) {
            // 字符串情况（即含单位或者格式为字符串情况）
            if (typeof a[fieldName] === 'string' || typeof b[fieldName] === 'string') {
              if (parseFloat(a[fieldName]) > parseFloat(b[fieldName])) {
                return -1
              } else {
                return 1
              }
            } else {
              if (a[fieldName] > b[fieldName]) {
                return -1
              } else {
                return 1
              }
            }
          })
        } else {
          this.tableData = this.tableData.sort(function (a, b) {
            // 字符串情况（即含单位或者格式为字符串情况）
            if (typeof a[fieldName] === 'string' || typeof b[fieldName] === 'string') {
              if (parseFloat(a[fieldName]) > parseFloat(b[fieldName])) {
                return 1
              } else {
                return -1
              }
            } else {
              if (a[fieldName] > b[fieldName]) {
                return 1
              } else {
                return -1
              }
            }
          })
        }
      }
    },
    setFunctionTable () {
      var now = new Date().getTime()
      const time = formatTimestamp(now)
      var list = []
      const listTitle = this.listTitle
      const rowData = {}
      listTitle.forEach((ele) => {
        if (ele.label !== 'timestamp' && ele.label !== 'function') {
          if (ele.fn) {
            rowData[ele.name] = ele.fn(time, null)
          }
        }
      })
      rowData.timestamp = time
      rowData.function = this.datasources[0].name
      // if (this.isTimestamp) {
      //   rowData.timestamp = formatTimestamp(time)
      // }
      list.push(rowData)
      this.tableData = list
    },
    setTable () {
      const latestData = []
      const prevOrigData = []
      const prevData = []
      // 按照设备列表建立对应的空数据属性
      this.tabs.forEach(tab => {
        const latestDeviceData = {}
        this.listTitle.forEach(item => {
          this.$set(latestDeviceData, item.property, 'N/A')
        })
        latestDeviceData.device = tab.label
        latestData.push(latestDeviceData)
        // 使用深拷贝防止当前数据和前一条数据互相影响
        prevOrigData.push(JSON.parse(JSON.stringify(latestDeviceData)))
        prevData.push(JSON.parse(JSON.stringify(latestDeviceData)))
      })
      // console.log('print emptyLatestData')
      // console.log(this.listTitle)
      // console.log(latestData)

      // 填写设备类型
      latestData.forEach(device => {
        device.entityType = this.entityType
      })
      // 通过subcribtionId获取设备名将每条wsData数据装入对应的表格数据
      Object.keys(this.listData).forEach(dataPiece => {
        // 装填数据
        latestData.forEach((device, deviceIndex) => {
          if (this.getDeviceLabel(this.listData[dataPiece].subscriptionId) === device.device) {
            Object.keys(this.listData[dataPiece].data).forEach(label => {
              Object.keys(device).forEach(dataLabel => {
                if (this.removeIndex(dataLabel) === (label + '-' + this.getWsDataType(this.getCmdId(this.listData[dataPiece].subscriptionId)))) {
                  device[dataLabel] = this.listData[dataPiece].data[label][0][1]
                  if (this.settings.showDeviceTimestamp === true) {
                    if (device.timestamp === 'N/A' || this.listData[dataPiece].data[label][0][0] > device.timestamp) {
                      device.timestamp = this.listData[dataPiece].data[label][0][0]
                    }
                  }
                  if (this.listData[dataPiece].data[label][1]) {
                    prevOrigData[deviceIndex][dataLabel] = this.listData[dataPiece].data[label][1]
                  }
                }
              })
              // device[label + '-' + this.getWsDataType(this.getCmdId(this.listData[dataPiece].subscriptionId))] = this.listData[dataPiece].data[label][0][1]
            })
          }
        })
      })
      console.log('print listData')
      console.log(this.listData)
      console.log('print LatestData')
      console.log(latestData)
      console.log('print prevOrigData')
      console.log(prevOrigData)
      // 将字符串格式和数字格式的时间戳转换为时间
      latestData.forEach(device => {
        Object.keys(device).forEach(item => {
          if (/^\d{13}$/.test(device[item]) || ((typeof device[item] === 'number') && /^\d{13}$/.test(String(device[item])))) {
            device[item] = formatTimestamp(parseInt(device[item]))
          }
        })
      })
      // 处理数据后处理
      this.listTitle.forEach(item => {
        const now = new Date().getTime()
        const time = formatTimestamp(now)
        if (Object.prototype.hasOwnProperty.call(item, 'postFuncBody')) {
          if (item.postFuncBody !== undefined && item.postFuncBody !== '') {
            latestData.forEach((device, deviceIndex) => {
              if (device[item.name] !== 'N/A') {
                device[item.name] = item.fn(time, device[item.name], (this.prevData[deviceIndex][item.name] === undefined || this.prevData[deviceIndex][item.name] === 'N/A') ? 0 : this.prevData[deviceIndex][item.name], prevOrigData[deviceIndex][item.name][0], prevOrigData[deviceIndex][item.name][1])
                prevData[deviceIndex][item.name] = device[item.name]
              }
            })
          }
        }
        /* if (Object.prototype.hasOwnProperty.call(item, 'decimals')) {
          if (item.decimals !== undefined) {
            latestData.forEach(device => {
              if (this.isNumber(device[item.name])) {
                device[item.name] = Number(device[item.name]).toFixed(item.decimals)
              }
            })
          }
        } */
        /* if (Object.prototype.hasOwnProperty.call(item, 'units')) {
          latestData.forEach(device => {
            if (device[item.name] !== 'N/A' && item.units !== undefined) {
              device[item.name] = device[item.name] + item.units
            }
          })
        } */
      })
      this.prevData = prevData
      this.latestData = latestData

      this.total = this.searchData(latestData).length
      if (this.settings.displayPagination) {
        this.tableData = this.getCurrentPageData(this.searchData(latestData))
      } else {
        this.tableData = this.searchData(latestData)
      }
    },
    getCurrentPageData (data) {
      const pageData = []
      for (let i = ((this.page - 1) * this.settings.defaultPageSize); i < (this.page * this.settings.defaultPageSize); i++) {
        if (data[i]) {
          pageData.push(data[i])
        }
      }
      return pageData
    },
    changePage () {
      if (this.datasources) {
        if (this.datasources[0].type === 'entity') {
          this.setTable()
        }
      }
    },
    loop () {
      this.timer = setInterval(() => {
        if (this.datasources[0].type === 'function') {
          this.setFunctionTable()
        }
      }, 1000)
    }
  },
  watch: {
    wsData: {
      deep: true,
      handler (newVal, oldVal) {
        if (Object.keys(newVal).length > 0) {
          this.listData = newVal
          // console.log('print this.listData')
          // console.log(this.listData)
          this.setTable()
        }
      }
    },
    input (val, oldVal) {
      this.setTable()
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
  }
}
</script>
<style type="text/css" lang="scss" scoped>
.table-container{
  height: calc(100% - 70px);
  .topControl {
    .controlButton {
      margin-left: 5px;
    }
  }
  .bottomControl {
    margin-top: 10px;
  }
  .input {
    margin-bottom: 10px;
    border-radius: 10px !important;
  }
  .margin-bottom {
    margin-bottom: 20px;
  }
  .select-margin{
    margin: 10px 0px;
  }
}
</style>
