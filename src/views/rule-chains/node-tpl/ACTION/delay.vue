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
    <el-form-item prop="useMetadataPeriodInSecondsPatterns">
      <el-checkbox v-model="form.useMetadataPeriodInSecondsPatterns">以秒为单位的元数据模式</el-checkbox>
      <div class="desc">如果选中,则规则节点使用消息元数据中以秒为间隔模式的时间段（假设间隔以秒为单位）</div>
    </el-form-item>
    <template v-if="this.form.useMetadataPeriodInSecondsPatterns">
      <el-form-item label="以秒为单位使用元数据周期" prop="periodInSecondsPattern">
        <el-input v-model="form.periodInSecondsPattern"></el-input>
        <span class="desc">以秒为周期的模式,使用 ${metaKeyName} 替换元数据中的变量</span>
      </el-form-item>
    </template>
    <template v-else>
      <el-form-item label="以秒为单位的时间" prop="periodInSeconds">
        <el-input v-model="form.periodInSeconds" :num="0"></el-input>
      </el-form-item>
    </template>
    <el-form-item label="最大待处理消息数" prop="maxPendingMsgs">
      <el-input v-model="form.maxPendingMsgs" :num="1"></el-input>
    </el-form-item>
    <el-form-item label="描述" prop="description">
      <el-input type="textarea" autosize v-model="form.description"></el-input>
    </el-form-item>
  </el-form>
</template>

<script>
export default {
  name: 'Delay',
  props: ['nodeInfo', 'configurationDescriptor'],
  data () {
    const periodInSeconds = (rule, value, callback) => {
      if (Number(value) < 0) {
        callback(new Error('以秒为单位的最小时间间隔为0'))
      } else if (value === '' || value === undefined) {
        callback(new Error('以秒为单位的时间不能为空'))
      } else {
        callback()
      }
    }
    const maxPendingMsgs = (rule, value, callback) => {
      if (Number(value) < 0) {
        callback(new Error('最大待处理消息的范围应在1到100000之间'))
      } else if (value === '' || value === undefined) {
        callback(new Error('最大待处理消息数不能为空'))
      } else {
        callback()
      }
    }
    return {
      isTplType: false,
      form: {
        name: '',
        debugMode: '',
        useMetadataPeriodInSecondsPatterns: '',
        periodInSeconds: '',
        maxPendingMsgs: '',
        periodInSecondsPattern: '',
        description: ''
      },
      rules: {
        name: [{ required: true, message: '名称不能为空', trigger: 'change' }],
        periodInSeconds: [{ required: true, validator: periodInSeconds, trigger: 'change' }],
        maxPendingMsgs: [{ required: true, validator: maxPendingMsgs, trigger: 'change' }],
        periodInSecondsPattern: [{ required: true, message: '以秒为单位的元数据模式不能为空', trigger: 'change' }]
      }
    }
  },
  methods: {
    submit () {
      this.$refs.form.validate(valid => {
        if (!valid) return false
        this.$emit('submit', {
          debugMode: this.form.debugMode || false,
          name: this.form.name,
          configuration: {
            periodInSeconds: this.form.periodInSeconds,
            maxPendingMsgs: this.form.maxPendingMsgs,
            periodInSecondsPattern: this.form.periodInSecondsPattern,
            useMetadataPeriodInSecondsPatterns: this.form.useMetadataPeriodInSecondsPatterns
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
