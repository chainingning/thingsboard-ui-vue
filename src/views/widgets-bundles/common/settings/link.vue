<template>
  <icloud-dialog
    :title="widgetInfo.name"
    :visible.sync="visible"
    width="1000px">
    <el-tabs type="border-card">
      <el-tab-pane label="设置">
        <el-form ref="settings" :model="settings" :rules="settingsRules">
          <el-form-item label="标题" prop="title" style="margin-bottom: 40px">
            <el-input v-model="settings.title"></el-input>
          </el-form-item>
          <el-form-item>
            <el-checkbox v-model="settings.showTitle">显示标题</el-checkbox>
          </el-form-item>
        </el-form>
      </el-tab-pane>
      <el-tab-pane label="高级">
        <el-form ref="highSettings" :model="highSettings" :rules="highSettingsRules">
          <el-form-item label="跳转文字" prop="buttonText">
            <el-input v-model="highSettings.buttonText"></el-input>
          </el-form-item>
          <el-form-item label="链接地址" prop="linkUrl">
            <el-input v-model="highSettings.linkUrl"></el-input>
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>
    <div class="icloud-dialog-footer" slot="footer">
      <wx-button type="primary" @click="submit">确定</wx-button>
      <wx-button @click="visible = false">取消</wx-button>
    </div>
  </icloud-dialog>
</template>

<script>
export default {
  name: 'Links',
  data () {
    return {
      visible: false,
      widgetInfo: {},
      isDashboardEdit: true, // config && type === 'edit'
      config: null,
      type: '',
      id: '',
      settings: {
        title: '',
        showTitle: true
      },
      highSettings: {
        buttonText: '',
        linkUrl: ''
      },
      settingsRules: {
        title: [{ required: true, message: '标题不能为空', trigger: 'blur' }]
      },
      highSettingsRules: {
        buttonText: [{ required: true, message: '按钮文字不能为空', trigger: 'blur' }],
        linkUrl: [{ required: true, message: '跳转链接不能为空', trigger: 'blur' }]
      }
    }
  },
  methods: {
    openDialog ({ widgetInfo, config, type, id }) {
      console.log(widgetInfo, config)
      this.widgetInfo = widgetInfo
      this.config = config
      this.type = type
      this.id = id
      this.isDashboardEdit = config && type === 'edit'
      const defaultConfig = this.isDashboardEdit
        ? config.configuration.widgets[id].config
        : JSON.parse(widgetInfo.descriptor.defaultConfig)
      this.settings.title = this.isDashboardEdit ? config.configuration.widgets[id].config.title : widgetInfo.name
      this.settings.showTitle = defaultConfig.showTitle
      this.highSettings.buttonText = defaultConfig.settings.buttonText || ''
      this.highSettings.linkUrl = defaultConfig.settings.linkUrl || ''
      this.visible = true
    },
    submit () {
      const pSettings = new Promise(resolve => {
        this.$refs.settings.validate(valid => {
          if (valid) resolve()
        })
      })
      const pHigh = new Promise(resolve => {
        this.$refs.highSettings.validate(valid => {
          if (valid) resolve()
        })
      })
      Promise.all([pSettings, pHigh]).then(() => {
        if (this.config && this.type === 'edit') {
          const widgetInfo = this.config.configuration.widgets[this.id]
          this.$emit('submit', {
            ...widgetInfo,
            title: this.settings.title,
            config: {
              ...widgetInfo.config,
              showTitle: this.settings.showTitle,
              title: this.settings.title,
              settings: {
                ...widgetInfo.config.settings,
                buttonText: this.highSettings.buttonText,
                linkUrl: this.highSettings.linkUrl
              }
            }
          })
        } else {
          const defaultConfig = JSON.parse(this.widgetInfo.descriptor.defaultConfig)
          this.$emit('submit', Object.assign(this.widgetInfo, {
            name: this.settings.title,
            descriptor: {
              ...this.widgetInfo.descriptor,
              defaultConfig: JSON.stringify({
                ...defaultConfig,
                showTitle: this.settings.showTitle,
                title: this.settings.title,
                settings: {
                  ...defaultConfig.settings,
                  buttonText: this.highSettings.buttonText,
                  linkUrl: this.highSettings.linkUrl
                }
              })
            }
          }))
        }
        this.visible = false
      })
    }
  }
}
</script>

<style lang="scss" scoped></style>
