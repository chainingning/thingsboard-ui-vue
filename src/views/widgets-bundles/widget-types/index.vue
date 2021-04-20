<template>
  <div class="app-container" v-loading="loading">
    <div class="widget-item-wrapper">
      <widget-item v-for="(item, index) in list" :key="index" v-fullscreen="item.fullscreen" :title="item.name">
        <div slot="header-right">
          <i class="iconfont"
            :class="item.fullscreen ? 'icon-suoxiao' : 'icon-quanping'"
            @click="$set(item, 'fullscreen', !item.fullscreen)">
          </i>
          <i v-if="sysId === item.tenantId.id" class="iconfont icon-xiugai" @click="oper('edit', item)"></i>
          <i class="iconfont icon-xiazai" @click="oper('export', item)"></i>
          <i v-if="sysId === item.tenantId.id" class="iconfont icon-remove" @click="oper('delete', item)"></i>
        </div>
        <render-widget-component slot="render-component" :widgetInfo="item"></render-widget-component>
      </widget-item>
    </div>
    <el-dropdown v-if="widgetInfo.tenantId.id===sysId" trigger="click" placement="top-start">
      <wx-button type="primary" icon="el-icon-plus" circle></wx-button>
      <el-dropdown-menu slot="dropdown" class="iconfont">
       <!-- <el-dropdown-item icon="icon-guize" @click.native="openDialog('add')">创建新的部件类型</el-dropdown-item> -->
        <el-dropdown-item icon="icon-daoru" @click.native="openDialog('import')">导入部件类型</el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>
    <icloud-dialog
      :title="title"
      :visible.sync="visible">
      <el-form ref="form" :model="form" :rules="rules">
        <!-- 添加部件包 -->
        <template v-if="tplType === 'add'">
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
      <div class="icloud-dialog-footer" slot="footer">
        <wx-button type="primary" @click="submit">确定</wx-button>
        <wx-button @click="visible = false">取消</wx-button>
      </div>
    </icloud-dialog>
  </div>
</template>

<script>
import WidgetItem from '../common/widget-item-container'
import RenderWidgetComponent from '../common/render-widget-component'
import FileSaver from 'file-saver'
export default {
  props: ['id'],
  components: {
    WidgetItem,
    RenderWidgetComponent
  },
  data () {
    return {
      loading: false,
      widgetInfo: {},
      list: [],
      visible: false,
      title: '',
      tplType: '',
      form: {
        title: '',
        file: ''
      },
      rules: {
        file: [{ required: true, message: '上传的文件不能为空', trigger: 'change' }]
      },
      sysId: this.$store.getters.userInfo.tenantId.id
    }
  },
  methods: {
    oper (operType, item) {
      switch (operType) {
        case 'edit':
          this.$router.push({
            path: `/widgets-bundles/${this.id}/${item.id.id}`,
            query: {
              title: [this.$route.query.title, item.name]
            }
          })
          break
        case 'export':
          this.exportWidget(item)
          break
        case 'delete':
          this.deleteWidget(item)
          break
        default:
          break
      }
    },
    deleteSuccess () {
      this.getWidgetTypes()
    },
    exportSuccess () {
      this.getWidgetTypes()
    },
    async init () {
      this.loading = true
      const res = await this.$api.getWidgetsBundleInfos(this.id)
      this.widgetInfo = res.data
      await this.getWidgetTypes()
      this.loading = false
    },
    async getWidgetTypes () {
      this.loading = true
      const res = await this.$api.getWidgetTypes({
        isSystem: this.sysId !== this.widgetInfo.tenantId.id,
        bundleAlias: this.widgetInfo.alias,
        fullscreen: false
      })
      this.list = res.data
      this.loading = false
    },
    openDialog (tplType) {
      this.tplType = tplType
      this.title = tplType === 'add' ? '添加部件包' : '导入部件包'
      this.visible = true
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
    async submit () {
      try {
        this.$refs.form.validate(async valid => {
          if (!valid) return false
          const isTpl = this.tplType === 'add'
          let res = null
          if (isTpl) {} else {
            const { alias, descriptor, name } = this.form.file
            res = await this.$api.postWidgetType({
              alias,
              descriptor,
              name,
              bundleAlias: this.widgetInfo.alias
            })
          }
          if (res.status === 200) {
            this.$message.success('操作成功')
            this.visible = false
            this.init()
          }
        })
      } catch (error) {
        this.$message.error(error.response.data.message)
      }
    },
    exportWidget (item) {
      const { alias, name, descriptor } = item
      const data = JSON.stringify({
        alias,
        name,
        descriptor
      }, null, 2)
      const blob = new Blob([data], { type: '' })
      FileSaver.saveAs(blob, `${name}.json`)
      this.$emit('exportSuccess')
    },
    deleteWidget (item) {
      this.$confirm('确认后，窗口部件类型和所有相关数据将不可恢复。', `您确定要删除部件类型 '${item.name}'吗？`, {
        confirmButtonText: '是',
        cancelButtonText: '否'
      }).then(async _ => {
        try {
          await this.$api.deleteWidgetType(item.id.id)
          this.$message.success('操作成功')
          this.init()
        } catch (error) {
          this.$message.error(error.response.data.message)
        }
      }).catch(() => {})
    }
  },
  created () {
    this.init()
  }
}
</script>

<style lang="scss" scoped>
.app-container {
  position: relative;
  background-color: transparent;
  border: none !important;
  .widget-item-wrapper {
    height: 100%;
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    overflow: auto;
  }
  > .el-dropdown /deep/ {
    position: absolute;
    top: -48px;
    right: 0;
  }
}
</style>
