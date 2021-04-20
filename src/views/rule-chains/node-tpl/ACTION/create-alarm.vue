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
    <el-form-item label="告警详情编译器" prop="alarmDetailsBuildJs" class="js-container">
      <span>function Details (msg, metadata, msgType) {</span>
      <Editor language="javascript"
        :codes="form.alarmDetailsBuildJs"
        @onCodeChange="$value => form.alarmDetailsBuildJs = $value" />
      <span>}</span>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" size="mini" @click="openTestScript()">测试详细信息功能</el-button>
    </el-form-item>
    <el-form-item prop="useMessageAlarmData">
      <el-checkbox v-model="form.useMessageAlarmData">使用消息警报数据</el-checkbox>
    </el-form-item>
    <template v-if="!form.useMessageAlarmData">
      <div class="alarm-container">
        <el-form-item label="警报类型" prop="alarmType">
          <el-input v-model="form.alarmType"></el-input>
          <span class="desc">类型模式,使用 ${metaKeyName} 替换元数据中的变量</span>
        </el-form-item>
        <el-form-item label="告警等级" prop="severity">
          <el-select v-model="form.severity">
            <el-option label="危险" value="CRITICAL"></el-option>
            <el-option label="重要" value="MAJOR"></el-option>
            <el-option label="次要" value="MINOR"></el-option>
            <el-option label="警告" value="WARNING"></el-option>
            <el-option label="不确定" value="INDETERMINATE"></el-option>
          </el-select>
        </el-form-item>
      </div>
      <el-form-item>
        <el-checkbox v-model="form.propagate">传播</el-checkbox>
      </el-form-item>
    </template>
    <el-form-item label="描述" prop="description">
      <el-input type="textarea" autosize v-model="form.description"></el-input>
    </el-form-item>
    <test-script ref="testScript" title="测试详细信息功能"></test-script>
  </el-form>
</template>

<script>
import Editor from '@/components/Editor'
import TestScript from '../test-script'
export default {
  name: 'CreateAlarm',
  props: ['nodeInfo', 'configurationDescriptor'],
  components: { Editor, TestScript },
  data () {
    return {
      isTplType: false,
      form: {
        name: '',
        alarmDetailsBuildJs: '',
        useMessageAlarmData: '',
        alarmType: '',
        severity: '',
        propagate: '',
        debugMode: '',
        description: ''
      },
      rules: {
        name: [{ required: true, message: '名称不能为空', trigger: 'change' }],
        alarmType: [{ required: true, message: '警报类型不能为空', trigger: 'change' }],
        severity: [{ required: true, message: '警报严重性不能为空', trigger: 'change' }]
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
        script: this.form.alarmDetailsBuildJs,
        metaData: [
          { key: 'deviceType', value: 'default' },
          { key: 'deviceName', value: 'Test Device' },
          { key: 'ts', value: new Date().getTime() }
        ],
        scriptType: 'json',
        funName: 'Details'
      })
    },
    submit () {
      this.$refs.form.validate(valid => {
        if (!valid) return false
        this.$emit('submit', {
          debugMode: this.form.debugMode || false,
          name: this.form.name,
          configuration: {
            alarmDetailsBuildJs: this.form.alarmDetailsBuildJs,
            alarmType: this.form.alarmType,
            severity: this.form.severity,
            propagate: this.form.propagate,
            useMessageAlarmData: this.form.useMessageAlarmData
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
  /deep/ .js-container {
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
  /deep/ .alarm-container {
    @include clearfix();
    .el-form-item {
      float: left;
      &:nth-of-type(1) {
        width: 55%;
      }
      &:nth-of-type(2) {
        margin-left: 10px;
        width: calc(45% - 10px);
      }
    }
  }
</style>
