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
    <el-form-item label="选择实体详细信息" prop="detailsList">
      <el-select
        v-model="form.detailsList"
        multiple
        filterable
        default-first-option>
        <el-option
          v-for="item in options"
          :key="item.value"
          :label="item.label"
          :value="item.value">
        </el-option>
      </el-select>
    </el-form-item>
    <el-form-item prop="addToMetadata">
      <el-checkbox v-model="form.addToMetadata">将选定的详细信息添加到消息元数据</el-checkbox>
    </el-form-item>
    <span class="desc">如果选中,则将所选的详细信息键添加到消息元数据而不是消息数据中</span>
    <el-form-item label="描述" prop="description">
      <el-input type="textarea" autosize v-model="form.description"></el-input>
    </el-form-item>
  </el-form>
</template>

<script>
export default {
  name: 'TenantDetails',
  props: ['nodeInfo', 'configurationDescriptor'],
  data () {
    return {
      isTplType: false,
      form: {
        name: '',
        debugMode: '',
        detailsList: [],
        addToMetadata: false,
        description: ''
      },
      rules: {
        name: [{ required: true, message: '名称不能为空', trigger: 'change' }]
      },
      options: [
        { label: '标题', value: 'TITLE' },
        { label: '国家', value: 'COUNTRY' },
        { label: '省', value: 'PROVINCE' },
        { label: '城市', value: 'CITY' },
        { label: '邮编', value: 'ZIP' },
        { label: '地址', value: 'ADDRESS' },
        { label: '地址2', value: 'ADDRESS2' },
        { label: '电话', value: 'PHONE' },
        { label: '电子邮件', value: 'EMAIL' },
        { label: '其他信息', value: 'ADDITIONAL_INFO' }
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
            detailsList: this.form.detailsList,
            addToMetadata: this.form.addToMetadata
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
  .desc {
    font-size: 12px;
    color: #808080;
  }
</style>
