<template>
  <el-form ref="form" :model="form" :rules="rules">
    <div class="name-container">
      <el-form-item label="名称" prop="name">
        <el-input multiple v-model="form.name"></el-input>
      </el-form-item>
      <el-form-item prop="debugMode">
        <el-checkbox v-model="form.debugMode">调试模式</el-checkbox>
      </el-form-item>
    </div>
    <el-form-item label="路由" prop="jsScript" class="switch-container">
      <span>function Filter (msg, metadata, msgType) {</span>
      <Editor language="javascript"
        :codes="form.jsScript"
        @onCodeChange="$value => form.jsScript = $value" />
      <span>}</span>
    </el-form-item>
    <el-button type="primary" size="mini" @click="openTestScript()">测试路由功能</el-button>
    <el-form-item label="描述" prop="description">
      <el-input type="textarea" autosize v-model="form.description"></el-input>
    </el-form-item>
    <test-script ref="testScript" title="测试路由功能"></test-script>
  </el-form>
</template>

<script>
import Editor from '@/components/Editor'
import TestScript from '../test-script'
export default {
  name: 'JsSwitch',
  props: ['nodeInfo', 'configurationDescriptor'],
  components: { Editor, TestScript },
  data () {
    return {
      isTplType: false,
      form: {
        name: '',
        jsScript: '',
        debugMode: '',
        description: ''
      },
      rules: {
        name: [{ required: true, message: '名称不能为空', trigger: 'change' }]
      }
    }
  },
  methods: {
    openTestScript () {
      this.$refs.testScript.openDialog({
        msg: JSON.stringify({
          temperature: 22.4,
          humidity: 78
        }, null, 2),
        metaData: [
          { key: 'deviceType', value: 'default' },
          { key: 'deviceName', value: 'Test Device' },
          { key: 'ts', value: new Date().getTime() }
        ],
        scriptType: 'switch',
        funName: 'Switch',
        script: this.form.jsScript
      })
    },
    submit () {
      this.$refs.form.validate(valid => {
        if (!valid) return false
        this.$emit('submit', {
          debugMode: this.form.debugMode || false,
          name: this.form.name,
          configuration: {
            jsScript: this.form.jsScript
          },
          additionalInfo: {
            description: this.form.description
          },
          tplType: this.isTplType ? 'add' : 'edit'
        })
      })
    },
    init () {
      const { ...defaultConfiguration } = this.configurationDescriptor.nodeDefinition.defaultConfiguration
      const { ...configuration } = this.nodeInfo.configuration || {}
      const { name, debugMode } = this.nodeInfo
      const { description } = this.nodeInfo.additionalInfo || {}
      Object.assign(configuration, {
        name,
        debugMode,
        description
      })
      for (const key in this.form) {
        this.form[key] = this.isTplType ? defaultConfiguration[key] : configuration[key]
      }
    }
  },
  created () {
    this.isTplType = Object.is(JSON.stringify(this.nodeInfo), '{}')
    this.init()
  }
}
</script>

<style lang="scss" scoped>
  /deep/ .switch-container {
    margin-bottom: 0 !important;
    .el-form-item__content {
      height: 300px;
      > span {
        float: left;
        width: 100%;
        line-height: 40px;
        font-size: 13px;
        color: #666;
      }
      .editor-container {
        margin-top: 60px;
        height: 270px;
        .overflow-guard {
          border-radius: 4px;
          border: 1px solid #DCDFE6;
        }
      }
    }
  }
</style>
