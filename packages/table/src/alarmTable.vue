<template>
  <div class="table-container">
    <el-form ref="form" :model="listQuery" :inline="true" class="query-container" :id="'query'+ (id || '')">
      <el-form-item v-if="widgetsconfig.displayTimewindow" label="">
        <el-button type="primary" title="编辑时间窗口" @click="editTimeDialog">
          <i class="el-icon-time el-icon--left"></i>{{timewindow | formatConfigTime}}
        </el-button>
      </el-form-item>
      <el-form-item v-if="settings.enableStatusFilter" label="状态">
        <el-select v-model="listQuery.searchStatus" @change="getList">
          <el-option label="全部" value="ANY"></el-option>
          <el-option label="已激活" value="ACTIVE"></el-option>
          <el-option label="已清除" value="CLEARED"></el-option>
          <el-option label="已应答" value="ACK"></el-option>
          <el-option label="未应答" value="UNACK"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item v-if="settings.enableSelectColumnDisplay" label="显示列">
        <el-select v-model="listQuery.listTitle" @change="getList" multiple collapse-tags>
          <el-option v-for="(ele,i) in listTitle" :key="i" :label="ele.label" :value="i"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item v-if="settings.enableSearch" label="搜索告警">
        <el-input v-model="listQuery.textSearch" @keypress.native.enter="getList"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="exportLoading" icon="el-icon-download" @click="exportExcel">下载
      </el-button>
      </el-form-item>
    </el-form>

    <el-table ref="multipleTable" :data="tableData"  :height="tableHeight"  @sort-change='tableSortChange' :cell-class-name="rowClass" @selection-change="selectionChangeHandle">
      <el-table-column v-if="settings.enableSelection && (settings.allowAcknowledgment || settings.allowClear)" type="selection" width="55"></el-table-column>
      <template v-for="(item, index) in listTitle">
        <el-table-column
          v-if= "listQuery.listTitle.indexOf(index)>-1"
          :key="index"
          :prop="item.property"
          :label="item.label"
          sortable="custom"
          :formatter="formatFn"
        >
        </el-table-column>
      </template>
      <el-table-column v-if="settings.allowAcknowledgment || settings.allowClear || settings.displayDetails" width="120px">
        <template slot-scope="scope">
          <el-button v-if="settings.displayDetails" icon="el-icon-more" type="text" title="详情" @click="infoClick(scope.row.id.id)"></el-button>
          <el-button v-if="settings.allowAcknowledgment" icon="el-icon-check" type="text" title="应答" :disabled="scope.row.status.toLowerCase().indexOf('unack')===-1" @click="optClick('ack',scope.row.id.id)"></el-button>
          <el-button v-if="settings.allowClear" icon="el-icon-close" type="text" title="清除" :disabled="scope.row.status.toLowerCase().indexOf('clear')>-1" @click="optClick('clear',scope.row.id.id)"></el-button>
        </template>
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
    <div v-if="multipleSelection.length>0" class="selection-msg">
      <span>已经选择告警 {{ multipleSelection.length }} 个</span>
      <div>
        <wx-button v-if="settings.allowAcknowledgment" icon="el-icon-check" circle title="应答" @click="multipleOptClick('ack')"></wx-button>
        <wx-button v-if="settings.allowClear" icon="el-icon-close" circle title="清除" @click="multipleOptClick('clear')"></wx-button>
      </div>
    </div>
    <icloud-dialog
      :title="info.title"
      :visible.sync="info.dialogVisible"
      :before-close="handleClose">
      <el-form ref="form" :model="info.form">
      <template v-for="(item, index) in info.formItems">
        <el-form-item v-if="info.form[item.property]" :key="index" :label="item.label">
          <template v-if="item.type==='input'">
            <el-input readonly v-model="info.form[item.property]" :class="item.property === 'severity'?info.severityColor: ''"></el-input>
          </template>
          <template v-else-if="item.type ==='text'">
            <el-input type="textarea" autosize readonly v-model="info.form[item.property]"></el-input>
          </template>
        </el-form-item>
      </template>
      </el-form>
      <div slot="footer" class="icloud-dialog-footer">
        <wx-button @click="handleClose">关闭</wx-button>
      </div>
    </icloud-dialog>
  </div>
</template>

<script>
import { formatTimestamp, formatTimeMs, equalsObj } from '@/utils'
import timeWindowDialog from '@/views/dashboards/components/time-window-dialog'
import FileSaver from 'file-saver'
import XLSX from 'xlsx'
export default {
  name: 'EAlarmTable',
  inject: ['widgetInfo', 'config', 'id'],
  components: {
    timeWindowDialog
  },
  data () {
    return {
      tableHeight: 'calc(100% - 82px)',
      widgetsconfig: {},
      timewindow: {},
      alarmSource: {},
      entityAliases: {},
      listTitle: [],
      timer: null,
      page: 1,
      pageSize: 10,
      total: 0,
      tableData: [],
      sort: {
        order: null,
        prop: ''
      },
      limit: 60,
      settings: {},
      timeInfo: {},
      entitylistInfo: {},
      listQuery: {
        searchStatus: 'ANY',
        listTitle: [],
        textSearch: ''
      },
      multipleSelection: [],
      params: {},
      lastSelection: [],
      info: {
        dialogVisible: false,
        title: '告警详情',
        form: {
        },
        formItems: [
          { label: '创建时间', property: 'createdTime', type: 'input', formatter: 'formaterTime' },
          { label: '起因', property: 'originatorName', type: 'input', formatter: '' },
          { label: '开始时间', property: 'startTs', type: 'input', formatter: 'formaterTime' },
          { label: '结束时间', property: 'endTs', type: 'input', formatter: 'formaterTime' },
          { label: '应答时间', property: 'ackTs', type: 'input', formatter: 'formaterTime' },
          { label: '清除时间', property: 'clearTs', type: 'input', formatter: 'formaterTime' },
          { label: '类型', property: 'type', type: 'input', formatter: '' },
          { label: '严重程度', property: 'severity', type: 'input', formatter: '' },
          { label: '状态', property: 'status', type: 'input', formatter: '' },
          { label: '详情', property: 'detail', type: 'text', formatter: '' }
        ],
        severityColor: ''
      },
      exportLoading: false
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
        ...this.widgetsconfig.settings,
        defaultPageSize: parseInt(this.widgetsconfig.settings.defaultPageSize) || 10
      }
      this.alarmSource = this.widgetsconfig.alarmSource
      this.entityAliases = (this.config && this.config.configuration.entityAliases) || {}
      this.initData()
    },
    initData (listQuery) {
      const timewindow = {}
      const limit = this.timewindow.aggregation ? this.timewindow.aggregation.limit : 60
      if (this.timewindow.selectedTab === 1) {
        timewindow.type = 'history'
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
        timewindow.type = 'realtime'
        timewindow.interval = this.timewindow.aggregation && this.timewindow.aggregation.type !== 'NONE' && this.timewindow.realtime ? this.timewindow.realtime.interval : 1000
        timewindow.timeWindow = this.timewindow.realtime ? this.timewindow.realtime.timewindowMs : 1000
        timewindow.endTs = new Date().getTime()
        timewindow.startTs = Math.floor(timewindow.endTs / timewindow.interval) * timewindow.interval - timewindow.timeWindow
        timewindow.limit = parseInt((timewindow.timeWindow) / timewindow.interval) || limit
        timewindow.limit = this.timewindow.aggregation && this.timewindow.aggregation.type !== 'NONE' ? timewindow.limit : limit
      }
      this.timeInfo = timewindow
      this.listTitle = this.alarmSource.dataKeys ? this.alarmSource.dataKeys.map((ele, eleIndex) => {
        return {
          ...ele,
          property: ele.name
        }
      }) : []
      if (listQuery) {
        this.listQuery = listQuery
      } else {
        this.listQuery.searchStatus = this.widgetsconfig.alarmSearchStatus
        this.listQuery.listTitle = this.listTitle.map((item, index) => { return index })
      }
      this.sort = {
        order: 'descending',
        prop: this.settings.defaultSortOrder || this.listTitle[0].property
      }
      if (this.alarmSource.type !== 'function') {
        const entityInfo = this.entityAliases[this.alarmSource.entityAliasId]
        const entityType = entityInfo.filter.type
        const entitylistInfo = entityInfo.filter[entityType] instanceof Array
          ? {
            entityType: entityInfo.filter.entityType,
            id: entityInfo.filter[entityType][0]
          }
          : entityInfo.filter[entityType]
        this.entitylistInfo = entitylistInfo

        this.getList()
        if (timewindow.type === 'realtime') {
          this.loop()
        }
      } else {
        this.tableData = [{
          createdTime: this.timeInfo.startTs,
          originatorName: '模拟',
          startTs: this.timeInfo.startTs,
          endTs: 0,
          ackTs: 0,
          clearTs: 0,
          type: '温度过高',
          severity: 'MAJOR',
          status: 'ACTIVE_UNACK',
          id: {}
        }]
        this.total = 1
      }
      // this.getList()
    },
    async getList () {
      if (this.alarmSource.type === 'function') {
        return
      }
      const params = {
        page: this.page - 1,
        pageSize: this.pageSize,
        startTime: this.timeInfo.startTs,
        endTime: this.timeInfo.endTs,
        searchStatus: this.listQuery.searchStatus,
        fetchOriginator: true,
        sortProperty: this.sort.prop,
        sortOrder: this.sort.order === 'ascending' ? 'ASC' : 'DESC'
      }
      if (this.settings.enableSearch && this.listQuery.textSearch && this.listQuery.textSearch !== '') {
        params.textSearch = this.listQuery.textSearch
      }
      if (equalsObj(params, this.params)) {
        this.lastSelection = this.multipleSelection
      } else {
        this.lastSelection = []
      }
      this.params = params
      try {
        var result = await this.$api.getAlarms(this.entitylistInfo.entityType, this.entitylistInfo.id, params)
        if (result.data.data) {
          result.data.data.forEach((item) => {
            Object.keys(item).forEach(key => {
              if (key.indexOf('Ts') > -1) {
                this.$set(item, key.replace(/Ts/, 'Time'), item[key])
              }
            })
          })
          this.tableData = result.data.data
          this.$nextTick(() => {
            if (this.lastSelection.length > 0) {
              const ids = this.lastSelection.map((ele) => {
                return ele.id.id
              })
              this.tableData.forEach(row => {
                if (ids.indexOf(row.id.id) > -1) {
                  this.$refs.multipleTable.toggleRowSelection(row, true)
                }
              })
            }
          })
        } else {
          this.tableData = []
        }
        this.total = result.data.totalElements || 0
      } catch (error) {
        this.tableData = []
        this.total = 0
      }
    },
    formatFn (row, column, cellValue, index) {
      var value = row[column.property]
      if (column.property.indexOf('Time') > -1 || column.property.indexOf('Ts') > -1) {
        value = formatTimestamp(value, 'yyyy-MM-dd HH:mm:ss')
      } else if (column.property === 'status') {
        const status = {
          ACTIVE_ACK: '激活已应答',
          ACTIVE_UNACK: '激活未应答',
          CLEARED_ACK: '清除已应答',
          CLEARED_UNACK: '清除未应答'
        }
        value = status[value]
      } else if (column.property === 'severity') {
        const severity = {
          critical: '危险',
          indeterminate: '不确定',
          major: '重要',
          minor: '次要',
          warning: '警告'
        }
        value = severity[value.toLowerCase()]
      }
      return value
    },
    rowClass ({ row, column, rowIndex, columnIndex }) {
      let rowClass = ''
      if (column.property === 'severity') {
        switch (row.severity.toUpperCase()) {
          case 'CRITICAL':
            rowClass = 'severity-red'
            break
          case 'INDETERMINATE':
            rowClass = 'severity-blue'
            break
          case 'MAJOR':
            rowClass = 'severity-tangerine'
            break
          case 'MINOR':
            rowClass = 'severity-orange'
            break
          case 'WARNING':
            rowClass = 'severity-yellow'
            break
          default:
            rowClass = ''
        }
      }
      return rowClass
    },
    loop () {
      this.timer = setInterval(() => {
        this.getList()
      }, ((this.widgetsconfig.alarmsPollingInterval || 5) * 1000))
    },
    restart () {
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }
      this.initData()
    },
    selectionChangeHandle (val) {
      this.multipleSelection = val
    },
    optClick (type, alarmId) {
      const typeName = (type === 'ack' ? '应答' : '清除')
      this.$confirm('确认要' + typeName + '此告警?', typeName, {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        if (type === 'ack') {
          this.ack(alarmId)
        } else if (type === 'clear') {
          this.clear(alarmId)
        }
        this.getList()
      }).catch(() => {

      })
    },
    async ack (alarmId) {
      if (alarmId) {
        await this.$api.postAlarmAck(alarmId)
      }
    },
    async clear (alarmId) {
      if (alarmId) {
        await this.$api.postAlarmClear(alarmId)
      }
    },
    multipleOptClick (type) {
      const typeName = (type === 'ack' ? '应答' : '清除')
      this.$confirm('确认要' + typeName + '此告警?', typeName, {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.multipleSelection.forEach((row) => {
          if (type === 'ack') {
            this.ack(row.id.id)
          } else if (type === 'clear') {
            this.clear(row.id.id)
          }
        })
        this.$refs.multipleTable.clearSelection()
        this.getList()
      }).catch(() => {

      })
    },
    handleClose () {
      this.info.dialogVisible = false
      this.info.form = {}
    },
    async infoClick (alarmId) {
      if (!alarmId) {
        return
      }
      const res = await this.$api.getAlarmInfo(alarmId)
      console.log(res.data)
      const data = res.data
      const form = {}
      this.info.formItems.forEach((item, index) => {
        if (data[item.property]) {
          form[item.property] = this.formatFn(data, item, data[item.property], index)
          if (item.property === 'severity') {
            switch (data.severity.toUpperCase()) {
              case 'CRITICAL':
                this.info.severityColor = 'severity-red'
                break
              case 'INDETERMINATE':
                this.info.severityColor = 'severity-blue'
                break
              case 'MAJOR':
                this.info.severityColor = 'severity-tangerine'
                break
              case 'MINOR':
                this.info.severityColor = 'severity-orange'
                break
              case 'WARNING':
                this.info.severityColor = 'severity-yellow'
                break
              default:
                this.info.severityColor = ''
            }
          }
        }
      })
      let detail = '{\n'
      Object.keys(data.details).forEach((key) => {
        detail = detail + key + ': ' + data.details(key) + '\n'
      })
      detail = detail + '}'
      form.detail = detail
      this.info.form = form
      this.info.dialogVisible = true
    },
    async exportExcel () {
      this.exportLoading = true
      var tableData = []
      if (this.alarmSource.type === 'function') {
        tableData = [{
          createdTime: this.timeInfo.startTs,
          originatorName: '模拟',
          startTs: this.timeInfo.startTs,
          endTs: 0,
          ackTs: 0,
          clearTs: 0,
          type: '温度过高',
          severity: 'MAJOR',
          status: 'ACTIVE_UNACK',
          id: {}
        }]
      } else {
        const params = {
          page: 0,
          pageSize: this.total,
          startTime: this.timeInfo.startTs,
          endTime: this.timeInfo.endTs,
          searchStatus: this.listQuery.searchStatus,
          fetchOriginator: true,
          sortProperty: this.sort.prop,
          sortOrder: this.sort.order === 'ascending' ? 'ASC' : 'DESC'
        }
        if (this.settings.enableSearch && this.listQuery.textSearch && this.listQuery.textSearch !== '') {
          params.textSearch = this.listQuery.textSearch
        }
        this.params = params
        try {
          var result = await this.$api.getAlarms(this.entitylistInfo.entityType, this.entitylistInfo.id, params)
          if (result.data.data) {
            result.data.data.forEach((item) => {
              Object.keys(item).forEach(key => {
                if (key.indexOf('Ts') > -1) {
                  this.$set(item, key.replace(/Ts/, 'Time'), item[key])
                }
              })
            })
            tableData = result.data.data
          } else {
            tableData = []
          }
        } catch (error) {
          tableData = []
        }
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

      const sheetName = 'alarms'
      workBook.SheetNames.push(sheetName)
      var headerDisplay = {}
      const listTitle = this.listTitle.filter((item, index) => {
        return this.listQuery.listTitle.indexOf(index) > -1
      })
      const header = listTitle.map((item) => {
        headerDisplay[item.property] = item.label
        return item.property
      })
      const data = this.formatJson(listTitle, tableData)
      const newData = [headerDisplay, ...data]
      // 展示的名称
      workBook.Sheets[sheetName] = XLSX.utils.json_to_sheet(newData, { header: header, skipHeader: true })

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
          if (item.property.indexOf('Time') > -1 || item.property.indexOf('Ts') > -1) {
            value = formatTimestamp(value, 'yyyy-MM-dd HH:mm:ss')
          } else if (item.property === 'status') {
            const status = {
              ACTIVE_ACK: '激活已应答',
              ACTIVE_UNACK: '激活未应答',
              CLEARED_ACK: '清除已应答',
              CLEARED_UNACK: '清除未应答'
            }
            value = status[value]
          } else if (item.property === 'severity') {
            const severity = {
              critical: '危险',
              indeterminate: '不确定',
              major: '重要',
              minor: '次要',
              warning: '警告'
            }
            value = severity[value.toLowerCase()]
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
    this.$erd.listenTo(document.getElementById('query' + (this.id || '')), (element) => {
      this.$nextTick(() => {
        // 使尺寸重置
        this.tableHeight = 'calc(100% - ' + (element.offsetHeight + 35) + 'px)'
      })
    })
    // this.loop()
  },
  beforeDestroy () {
    clearInterval(this.timer)
    this.timer = null
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
// ::v-deep.widget-item-container .render-component-container{
//   height: auto;
// }
.table-container{
  height: 100%;
  ::v-deep.el-tabs{
    &.noTimewindow{
      height: 100% !important;
      min-height: auto !important;

    }
    &.displayTimewindow{
      height:calc(100% - 65px) !important;
      min-height: auto !important;
    }
    .el-tabs__content{
      padding: 15px 0 0;
    }
    // height:100%;
  }
  .query-container{
    ::v-deep.el-form-item{
      margin-bottom: 10px;
    }
  }
  .margin-bottom {
    margin-bottom: 10px;
  }
  .margin-right {
    margin-right: 10px;
  }
  ::v-deep.el-table .el-table__body-wrapper .el-table__body{
    .severity-red{
      .cell{
        color: red;
        font-weight: bold;
      }
    }
    .severity-tangerine{
      .cell{
        color: orangered;
        font-weight: bold;
      }
    }
    .severity-orange{
      .cell{
        color: orange;
        font-weight: bold;
      }
    }
    .severity-yellow{
      .cell{
        color: yellow;
        font-weight: bold;
      }
    }
    .severity-blue{
      .cell{
        color: blue;
        font-weight: bold;
      }
    }
  };
  .selection-msg{
    position: absolute;
    top: 0px;
    left: 0px;
    background: #6993ff;
    color: white;
    padding: 10px;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

}
::v-deep.icloud-dialog__wrapper .icloud-dialog .icloud-dialog__body .el-form .el-form-item .el-form-item__content .el-input{
    &.severity-red{
      .el-input__inner{
        color: red;
        font-weight: bold;
      }
    }
    &.severity-tangerine{
      .el-input__inner{
        color: orangered;
        font-weight: bold;
      }
    }
    &.severity-orange{
      .el-input__inner{
        color: orange;
        font-weight: bold;
      }
    }
    &.severity-yellow{
      .el-input__inner{
        color: yellow;
        font-weight: bold;
      }
    }
    &.severity-blue{
      .el-input__inner{
        color: blue;
        font-weight: bold;
      }
    }
  }
</style>
