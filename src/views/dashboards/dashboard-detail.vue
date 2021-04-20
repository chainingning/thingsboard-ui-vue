<template>
    <div class="app-container" ref="appContainer" v-fullscreen="isDashboardFullscreen" style="margin-left: 20px">
      <widget-item-container v-for="(val, key) in info.configuration.widgets" :key="key" :title="val.config.showTitle?val.config.title:''"
                             v-change-pos-size:[isEdit]="val" :style="'position:absolute'">
        <div slot="header-right">
          <i class="iconfont"
             :class="val.fullscreen ? 'icon-suoxiao' : 'icon-quanping'"
             @click="
              $set(val, 'fullscreen', !val.fullscreen),
              widgetInfoList[val.id.id] = Object.assign({}, widgetInfoList[val.id.id])
            ">
          </i>
          <template v-if="isEdit">
            <i class="iconfont icon-xiugai" @click="oper('edit', val, key)"></i>
            <i class="iconfont icon-xiazai" @click="oper('export', val, key)"></i>
            <i class="iconfont icon-remove" @click="oper('delete', val, key)"></i>
          </template>
        </div>
        <render-widget-component v-if="!isLoadingWidgetInfo" slot="render-component" :widgetInfo="widgetInfoList[val.id.id]" :config="info" :id="key"></render-widget-component>
      </widget-item-container>
      <div class="btn-box" :class="isDashboardFullscreen?'fullscreen-btn-box':''">
        <div class="icon-box">
          <template v-if="!isEdit">
            <wx-button v-if="!isCustomer" type="primary" icon="el-icon-edit" circle @click="isEdit=true"></wx-button>
          </template>
          <template v-else>
            <el-dropdown trigger="click" placement="top-start">
              <wx-button type="primary" icon="el-icon-plus" circle></wx-button>
              <el-dropdown-menu slot="dropdown" class="iconfont">
                <el-dropdown-item icon="icon-guize" @click.native="openDialog('add')">添加部件</el-dropdown-item>
                <el-dropdown-item icon="icon-daoru" @click.native="openDialog('import')">导入部件</el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
            <wx-button type="primary" icon="el-icon-check" circle @click="confirm"></wx-button>
            <wx-button type="primary" icon="el-icon-close" circle @click="cancel"></wx-button>
          </template>
        </div>
        <wx-button type="primary" icon="icon-time" circle title="编辑时间窗口" @click="editTimeDialog"></wx-button>
        <wx-button type="primary" icon="icon-add-device" circle title="实体" @click="addEntity"></wx-button>
        <wx-button type="primary" :icon="isDashboardFullscreen ? 'icon-suoxiao' : 'icon-quanping'" circle @click="fullScreen"></wx-button>
      </div>
      <icloud-dialog
        :title="dialogTitle"
        width="1000px"
        :visible.sync="visible">
        <el-form ref="form" :model="form" :rules="rules">
          <!-- 添加部件包 -->
          <template v-if="tplType === 'add'">
            <el-form-item label="当前包" prop="package">
              <el-select v-model="form.package" placeholder="选择部件包" @change="selectPackage" filterable>
                <el-option v-for="item in packageList"
                           :key="item.id.id" :label="item.title" :value="item.id.id"></el-option>
              </el-select>
            </el-form-item>
            <div v-for="(item, index) in widgetList" style="margin-bottom: 20px" :key="index"
                 @click="clickWidget(item)">
              <widget-item-container :fullscreen="item.fullscreen" :title="item.name">
                <div slot="header-right">
                  <i class="iconfont"
                     :class="item.fullscreen ? 'icon-suoxiao' : 'icon-quanping'"
                     @click="$set(item, 'fullscreen', !item.fullscreen)">
                  </i>
                </div>
                <render-widget-component slot="render-component" :widgetInfo="item"></render-widget-component>
              </widget-item-container>
            </div>
          </template>
          <!-- 导入部件类型 -->
          <template v-else-if="tplType === 'import'">
            <el-form-item label="导入部件类型" prop="file">
              <el-upload
                class="el-input"
                ref="upload"
                action="#"
                accept=".json"
                drag
                :limit="1"
                :http-request="httpRequest"
                :on-remove="onRemove"
                :on-exceed="handleExceed">
                <i class="el-icon-upload"></i>
                <div class="el-upload__text">拖动一个JSON文件或者单击以选择要上传的文件</div>
              </el-upload>
            </el-form-item>
          </template>
        </el-form>
        <div v-if="tplType!='add'" class="icloud-dialog-footer" slot="footer">
          <wx-button type="primary" @click="submit">确定</wx-button>
          <wx-button @click="visible = false">取消</wx-button>
        </div>
      </icloud-dialog>
      <add-entity-dialog ref="addEntityDialog" @submit="submitEntityAliases"></add-entity-dialog>
      <time-window-dialog ref="timeWindowDialog" @submit="submitTimewindow"></time-window-dialog>
      <settings ref="settings" @submit="submitSetting"></settings>
    </div>
</template>

<script>
import widgetItemContainer from '@/views/widgets-bundles/common/widget-item-container'
import renderWidgetComponent from '@/views/widgets-bundles/common/render-widget-component'
import settings from '@/views/widgets-bundles/common/settings'
import addEntityDialog from './components/add-entity-dialog'
import timeWindowDialog from './components/time-window-dialog'
import { deepCopy, getUuid } from '@/utils'
import { resize } from '@/mixins'
export default {
  mixins: [resize],
  props: ['id'],
  components: {
    widgetItemContainer,
    renderWidgetComponent,
    settings,
    addEntityDialog,
    timeWindowDialog
  },
  data () {
    return {
      isEdit: false,
      isDashboardFullscreen: false,
      initInfo: {}, // 初始应用库
      info: {
        configuration: {
          entityAliases: {},
          timewindow: {},
          widgets: {}
        }
      }, // 应用库
      settingType: 'add', // 设置类型
      settingWidgetId: '', // 应用库部件列表正在修改的id
      isLoadingWidgetInfo: true, // 部件包是否正在请求
      widgetInfoList: {}, // 所有仪表盘用到的部件库部件详情列表
      packageList: [],
      widgetList: [], // 部件包的部件列表
      visible: false,
      dialogTitle: '',
      tplType: 'add',
      form: {
        file: '',
        package: ''
      },
      rules: {
        file: [{ required: true, message: '上传的文件不能为空', trigger: 'change' }]
      },
      sysId: this.$store.getters.userInfo.tenantId.id,
      isCustomer: this.$store.getters.userInfo.authority === 'CUSTOMER_USER'
    }
  },
  methods: {
    editTimeDialog () {
      this.$refs.timeWindowDialog.openDialog(this.info.configuration.timewindow)
    },
    addEntity () {
      if (!this.isEdit) return
      this.$refs.addEntityDialog.openDialog(this.info.configuration.entityAliases, this.info.tenantId)
    },
    fullScreen () {
      this.isDashboardFullscreen = !this.isDashboardFullscreen
    },
    async confirm () { // 保存应用库
      this.isEdit = false
      this.isLoadingWidgetInfo = true
      try {
        await this.$api.postDashboard(this.info)
        this.$message.success('操作成功')
        this.isLoadingWidgetInfo = false
      } catch (e) {
        this.$message.error(e.response.data.message)
      }
    },
    cancel () {
      this.isEdit = false
      this.initDashboard()
    },
    oper (operType, item, id) {
      switch (operType) {
        case 'edit':
          this.editWidget(item, id)
          break
        case 'export':
          // this.exportWidget(item)
          break
        case 'delete':
          this.deleteWidget(id)
          break
        default:
          break
      }
    },
    editWidget (item, id) {
      this.settingType = 'edit'
      this.settingWidgetId = id
      this.$refs.settings.openDialog({
        widgetInfo: this.widgetInfoList[item.id.id],
        config: this.info,
        type: 'edit',
        id
      })
    },
    deleteWidget (id) {
      const widgets = this.info.configuration.widgets
      delete widgets[id]
      this.info.configuration.widgets = deepCopy(widgets)
    },
    async openDialog (type) {
      this.tplType = type
      if (type === 'add') {
        this.dialogTitle = '选择部件'
        // 解决地图部件卡住，图表不显示等bug
        this.form.package = ''
        this.widgetList = []
        const res = await this.$api.getWidgetsBundlesList()
        this.packageList = res.data
      } else {
        this.dialogTitle = '导入部件'
      }
      this.visible = true
    },
    async selectPackage (value) {
      const info = this.packageList.find(item => item.id.id === value)
      const res = await this.$api.getWidgetTypes({
        isSystem: this.sysId !== info.tenantId.id,
        bundleAlias: info.alias
      })
      this.widgetList = res.data
    },
    clickWidget (item) {
      this.visible = false
      this.settingType = 'add'
      this.$refs.settings.openDialog({
        widgetInfo: item,
        config: this.info,
        type: 'add'
      })
    },
    submitSetting (widget) {
      if (this.settingType === 'add') { // 添加部件设置
        this.widgetInfoList[widget.id.id] = widget
        this.addWidgetToDashboard(widget)
      } else { // 修改部件设置
        this.widgetInfoList = deepCopy(this.widgetInfoList)
        this.editWidgetSetting(widget)
      }
      this.$forceUpdate()
    },
    submitEntityAliases (val) {
      this.info.configuration.entityAliases = val
    },
    submitTimewindow (val) {
      if (this.isEdit) {
        this.info.configuration.timewindow = val
      } else {
        this.updateTimewindow(val)
      }
    },
    httpRequest (data) {
      const isJson = data.file.type === 'application/json'
      if (isJson) {
        const reader = new FileReader()
        reader.onload = evt => {
          try {
            this.form.file = JSON.parse(evt.target.result)
          } catch (error) {
            this.$message.error(String(error))
            this.$refs.upload.clearFiles()
          }
        }
        reader.readAsText(data.file)
      } else {
        this.$message.error('应用库只能上传JSON文件')
      }
    },
    onRemove (file, fileList) {
      this.form.file = ''
    },
    handleExceed (files, fileList) {
      this.$message.warning('部件包只能上传一个文件')
    },
    submit () {
      try {
        this.$refs.form.validate(async valid => {
          if (!valid) return false
          const isTpl = this.tplType === 'add'
          if (isTpl) {} else {
            console.log(this.form.file)
          }
          this.$message.success('操作成功')
          this.visible = false
        })
      } catch (error) {
        this.$message.error(error.response.data.message)
      }
    },
    addWidgetToDashboard (widget) {
      if (!this.info.configuration.widgets) {
        this.info.configuration.widgets = {}
      }
      const { defaultConfig, sizeX, sizeY, type } = widget.descriptor
      const obj = {
        id: {
          id: widget.id.id
        },
        title: widget.name,
        bundleAlias: widget.bundleAlias,
        config: JSON.parse(defaultConfig),
        isSystemType: this.sysId !== widget.tenantId.id,
        sizeX,
        sizeY,
        col: 0,
        row: this.calWidgetTop(),
        type,
        typeAlias: widget.alias
      }
      let newWidgetId = ''
      if (this.info.configuration.widgets[widget.id.id]) {
        newWidgetId = getUuid()
      } else {
        newWidgetId = widget.id.id
      }
      this.info.configuration.widgets[newWidgetId] = obj
    },
    calWidgetTop () {
      if (!this.info.configuration.widgets) {
        return 0
      }
      const widgetList = this.info.configuration.widgets
      let maxBottom = 0
      for (const key in widgetList) {
        const top = widgetList[key].row ? widgetList[key].row : 0
        const height = widgetList[key].sizeY
        const bottom = top + height
        maxBottom = maxBottom > bottom ? maxBottom : bottom
      }
      return maxBottom
    },
    editWidgetSetting (widget) {
      this.info.configuration.widgets[this.settingWidgetId] = widget
    },
    async initDashboard () {
      const res = await this.$api.getDashboardInfos(this.id)
      this.info = res.data
      const widgets = this.info.configuration.widgets
      for (const key in widgets) {
        const { bundleAlias, typeAlias, isSystemType } = widgets[key]
        const result = await this.$api.getWidgetTypeInfo({
          isSystem: isSystemType,
          bundleAlias,
          alias: typeAlias
        })
        this.widgetInfoList[widgets[key].id.id] = result.data
      }
      this.isLoadingWidgetInfo = false // 所有部件请求完毕
    },
    async updateTimewindow (timeVal) {
      const res = await this.$api.getDashboardInfos(this.id)
      this.info = res.data
      this.info.configuration.timewindow = timeVal
      const widgets = this.info.configuration.widgets
      for (const key in widgets) {
        const { bundleAlias, typeAlias, isSystemType } = widgets[key]
        const result = await this.$api.getWidgetTypeInfo({
          isSystem: isSystemType,
          bundleAlias,
          alias: typeAlias
        })
        this.widgetInfoList[widgets[key].id.id] = result.data
      }
      this.isLoadingWidgetInfo = false // 所有部件请求完毕
    }
  },
  async created () {
    this.initDashboard()
  },
  beforeRouteLeave (to, from, next) {
    if (this.isEdit) {
      this.$confirm('您有未保存的更改。确定要离开此页面吗', '未保存的更改', {
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }).then(_ => {
        next()
      }).catch(_ => {})
    } else {
      next()
    }
  }
}
</script>

<style scoped lang="scss">
  .app-container {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    background-color: #f4f6fa;
    border: none !important;
    overflow: auto;
    .btn-box {
      position: fixed;
      right: 40px;
      top: 90px;
      display: flex;
      flex-direction: row;
      align-items: center;
      .icon-box {
        display: flex;
      }
      .wx-button {
        margin-right: 10px;
      }
    }
    .fullscreen-btn-box {
      top: 10px;
    }
  }
</style>
