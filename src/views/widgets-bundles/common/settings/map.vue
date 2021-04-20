<template>
  <icloud-dialog
    :title="widgetInfo.name"
    :visible.sync="visible"
    width="1000px">
    <el-tabs type="border-card" v-model="tabName">
      <el-tab-pane label="数据" name="1">
        <el-collapse v-model="activeName">
          <el-row>
            <el-col :span="12">
              <el-checkbox v-model="useDashboardTimewindow" @change="changeUseDashboardTimewindow">使用应用的时间窗口</el-checkbox>
            </el-col>
            <el-col :span="12">
              <span>时间窗口</span>
              <el-button type="primary" title="编辑时间窗口" @click="editTimewindow" :disabled="useDashboardTimewindow">
                <i class="el-icon-time el-icon--left"></i>
                {{timewindow | formatConfigTime}}
              </el-button>
            </el-col>
          </el-row>
          <el-row>
            <el-col :span="12">
              <el-checkbox v-model="displayTimewindow" @change="changeDisplayTimewindow">显示时间窗口</el-checkbox>
            </el-col>
          </el-row>
          <el-collapse-item title="数据源" name="1">
            <el-table :data="list" border>
              <el-table-column
                v-for="item in listTitle"
                :key="item.property"
                :min-width="item.width"
                :label="item.label">
                <template slot-scope="scope">
                  <el-select v-if="item.property === 'type'" v-model="scope.row[item.property]" @change="scope.row.dataKeys = []">
                    <el-option v-if="config" label="实体" value="entity"></el-option>
                    <el-option label="函数" value="function"></el-option>
                  </el-select>
                  <el-select
                    v-else-if="item.property === 'name'"
                    v-model="scope.row[list[scope.$index].type === 'entity' ? 'entityAliasId' : 'name']"
                    filterable
                    clearable
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
                      <i v-if="scope.row.type === 'entity'" class="iconfont icon" :class="fnItem.type === 'timeseries' ? 'icon-line' : 'icon-R'"></i>
                      <span class="fn-name">{{ `${fnItem.label}: ${fnItem.name}` }}</span>
                      <i class="iconfont icon-xiugai"
                        @click="editFn(fnItem, scope.row.type), recordIndex = { listIndex: scope.$index, dataKeysIndex: index }"></i>
                      <i class="iconfont icon-remove" @click="scope.row[item.property].splice(index, 1)"></i>
                    </div>
                    <el-input
                      v-if="list[scope.$index].type === 'function'"
                      v-model="scope.row.fnName"
                      @keyup.enter.native="addFn(scope.row.fnName, scope.$index)" />
                    <el-select
                      v-else
                      v-model="scope.row.fnName"
                      @focus="handlerFocus(scope.$index)"
                      @change="$value => addFn($value, scope.$index)"
                      filterable
                      clearable
                      remote
                      :remote-method="createDataKey">
                      <el-option v-for="(r, i) in dataKeysOptions" :key="i" :label="r.label" :value="r.value" :disabled="!r.icon">
                        <template v-if="r.icon">
                          <i class="iconfont" :class="r.icon" style="float: left;margin-right:10px;color:#6993FF;"></i>
                          <span style="float: left">{{r.value}}</span>
                        </template>
                      </el-option>
                    </el-select>
                  </template>
                  <span v-else-if="item.property === 'btn'">
                    <i class="iconfont icon-remove" @click="list.splice(scope.$index, 1)"></i>
                  </span>
                </template>
              </el-table-column>
            </el-table>
            <el-button type="primary" @click="addType">添加</el-button>
          </el-collapse-item>
        </el-collapse>
      </el-tab-pane>
      <el-tab-pane label="设置" name="2">
        <el-form ref="base" :model="base" :rules="baseRules">
          <el-form-item label="标题" prop="title" style="margin-bottom: 40px">
            <el-input v-model="base.title"></el-input>
          </el-form-item>
          <el-form-item>
            <el-checkbox v-model="base.showTitle">显示标题</el-checkbox>
          </el-form-item>
        </el-form>
      </el-tab-pane>
      <el-tab-pane label="高级" name="3">
        <el-form ref="settings" :model="settings" :rules="settingsRules">
          <el-form-item label="默认经纬度" prop="defaultCenterPosition" style="margin-bottom: 40px">
            <el-input v-model="settings.defaultCenterPosition"></el-input>
          </el-form-item>
          <el-form-item label="图片">
            <el-upload action="#"
                       :http-request="httpRequest"
                       list-type="picture-card"
                       :file-list="mapImgList"
                       :before-remove="beforeImgRemove"
                       :on-remove="handleRemove"
                       :before-upload="beforeImgUpload">
              <i class="el-icon-plus"></i>
            </el-upload>
          </el-form-item>
          <el-form-item label="经度名称" prop="lngKeyName">
            <el-input v-model="settings.lngKeyName"></el-input>
          </el-form-item>
          <el-form-item label="纬度名称" prop="latKeyName">
            <el-input v-model="settings.latKeyName"></el-input>
          </el-form-item>
          <el-form-item label="多边形名称" prop="polygonKeyName">
            <el-input v-model="settings.polygonKeyName"></el-input>
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>
    <div class="icloud-dialog-footer" slot="footer">
      <wx-button type="primary" @click="submit">确定</wx-button>
      <wx-button @click="visible = false">取消</wx-button>
    </div>
    <icloud-dialog title="数据键配置" :visible.sync="fnDialogVisible">
      <el-form ref="form" :model="form" :rules="rules">
        <el-form-item v-if="editInfo.type !== 'function'" label="键" prop="name">
          <el-input v-model="form.name" readonly></el-input>
        </el-form-item>
        <el-form-item label="标签" prop="label">
          <el-input v-model="form.label"></el-input>
        </el-form-item>
        <el-form-item label="颜色" prop="color">
          <el-color-picker v-model="form.color"></el-color-picker>
          <el-input v-model="form.color" readonly></el-input>
        </el-form-item>
        <el-form-item v-if="editInfo.type !== 'function'">
          <el-checkbox v-model="form.useFn">使用数据后处理功能</el-checkbox>
        </el-form-item>
        <div class="fn" v-if="editInfo.type === 'function' ? true : form.useFn">数据生成函数</div>
        <div class="fnName" v-if="editInfo.type === 'function' ? true : form.useFn">function (time, value) {</div>
        <el-form-item v-if="editInfo.type === 'function' ? true : form.useFn">
          <Editor language="javascript"
            :codes="editInfo.type === 'function' ? form.funcBody : form.postFuncBody"
            @onCodeChange="value => form[editInfo.type === 'function' ? 'funcBody' : 'postFuncBody'] = value" />
        </el-form-item>
        <div class="fnName" v-if="editInfo.type === 'function' ? true : form.useFn">}</div>
        <div class="fnParams" v-if="editInfo.type === 'function' ? true : form.useFn">
          <div>time - 当前值的时间戳;</div>
          <div>value - 当前值;</div>
        </div>
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
import { getBase64, isHasOwnProperty, formatTimestamp, formatTimeMs, randomColor } from '@/utils'
import timeWindowDialog from '@/views/dashboards/components/time-window-dialog'
export default {
  name: 'Maps',
  components: {
    timeWindowDialog
  },
  data () {
    const validatePosition = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('请输入坐标'))
      } else {
        // 校验经纬度：经度正负180,维度正负90
        const posReg = /^((-|\+)?(((\d|[1-9]\d|1[0-7]\d|0{1,3})\.\d{0,9})|(\d|[1-9]\d|1[0-7]\d|0{1,3})|180\.0{0,9}|180)),((-|\+)?([0-8]?\d{1}\.\d{0,9}|90\.0{0,9}|[0-8]?\d{1}|90))$/
        if (posReg.test(value)) {
          callback()
        } else {
          callback(new Error('坐标格式错误'))
        }
      }
    }
    return {
      tabName: '1',
      activeName: '1',
      recordIndex: null,
      visible: false,
      widgetInfo: {},
      isDashboardEdit: true, // config && type === 'edit'
      useDashboardTimewindow: true,
      displayTimewindow: false,
      timewindow: {},
      list: [],
      listTitle: [
        { property: 'type', label: '类型', width: 150 },
        { property: 'name', label: '参数', width: 150 },
        { property: 'dataKeys', label: '', width: 400 },
        { property: 'btn', label: '', width: 50 }
      ],
      entityList: [],
      typeList: [],
      dataKeysOptions: [],
      config: null,
      editInfo: {},
      fnDialogVisible: false,
      form: {
        name: '',
        label: '',
        color: '',
        funcBody: '',
        postFuncBody: '',
        useFn: false
      },
      rules: {
        name: [{ required: true }],
        label: [{ required: true, message: '标签不能为空', trigger: 'change' }]
      },
      base: {
        title: '',
        showTitle: true
      },
      baseRules: {
        title: [{ required: true, message: '标题不能为空', trigger: 'blur' }]
      },
      settings: {
        defaultCenterPosition: '',
        lngKeyName: 'longitude',
        latKeyName: 'latitude',
        polygonKeyName: 'coordinates'
      },
      settingsRules: {
        defaultCenterPosition: [{ required: true, validator: validatePosition, trigger: 'blur' }],
        lngKeyName: [{ required: true, message: '经度名称不能为空', trigger: 'blur' }],
        latKeyName: [{ required: true, message: '纬度名称不能为空', trigger: 'blur' }],
        polygonKeyName: [{ required: true, message: '多边形名称不能为空', trigger: 'blur' }]
      },
      mapImgList: [],
      type: '',
      id: ''
    }
  },
  methods: {
    openDialog ({ widgetInfo, config, type, id }) {
      this.tabName = '1'
      this.widgetInfo = widgetInfo
      this.config = config
      this.type = type
      this.id = id
      this.isDashboardEdit = type === 'edit' && config
      const defaultConfig = this.isDashboardEdit
        ? config.configuration.widgets[id].config
        : JSON.parse(widgetInfo.descriptor.defaultConfig)
      this.useDashboardTimewindow = defaultConfig.useDashboardTimewindow
      this.displayTimewindow = !this.useDashboardTimewindow
      this.timewindow = defaultConfig.timewindow
      this.list = defaultConfig.datasources
      this.entityList = config ? config.configuration.entityAliases : {}
      this.base.title = this.isDashboardEdit ? config.configuration.widgets[id].title : widgetInfo.name
      this.base.showTitle = defaultConfig.showTitle
      const settings = defaultConfig.settings
      this.settings.defaultCenterPosition = settings.defaultCenterPosition
      this.mapImgList = settings.markerImages.map(item => ({ url: item }))
      this.settings.lngKeyName = settings.lngKeyName
      this.settings.latKeyName = settings.latKeyName
      this.settings.polygonKeyName = settings.polygonKeyName
      this.visible = true
    },
    submit () {
      const pSettings = new Promise(resolve => {
        this.$refs.settings.validate(valid => {
          if (valid) resolve()
        })
      })
      const pBase = new Promise(resolve => {
        this.$refs.base.validate(valid => {
          if (valid) resolve()
        })
      })
      Promise.all([pSettings, pBase]).then(() => {
        if (this.config && this.type === 'edit') {
          const widgetInfo = this.config.configuration.widgets[this.id]
          this.$emit('submit', {
            ...widgetInfo,
            title: this.base.title,
            config: {
              ...widgetInfo.config,
              showTitle: this.base.showTitle,
              title: this.base.title,
              datasources: this.list,
              useDashboardTimewindow: this.useDashboardTimewindow,
              displayTimewindow: this.displayTimewindow,
              timewindow: this.timewindow,
              settings: {
                ...widgetInfo.config.settings,
                ...this.settings,
                markerImages: this.mapImgList.map(item => item.url)
              }
            }
          })
        } else {
          const defaultConfig = JSON.parse(this.widgetInfo.descriptor.defaultConfig)
          this.$emit('submit', Object.assign(this.widgetInfo, {
            name: this.base.title,
            descriptor: {
              ...this.widgetInfo.descriptor,
              defaultConfig: JSON.stringify({
                ...defaultConfig,
                showTitle: this.base.showTitle,
                title: this.base.title,
                datasources: this.list,
                useDashboardTimewindow: this.useDashboardTimewindow,
                displayTimewindow: this.displayTimewindow,
                timewindow: this.timewindow,
                settings: {
                  ...defaultConfig.settings,
                  ...this.settings,
                  markerImages: this.mapImgList.map(item => item.url)
                }
              })
            }
          }))
        }
        this.visible = false
      })
    },
    async handlerFocus (index) {
      this.typeList = []
      const entityInfo = this.entityList[this.list[index].entityAliasId]
      let type = ''
      let id = ''
      if (entityInfo.filter[entityInfo.filter.type] instanceof Array) {
        type = entityInfo.filter.entityType
        id = entityInfo.filter[entityInfo.filter.type][0]
      } else {
        type = entityInfo.filter[entityInfo.filter.type].entityType
        id = entityInfo.filter[entityInfo.filter.type].id
      }
      const result = await Promise.all([
        this.$api.getPluginsTelemetryKeys(type, id, 'timeseries')
        // this.$api.getPluginsTelemetryKeys(type, id, 'attributes') // 地图部件不需要属性字段
      ])
      result.forEach((item, index) => {
        item.data.forEach(r => {
          this.typeList.push({
            label: r,
            value: r,
            type: index === 0 ? 'timeseries' : 'attributes',
            icon: index === 0 ? 'icon-line' : 'icon-R'
          })
        })
      })
      this.dataKeysOptions = this.typeList
    },
    createDataKey (value) {
      if (value !== '') {
        this.dataKeysOptions = this.dataKeysOptions.filter(item => item.label.toLowerCase().indexOf(value.toLowerCase()) > -1)
        if (!this.dataKeysOptions.length) {
          this.dataKeysOptions = [
            { label: `没有找到键'${value}',请选择要创建的'${value}'`, value: `没有找到键'${value}',请选择要创建的'${value}` },
            { label: value, value: `${value}`, icon: 'icon-line', type: 'timeseries' }
          ]
        }
      } else {
        this.dataKeysOptions = this.typeList
      }
    },
    addFn (fnName, index) {
      if (fnName === '') return
      const dataSourceInfo = this.list[index]
      let type = 'function'
      if (dataSourceInfo.type === 'entity') {
        // const typeInfo = this.typeList.filter(item => item.value === fnName)[0]
        const info = this.dataKeysOptions.filter(item => item.value === fnName)[0]
        type = info.type
      }
      const fnConfig = {
        color: randomColor(),
        label: fnName,
        setting: {},
        type,
        name: type === 'function' ? 'f(x)' : fnName
      }
      if (type === 'function') {
        fnConfig.funcBody = ''
      } else {
        fnConfig.postFuncBody = ''
      }
      this.list[index].dataKeys.push(fnConfig)
      this.list[index].fnName = ''
      this.dataKeysOptions = this.typeList
    },
    editFn (fnConfig) {
      this.editInfo = fnConfig
      for (const key in this.form) {
        this.form[key] = key === 'useFn'
          ? isHasOwnProperty(fnConfig, 'postFuncBody')
          : fnConfig[key]
      }
      this.fnDialogVisible = true
    },
    addType () {
      this.list.push({
        type: 'function',
        name: '',
        dataKeys: []
      })
    },
    fnConfigSubmit (formName) {
      this.$refs[formName].validate(valid => {
        if (!valid) return false
        const updateDataKeys = this.list[this.recordIndex.listIndex].dataKeys
        const updateParams = {
          color: this.form.color,
          label: this.form.label,
          setting: {},
          type: this.editInfo.type,
          name: this.form.name
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
    changeUseDashboardTimewindow (val) {
      this.displayTimewindow = !val
    },
    changeDisplayTimewindow (val) {
      this.useDashboardTimewindow = !val
    },
    editTimewindow () {
      this.$refs.timeWindowDialog.openDialog(this.timewindow)
    },
    submitTimewindow (val) {
      this.timewindow = val
    },
    async httpRequest (data) {
      const file = await getBase64(data.file)
      this.mapImgList.push({ url: file })
    },
    beforeImgRemove (file, fileList) {
      if (fileList.length <= 1) {
        this.$message.error('至少剩余一张图片！')
        return false
      }
    },
    handleRemove (file, fileList) {
      this.mapImgList = fileList
    },
    beforeImgUpload (file) {
      const isPic = ['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)
      const isLt2M = file.size / 1024 / 1024 < 2
      if (!isPic) {
        this.$message.error('上传图片只能是图片格式!')
      }
      if (!isLt2M) {
        this.$message.error('上传图片大小不能超过2MB!')
      }
      return isPic && isLt2M
    }
  },
  filters: {
    formatConfigTime (val) {
      let str = ''
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
</style>
