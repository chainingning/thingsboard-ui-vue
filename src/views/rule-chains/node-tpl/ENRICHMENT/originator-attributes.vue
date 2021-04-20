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
    <el-form-item prop="tellFailureIfAbsent">
      <el-checkbox v-model="form.tellFailureIfAbsent">返回失败</el-checkbox>
    </el-form-item>
    <span class="desc">如果至少有一个选定的密钥不存在,则出站消息将返回" 失败 "</span>
    <el-form-item label="客户端属性" prop="clientAttributeNames">
      <el-select
        v-model="form.clientAttributeNames"
        multiple
        filterable
        allow-create
        default-first-option>
        <el-option
          v-for="item in options"
          :key="item.value"
          :label="item.label"
          :value="item.value">
        </el-option>
      </el-select>
    </el-form-item>
    <el-form-item label="共享的属性" prop="sharedAttributeNames">
      <el-select
        v-model="form.sharedAttributeNames"
        multiple
        filterable
        allow-create
        default-first-option>
        <el-option
          v-for="item in options"
          :key="item.value"
          :label="item.label"
          :value="item.value">
        </el-option>
      </el-select>
    </el-form-item>
    <el-form-item label="服务器属性" prop="serverAttributeNames">
      <el-select
        v-model="form.serverAttributeNames"
        multiple
        filterable
        allow-create
        default-first-option>
        <el-option
          v-for="item in options"
          :key="item.value"
          :label="item.label"
          :value="item.value">
        </el-option>
      </el-select>
    </el-form-item>
    <el-form-item label="最新时间序列" prop="latestTsKeyNames">
      <el-select
        v-model="form.latestTsKeyNames"
        multiple
        filterable
        allow-create
        default-first-option>
        <el-option
          v-for="item in options"
          :key="item.value"
          :label="item.label"
          :value="item.value">
        </el-option>
      </el-select>
    </el-form-item>
    <el-form-item prop="getLatestValueWithTs">
      <el-checkbox v-model="form.getLatestValueWithTs">使用时间戳获取最新遥测</el-checkbox>
    </el-form-item>
    <span class="desc">如果选中,最新的遥测值将被添加到带有时间戳的出站消息元数据中,例如: "temp": "{\"ts\":1574329385897,\"value\":42}"</span>
    <el-form-item label="描述" prop="description">
      <el-input type="textarea" autosize v-model="form.description"></el-input>
    </el-form-item>
  </el-form>
</template>

<script>
export default {
  name: 'OriginatorAttributes',
  props: ['nodeInfo', 'configurationDescriptor'],
  data () {
    return {
      form: {
        name: '',
        debugMode: '',
        tellFailureIfAbsent: '',
        clientAttributeNames: [],
        sharedAttributeNames: [],
        serverAttributeNames: [],
        latestTsKeyNames: [],
        getLatestValueWithTs: '',
        description: ''
      },
      rules: {
        name: [{ required: true, message: '名称不能为空', trigger: 'change' }]
      },
      options: []
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
            tellFailureIfAbsent: this.form.tellFailureIfAbsent,
            clientAttributeNames: this.form.clientAttributeNames,
            sharedAttributeNames: this.form.sharedAttributeNames,
            serverAttributeNames: this.form.serverAttributeNames,
            latestTsKeyNames: this.form.latestTsKeyNames,
            getLatestValueWithTs: this.form.getLatestValueWithTs
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
