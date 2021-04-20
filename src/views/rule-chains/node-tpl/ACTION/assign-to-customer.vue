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
    <el-form-item label="客户名称模式" prop="customerNamePattern">
      <el-input v-model="form.customerNamePattern"></el-input>
      <span>客户名称模式,使用 ${metaKeyName} 替换元数据中的变量</span>
    </el-form-item>
    <el-checkbox v-model="form.createCustomerIfNotExists">如果不存在则创建新客户</el-checkbox>
    <el-form-item label="客户缓存过期时间(秒)" prop="customerCacheExpiration">
      <el-input type="number" :min="0" v-model="form.customerCacheExpiration"></el-input>
      <span>客户名称模式,使用 ${metaKeyName} 替换元数据中的变量</span>
    </el-form-item>
    <el-form-item label="描述" prop="description">
      <el-input type="textarea" autosize v-model="form.description"></el-input>
    </el-form-item>
  </el-form>
</template>

<script>
export default {
  name: 'AssignToCustomer',
  props: ['nodeInfo', 'configurationDescriptor'],
  data () {
    const customerCacheExpiration = (rule, value, callback) => {
      if (Number(value) < 0) {
        callback(new Error('客户缓存过期时间应大于或等于0'))
      } else if (value === '' || value === undefined) {
        callback(new Error('客户缓存过期时间不能为空'))
      } else {
        callback()
      }
    }
    return {
      isTplType: false,
      form: {
        name: '',
        debugMode: '',
        description: '',
        customerNamePattern: '',
        customerCacheExpiration: '',
        createCustomerIfNotExists: ''
      },
      rules: {
        name: [{ required: true, message: '名称不能为空', trigger: 'change' }],
        customerNamePattern: [{ required: true, message: '客户名称模式不能为空', trigger: 'change' }],
        customerCacheExpiration: [{ required: true, validator: customerCacheExpiration, trigger: 'change' }]
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
            customerNamePattern: this.form.customerNamePattern,
            customerCacheExpiration: this.form.customerCacheExpiration,
            createCustomerIfNotExists: this.form.createCustomerIfNotExists
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
