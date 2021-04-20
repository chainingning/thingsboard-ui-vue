<template>
  <div class="app-container">
    <div class="btn-box">
      <el-button type="primary" @click="setting" size="mini">设置</el-button>
      <el-button type="primary" @click="render" size="mini">运行</el-button>
      <el-button type="primary" v-if="showSave" @click="save" size="mini">保存</el-button>
    </div>
    <div class="tab-container">
      <el-tabs type="border-card">
        <el-tab-pane label="HTML">
          <Editor language="html" :codes="code.templateHtml" @onMounted="editors => editor.templateHtml = editors" />
        </el-tab-pane>
      </el-tabs>
      <el-tabs type="border-card">
        <el-tab-pane label="CSS">
          <Editor language="css" :codes="code.templateCss" @onMounted="editors => editor.templateCss = editors" />
        </el-tab-pane>
      </el-tabs>
      <el-tabs type="border-card">
        <el-tab-pane label="JAVASCRIPT">
          <Editor language="javascript" :codes="code.controllerScript" @onMounted="editors => editor.controllerScript = editors" />
        </el-tab-pane>
      </el-tabs>
      <el-tabs type="border-card" id="renderBox">
        <el-tab-pane label="视图">
          <render-widget-component
            :widgetInfo="widgetInfo" />
        </el-tab-pane>
      </el-tabs>
    </div>
    <settings ref="settings"></settings>
  </div>
</template>

<script>
import Editor from '@/components/Editor'
import RenderWidgetComponent from '../common/render-widget-component'
import Settings from '../common/settings'
export default {
  components: {
    Editor,
    RenderWidgetComponent,
    Settings
  },
  props: ['widgetsId'],
  data () {
    return {
      widgetInfo: {},
      descriptor: {},
      code: {
        templateHtml: '',
        templateCss: '',
        controllerScript: ''
      },
      editor: {
        templateHtml: null,
        templateCss: null,
        controllerScript: null
      },
      sysId: this.$store.getters.userInfo.tenantId.id,
      showSave: false
    }
  },
  methods: {
    setting () {
      this.$refs.settings.openDialog({
        widgetInfo: this.widgetInfo
      })
    },
    async save () {
      this.render()
      await this.$api.postWidgetType(this.widgetInfo)
      this.$message.success('保存成功')
    },
    render () {
      for (const key in this.editor) {
        Object.assign(this.descriptor, {
          [key]: this.editor[key].getValue()
        })
      }
    },
    initEditor () {
      const { descriptor } = this.widgetInfo
      this.descriptor = descriptor
      for (const key in this.code) {
        this.code[key] = descriptor[key]
        this.editor[key].setValue(descriptor[key])
      }
    },
    async getWidgetType () {
      const result = await this.$api.getWidgetType(this.widgetsId)
      this.widgetInfo = result.data
      this.showSave = this.sysId === this.widgetInfo.tenantId.id
    },
    async init () {
      await this.getWidgetType()
      this.initEditor()
      this.render()
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
    border: none !important;
    background-color: transparent;
    > .btn-box {
      position: absolute;
      right: 10px;
      top: -44px;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: flex-end;
    }
    .tab-container {
      height: 100%;
      overflow: auto;
      /deep/ .el-tabs {
        width: calc(50% - 10px);
        height: calc(50% - 10px);
        min-width: 400px;
        min-height: 390px;
        margin: 5px;
        float: left;
        .el-tabs__content {
          height: calc(100% - 48px);
          padding: 0;
          overflow: hidden;
          .el-card {
            overflow: auto;
          }
        }
      }
    }
  }
</style>
