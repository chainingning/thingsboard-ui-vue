<template>
  <icloud-dialog
    :title="widgetInfo.name"
    :visible.sync="visible"
    width="1000px">
    <el-tabs type="border-card">
      <el-tab-pane label="数据">
        <el-row>
          <el-col :span="12">
            <el-checkbox v-model="useDashboardTimewindow" @change="handleDashboardTimewindowClick">使用应用的时间窗口</el-checkbox>
          </el-col>
          <el-col :span="12">
            <span>时间窗口</span>
            <!-- <el-input v-model="activeTabName"></el-input> -->
            <el-button type="primary" title="编辑时间窗口" @click="editTimeDialog" :disabled="!displayTimewindow"><i class="el-icon-time el-icon--left"></i>{{configTimewindow | formatConfigTime}}</el-button>
          </el-col>
        </el-row>
        <el-row class="margin-bottom">
          <el-col :span="12">
            <el-checkbox v-model="displayTimewindow" @change="handleDisplayTimewindowClick">显示时间窗口</el-checkbox>
          </el-col>
        </el-row>
        <el-row class="margin-bottom">
          <el-col :span="12">
            <div  class="margin-bottom">告警状态</div>
            <el-select v-model="alarmSearchStatus">
              <el-option label="全部" value="ANY"></el-option>
              <el-option label="已激活" value="ACTIVE"></el-option>
              <el-option label="已清除" value="CLEARED"></el-option>
              <el-option label="已应答" value="ACK"></el-option>
              <el-option label="未应答" value="UNACK"></el-option>
            </el-select>
          </el-col>
          <el-col :span="12">
            <div  class="margin-bottom">告警轮询间隔（秒）</div>
            <el-input-number v-model="alarmsPollingInterval" :min="1"></el-input-number>
          </el-col>
        </el-row>
        <el-collapse v-model="activeName">
          <el-collapse-item title="告警源" name="1">
            <el-table :data="list" border>
              <el-table-column
                v-for="item in listTitle"
                :key="item.property"
                :min-width="item.width"
                :label="item.label">
                <template slot-scope="scope">
                  <el-select v-if="item.property === 'type'" v-model="scope.row[item.property]" @change="handleSelectType(scope.row)">
                    <el-option v-if="config" label="实体" value="entity"></el-option>
                    <el-option label="函数" value="function"></el-option>
                  </el-select>
                  <el-select
                    v-else-if="item.property === 'name'"
                    v-model="scope.row[list[scope.$index].type === 'entity' ? 'entityAliasId' : 'name']"
                    filterable
                    clearable
                    @clear="handleClear"
                    @change="handleSelectName"
                    :allow-create="list[scope.$index].type === 'function'">
                    <template v-if="list[scope.$index].type === 'entity'">
                      <el-option
                        v-for="entity in entityList"
                        :key="entity.id"
                        :label="entity.alias"
                        :value="entity.id" />
                    </template>
                  </el-select>
                  <template v-else-if="item.property === 'dataKeys'">
                    <div class="fn-item" v-for="(fnItem, index) in scope.row[item.property]" :key="index">
                      <el-color-picker v-if="fnItem.color" v-model="fnItem.color"></el-color-picker>
                      <i class="iconfont icon icon-alarm"></i>
                      <span class="fn-name">{{ `${fnItem.label}: ${fnItem.name}` }}</span>
                      <i class="iconfont icon-xiugai"
                        @click="editFn(fnItem, scope.row.type), recordIndex = { listIndex: scope.$index, dataKeysIndex: index }"></i>
                      <i class="iconfont icon-remove" @click="removeDataKey(scope.row[item.property],index)"></i>
                    </div>
                    <el-select
                      v-model="scope.row.fnName"
                      @focus="handlerFocus(scope.$index)"
                      @change="$value => addFn($value, scope.$index)"
                      filterable
                      clearable
                      remote
                      :remote-method="remoteMethod">
                      <el-option v-for="(r,i) in options" :key="i" :label="r.label" :value="r.value">
                        <template v-if="r.icon">
                          <i class="iconfont" :class="r.icon" style="float: left;margin-right:10px;color:#6993FF;"></i>
                          <span style="float: left">{{ r.label }}</span>
                        </template>
                      </el-option>
                    </el-select>
                  </template>
                  <span v-else-if="item.property === 'btn'">
                    <i class="iconfont icon-remove" @click="removeList(scope.$index)"></i>
                  </span>
                </template>
              </el-table-column>
            </el-table>
          </el-collapse-item>
        </el-collapse>
      </el-tab-pane>
      <el-tab-pane label="设置">
        <el-form ref="settings" :model="settings" :rules="settingsRules">
          <el-form-item label="标题" :prop="type === 'edit' && config?'':'title'" class="margin-bottom">
            <el-input v-model="settings.title"></el-input>
          </el-form-item>
          <el-form-item>
            <el-checkbox v-model="settings.showTitle" >显示标题</el-checkbox>
          </el-form-item>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="单位符号" class="margin-bottom">
                <el-input v-model="settings.units"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="小数位数" class="margin-bottom">
                <div class="full-row">
                  <el-input-number v-model="settings.decimals" :min="0" :max="15"></el-input-number>
                </div>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </el-tab-pane>
      <el-tab-pane label="高级">
        <el-form ref="highSettings" :model="highSettings">
          <el-form-item label="告警表名称" prop="alarmsTitle">
            <el-input v-model="highSettings.alarmsTitle"></el-input>
          </el-form-item>
          <el-form-item label="" prop="enableSelection">
             <el-checkbox v-model="highSettings.enableSelection">启用告警选择</el-checkbox>
          </el-form-item>
          <el-form-item label="" prop="enableSearch">
             <el-checkbox v-model="highSettings.enableSearch">启用告警搜索</el-checkbox>
          </el-form-item>
          <el-form-item label="" prop="enableSelectColumnDisplay">
             <el-checkbox v-model="highSettings.enableSelectColumnDisplay">启用要显示的选择列</el-checkbox>
          </el-form-item>
          <el-form-item label="" prop="enableStatusFilter">
             <el-checkbox v-model="highSettings.enableStatusFilter">启用告警状态筛选</el-checkbox>
          </el-form-item>
          <el-form-item label="" prop="displayDetails">
             <el-checkbox v-model="highSettings.displayDetails">显示详情</el-checkbox>
          </el-form-item>
          <el-form-item label="" prop="allowAcknowledgment">
             <el-checkbox v-model="highSettings.allowAcknowledgment">允许告警确认</el-checkbox>
          </el-form-item>
          <el-form-item label="" prop="allowClear">
             <el-checkbox v-model="highSettings.allowClear">允许告警清除</el-checkbox>
          </el-form-item>
          <el-form-item label="" prop="displayPagination">
             <el-checkbox v-model="highSettings.displayPagination">显示分页</el-checkbox>
          </el-form-item>
          <el-form-item label="默认页面大小" prop="defaultPageSize">
            <el-input v-model="highSettings.defaultPageSize"></el-input>
          </el-form-item>
          <el-form-item label="默认排序" prop="defaultSortOrder">
            <el-input v-model="highSettings.defaultSortOrder"></el-input>
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>
    <div class="icloud-dialog-footer" slot="footer">
      <wx-button type="primary" @click="submit" :disabled="isUnfinsh">确定</wx-button>
      <wx-button @click="visible = false">取消</wx-button>
    </div>
    <icloud-dialog title="数据键配置" :visible.sync="fnDialogVisible" class="dataConfigDialog">
      <el-form ref="form" :model="form" :rules="rules">
        <el-form-item label="键" prop="name">
          <el-input v-model="form.name" readonly></el-input>
        </el-form-item>
        <el-form-item label="标签" prop="label">
          <el-input v-model="form.label"></el-input>
        </el-form-item>
        <el-form-item label="颜色" prop="color">
          <el-color-picker v-model="form.color"></el-color-picker>
          <el-input v-model="form.color" readonly></el-input>
        </el-form-item>
      </el-form>
      <div class="icloud-dialog-footer" slot="footer">
        <wx-button type="primary" @click="fnConfigSubmit('form')">确定</wx-button>
        <wx-button @click="fnDialogVisible = false">取消</wx-button>
      </div>
    </icloud-dialog>
    <time-window-dialog ref="timeWindowDialog" @submit="submitTimewindow"></time-window-dialog>
  </icloud-dialog>
</template>

<script>
import { isHasOwnProperty, formatTimestamp, formatTimeMs, randomColor } from '@/utils'
import timeWindowDialog from '@/views/dashboards/components/time-window-dialog'
export default {
  name: 'Alarms',
  components: {
    timeWindowDialog
  },
  data () {
    return {
      activeName: '1',
      recordIndex: null,
      visible: false,
      widgetInfo: {},
      list: [],
      listTitle: [
        { property: 'type', label: '类型', width: 150 },
        { property: 'name', label: '参数', width: 150 },
        { property: 'dataKeys', label: '', width: 400 }
        // { property: 'btn', label: '', width: 50 }
      ],
      entityList: [],
      typeList: [],
      options: [],
      config: null,
      editInfo: {},
      fnDialogVisible: false,
      form: {
        name: '',
        label: '',
        color: '',
        funcBody: '',
        // postFuncBody: '',
        useFn: false,
        units: '',
        decimals: ''
      },
      rules: {
        name: [{ required: true }],
        color: [{ required: true, message: '颜色不能为空', trigger: 'change' }],
        label: [{ required: true, message: '标签不能为空', trigger: 'change' }]
      },
      type: '',
      id: '',
      useDashboardTimewindow: true,
      displayTimewindow: false,
      configTimewindow: {},
      inputTimewindow: '',
      isUnfinsh: false,
      highSettings: {
        alarmsTitle: '',
        allowAcknowledgment: true,
        allowClear: true,
        defaultPageSize: 10,
        defaultSortOrder: 'createdTime',
        displayDetails: true,
        displayPagination: true,
        enableSearch: true,
        enableSelectColumnDisplay: true,
        enableSelection: true,
        enableStatusFilter: true
      },
      settings: {
        title: '',
        showTitle: true,
        units: '',
        decimals: ''
      },
      settingsRules: {
        title: [{ required: true, message: '标题不能为空', trigger: 'blur' }]
      },
      alarmMsg: '',
      alarmsPollingInterval: 5,
      alarmSearchStatus: 'ANY'
    }
  },
  methods: {
    handleUseFnChange (val) {
      if (val) {
        this.form.postFuncBody = 'return value'
      } else {
        if (this.form.postFuncBody) {
          delete this.form.postFuncBody
        }
      }
    },
    handleDashboardTimewindowClick (val) {
      this.displayTimewindow = !val
    },
    handleDisplayTimewindowClick (val) {
      this.useDashboardTimewindow = !val
    },
    remoteMethod (value) {
      if (value !== '') {
        this.options = this.options.filter(item => item.label.toLowerCase().indexOf(value.toLowerCase()) > -1)
        if (!this.options.length) {
          this.options = [
            { label: `没有找到键'${value}',请选择要创建的'${value}'`, value },
            { label: value, value: `alarm-${value}`, icon: 'icon-alarm' }
          ]
        }
      } else {
        this.options = this.typeList
      }
    },
    editTimeDialog () {
      if (!this.configTimewindow.selectedTab) {
        this.configTimewindow.selectedTab = 0
      }
      if (!this.configTimewindow.realtime) {
        this.configTimewindow.realtime = {
          interval: 1000,
          timewindowMs: 60000
        }
      }
      if (!this.configTimewindow.aggregation) {
        this.configTimewindow.aggregation = {
          type: 'NONE',
          limit: 200
        }
      }
      if (!this.configTimewindow.history) {
        const now = new Date().getTime()
        this.configTimewindow.history = {
          fixedTimewindow: {
            startTimeMs: now - 60000,
            endTimeMs: now
          },
          historyType: 1,
          interval: 1000,
          timewindowMs: 60000
        }
      }
      this.$refs.timeWindowDialog.openDialog(this.configTimewindow)
    },
    submitTimewindow (val) {
      this.configTimewindow = val
    },
    openDialog ({ widgetInfo, config, type, id }) {
      this.widgetInfo = widgetInfo
      this.config = config
      this.type = type
      this.id = id
      const defaultConfig = (this.type === 'edit' && config)
        ? config.configuration.widgets[id].config
        : JSON.parse(widgetInfo.descriptor.defaultConfig)
      this.list = [defaultConfig.alarmSource]
      // this.useDashboardTimewindow = defaultConfig.useDashboardTimewindow || false
      this.displayTimewindow = defaultConfig.displayTimewindow || false
      this.useDashboardTimewindow = !this.displayTimewindow
      this.configTimewindow = (this.useDashboardTimewindow && config && config.configuration.timewindow) ? config.configuration.timewindow : (defaultConfig.timewindow || {
        selectedTab: 0,
        realtime: {
          interval: 1000,
          timewindowMs: 60000
        },
        aggregation: {
          type: 'NONE',
          limit: 200
        }
      })
      this.settings = {
        title: defaultConfig.title,
        showTitle: defaultConfig.showTitle,
        units: defaultConfig.units,
        decimals: defaultConfig.decimals
      }
      this.highSettings = {
        ...defaultConfig.settings,
        alarmsTitle: defaultConfig.settings.alarmsTitle || '',
        defaultPageSize: parseInt(defaultConfig.settings.defaultPageSize) || 10,
        defaultSortOrder: defaultConfig.settings.defaultSortOrder || 'createdTime'
      }
      this.alarmSearchStatus = defaultConfig.alarmSearchStatus || 'ANY'
      this.alarmsPollingInterval = defaultConfig.alarmsPollingInterval || 5
      this.entityList = config ? config.configuration.entityAliases : {}
      this.visible = true
    },
    submit () {
      const pSettings = new Promise(resolve => {
        this.$refs.settings.validate(valid => {
          if (valid) resolve()
        })
      })
      Promise.all([pSettings]).then(() => {
        if (!parseInt(this.highSettings.defaultPageSize)) {
          delete this.highSettings.defaultPageSize
        }
        if (this.highSettings.alarmsTitle === '') {
          delete this.highSettings.alarmsTitle
        }
        if (this.highSettings.defaultSortOrder === '') {
          delete this.highSettings.defaultSortOrder
        }
        if (this.config && this.type === 'edit') {
          const widgetInfo = this.config.configuration.widgets[this.id]
          this.$emit('submit', {
            ...widgetInfo,
            config: {
              ...widgetInfo.config,
              alarmSource: this.list[0],
              // useDashboardTimewindow: this.useDashboardTimewindow,
              displayTimewindow: this.displayTimewindow,
              timewindow: this.configTimewindow,
              settings: { ...this.highSettings },
              ...this.settings,
              title: this.highSettings.alarmsTitle || this.settings.title,
              alarmSearchStatus: this.alarmSearchStatus,
              alarmsPollingInterval: this.alarmsPollingInterval
            }
          })
        } else {
          const defaultConfig = JSON.parse(this.widgetInfo.descriptor.defaultConfig)
          this.$emit('submit', Object.assign(this.widgetInfo, {
            name: this.highSettings.alarmsTitle || this.settings.title,
            descriptor: {
              ...this.widgetInfo.descriptor,
              defaultConfig: JSON.stringify({
                ...defaultConfig,
                alarmSource: this.list[0],
                // useDashboardTimewindow: this.useDashboardTimewindow,
                displayTimewindow: this.displayTimewindow,
                timewindow: this.configTimewindow,
                settings: { ...this.highSettings },
                ...this.settings,
                alarmSearchStatus: this.alarmSearchStatus,
                alarmsPollingInterval: this.alarmsPollingInterval

              })
            }
          }))
        }
        this.visible = false
      })
    },
    handleClear () {
      this.isUnfinsh = true
    },
    handleSelectType (val) {
      val.dataKeys = []
      this.isUnfinsh = true
    },
    removeDataKey (item, index) {
      item.splice(index, 1)
      var isDatakey = this.list.filter((item) => {
        return (item.dataKeys.length === 0) || (item.type === 'entity' && !item.entityAliasId)
      })
      if (isDatakey.length > 0) {
        this.isUnfinsh = true
      } else {
        this.isUnfinsh = false
      }
    },
    removeList (index) {
      this.list.splice(index, 1)
      var isDatakey = this.list.filter((item) => {
        return (item.dataKeys.length === 0) || (item.type === 'entity' && !item.entityAliasId)
      })
      if (isDatakey.length > 0) {
        this.isUnfinsh = true
      } else {
        this.isUnfinsh = false
      }
    },
    handleSelectName (val) {
      if (val) {
        var isDatakey = this.list.filter((item) => {
          return (item.dataKeys.length === 0) || (item.type === 'entity' && !item.entityAliasId)
        })
        if (isDatakey.length > 0) {
          this.isUnfinsh = true
        } else {
          this.isUnfinsh = false
        }
      } else {
        this.isUnfinsh = true
      }
    },

    async handlerFocus (index) {
      this.typeList = [
        { label: '创建时间', value: 'alarm-createdTime', icon: 'icon-alarm' },
        { label: '开始时间', value: 'alarm-startTime', icon: 'icon-alarm' },
        { label: '结束时间', value: 'alarm-endTime', icon: 'icon-alarm' },
        { label: '应答时间', value: 'alarm-ackTime', icon: 'icon-alarm' },
        { label: '清除时间', value: 'alarm-clearTime', icon: 'icon-alarm' },
        { label: '起因', value: 'alarm-originatorName', icon: 'icon-alarm' },
        { label: '起因类型', value: 'alarm-originatorType', icon: 'icon-alarm' },
        { label: '类型', value: 'alarm-type', icon: 'icon-alarm' },
        { label: '严重程度', value: 'alarm-severity', icon: 'icon-alarm' },
        { label: '状态', value: 'alarm-status', icon: 'icon-alarm' }
      ]
      this.options = this.typeList
    },
    addFn (fnName, index) {
      if (fnName === '') return
      const type = 'alarm'
      const typeInfo = this.typeList.find(item => item.value === fnName)
      const fnConfig = {
        color: randomColor(),
        label: typeInfo ? typeInfo.label : fnName.split(`${type}-`)[1],
        setting: {},
        type,
        name: fnName.split(`${type}-`)[1]
      }
      if (type === 'function') {
        fnConfig.funcBody = 'return prevValue + 1;'
      }
      this.list[index].dataKeys.push(fnConfig)
      this.list[index].fnName = ''
      this.options = this.typeList
      var isDatakey = this.list.filter((item) => {
        return (item.dataKeys.length === 0) || (item.type === 'entity' && !item.entityAliasId)
      })
      if (isDatakey.length > 0) {
        this.isUnfinsh = true
      } else {
        this.isUnfinsh = false
      }
    },
    editFn (fnConfig) {
      this.editInfo = fnConfig
      for (const key in this.form) {
        this.form[key] = key === 'useFn'
          ? (isHasOwnProperty(fnConfig, 'postFuncBody'))
          : fnConfig[key]
      }
      if (this.form.useFn && this.form.postFuncBody === '') {
        this.form.postFuncBody = 'return value'
      } else if (this.editInfo.type === 'function' && this.form.funcBody === '') {
        this.form.funcBody = 'return prevValue+1'
      }
      this.alarmMsg = this.editorRules()
      this.fnDialogVisible = true
    },
    addType () {
      this.list.push({
        type: 'function',
        name: '',
        dataKeys: []
      })
      this.isUnfinsh = true
    },
    fnConfigSubmit (formName) {
      this.$refs[formName].validate(valid => {
        if (!valid) return false
        this.alarmMsg = this.editorRules()
        if (this.alarmMsg !== '') {
          return false
        }
        const updateDataKeys = this.list[this.recordIndex.listIndex].dataKeys
        const updateParams = {
          color: this.form.color,
          label: this.form.label,
          setting: {},
          type: this.editInfo.type,
          name: this.form.name,
          units: this.form.units,
          decimals: this.form.decimals
        }
        if (this.editInfo.type === 'function') {
          updateParams.funcBody = this.form.funcBody
        } else if (this.form.useFn) {
          updateParams.postFuncBody = this.form.postFuncBody
        }
        this.$set(updateDataKeys, this.recordIndex.dataKeysIndex, updateParams)
        this.fnDialogVisible = false
      })
    },
    editorRules () {
      var value = ''
      if (this.editInfo.type === 'function') {
        if (this.form.funcBody.indexOf('return') === -1 || this.form.funcBody === '') {
          value = '必须要return一个值'
        }
      } else {
        if (this.form.useFn) {
          if ((this.form.postFuncBody && this.form.postFuncBody.indexOf('return') > -1)) {
            value = ''
          } else {
            value = '必须要return一个值'
          }
        }
      }
      return value
    }

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

<style lang="scss" scoped>
  .margin-bottom{
    margin-bottom: 10px;
  }
  .full-row{
    display: inline-block;
    width: 100%;
  }

  .el-table {
    i {
      cursor: pointer;
      &.icon-xiugai {
        color: #6993FF;
      }
      &.icon-remove {
        color: #f56c6c;
      }
    }
    /deep/ .fn-item {
      display: inline-flex;
      align-items: center;
      // display: inline-block;
      padding: 5px 20px;
      background-color: rgba(0, 0, 0, 0.1);
      border-radius: 20px;
      margin-bottom: 10px;
      margin-right: 10px;
      .el-color-picker {
        float: left;
        height: 30px;
        .el-color-picker__trigger {
          height: 30px;
          width: 30px;
          border: none;
        }
        .el-color-picker__color {
          border: none;
        }
        .el-color-picker__color-inner {
          border-radius: 50%;
        }
        .el-color-picker__icon {
          display: none;
        }
      }
      i {
        &.icon {
          margin-right: 10px;
          color:#6993FF;
        }
        &.icon-xiugai {
          margin: 0 10px;
        }
      }
    }
  }
  .alarmMsg{
    color: red;
  }
</style>
