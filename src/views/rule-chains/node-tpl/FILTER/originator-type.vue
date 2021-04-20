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
    <el-form-item label="消息源类型过滤器" prop="originatorTypes">
      <el-select
        v-model="form.originatorTypes"
        multiple
        filterable
        default-first-option
        placeholder="消息源类型">
        <el-option
          v-for="item in options"
          :key="item.value"
          :label="item.label"
          :value="item.value">
        </el-option>
      </el-select>
    </el-form-item>
    <el-form-item label="描述" prop="description">
      <el-input type="textarea" autosize v-model="form.description"></el-input>
    </el-form-item>
  </el-form>
</template>

<script>
export default {
  name: 'OriginatorType',
  props: ['nodeInfo', 'configurationDescriptor'],
  data () {
    return {
      isTplType: false,
      form: {
        name: '',
        debugMode: '',
        originatorTypes: [],
        description: ''
      },
      rules: {
        name: [{ required: true, message: '名称不能为空', trigger: 'change' }],
        originatorTypes: [{ required: true, message: '消息源类型过滤器不能为空', trigger: 'change' }]
      },
      options: [
        { label: '设备', value: 'DEVICE' },
        { label: '资产', value: 'ASSET' },
        { label: '实体视图', value: 'ENTITY_VIEW' },
        { label: '租户', value: 'TENANT' },
        { label: '客户', value: 'CUSTOMER' },
        { label: '用户', value: 'USER' },
        { label: '应用库', value: 'DASHBOARD' },
        { label: '规则链', value: 'RULE_CHAIN' },
        { label: 'Rule node', value: 'RULE_NODE' }
      ]
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
            originatorTypes: this.form.originatorTypes
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
