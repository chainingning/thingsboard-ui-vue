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
    <el-form-item label="设备关联查询"></el-form-item>
    <el-checkbox v-model="form.fetchLastLevelOnly">只匹配最后一层关联</el-checkbox>
    <el-form-item label="方向" prop="direction" class="direction">
      <el-select v-model="form.direction">
        <el-option label="从" value="FROM"></el-option>
        <el-option label="到" value="TO"></el-option>
      </el-select>
    </el-form-item>
    <el-form-item label="最大关联级别" prop="maxLevel">
      <el-input type="number" v-model="form.maxLevel" :min="1"></el-input>
    </el-form-item>
    <el-form-item label="关联类型" prop="relationType">
      <el-select
        v-model="form.relationType"
        filterable
        allow-create
        default-first-option>
        <el-option label="Contains" value="Contains"></el-option>
        <el-option label="Manages" value="Manages"></el-option>
      </el-select>
    </el-form-item>
    <el-form-item label="设备类型" prop="deviceTypes">
      <el-select
        v-model="form.deviceTypes"
        multiple
        filterable
        allow-create
        default-first-option>
        <el-option v-for="item in deviceTypeList" :key="item.type" :label="item.type" :value="item.type"></el-option>
      </el-select>
    </el-form-item>
    <el-checkbox v-model="form.tellFailureIfAbsent">告诉失败</el-checkbox>
    <div class="desc">如果至少有一个选定的键不存在，出站消息将报告“失败”。</div>
    <el-form-item label="客户属性" prop="clientAttributeNames">
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
    <el-form-item label="共享属性" prop="sharedAttributeNames">
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
    <el-checkbox v-model="form.getLatestValueWithTs"></el-checkbox>
    <el-form-item label="描述" prop="description">
      <el-input type="textarea" autosize v-model="form.description"></el-input>
    </el-form-item>
  </el-form>
</template>

<script>
export default {
  name: 'RelatedDeviceAttributes',
  props: ['nodeInfo', 'configurationDescriptor'],
  data () {
    return {
      isTplType: false,
      form: {
        name: '',
        debugMode: '',
        fetchLastLevelOnly: false,
        direction: '',
        maxLevel: '',
        relationType: [],
        deviceTypes: [],
        tellFailureIfAbsent: false,
        clientAttributeNames: [],
        sharedAttributeNames: [],
        serverAttributeNames: [],
        latestTsKeyNames: [],
        getLatestValueWithTs: false,
        description: ''
      },
      rules: {
        name: [{ required: true, message: '名称不能为空', trigger: 'change' }],
        direction: [{ required: true, message: '方向不能为空', trigger: 'change' }],
        deviceTypes: [{ required: true, message: '设备类型不能为空', trigger: 'change' }]
      },
      options: [],
      deviceTypeList: []
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
            deviceRelationsQuery: {
              deviceRelationsQuery: this.form.deviceRelationsQuery,
              direction: this.form.direction,
              maxLevel: this.form.maxLevel,
              relationType: this.form.relationType,
              deviceTypes: this.form.deviceTypes,
              fetchLastLevelOnly: this.form.fetchLastLevelOnly
            },
            tellFailureIfAbsent: this.form.tellFailureIfAbsent || false,
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
    async getDeviceTypes () {
      const res = await this.$api.getDeviceTypes()
      this.deviceTypeList = res.data
    },
    init () {
      const { ...defaultConfiguration } = this.configurationDescriptor.nodeDefinition.defaultConfiguration
      const { ...configuration } = this.nodeInfo.configuration || {}
      const { name, debugMode } = this.nodeInfo
      const { description } = this.nodeInfo.additionalInfo || {}
      Object.assign(configuration, {
        name,
        debugMode,
        description,
        ...configuration.deviceRelationsQuery
      })
      Object.assign(defaultConfiguration, {
        ...defaultConfiguration.deviceRelationsQuery
      })
      const attrMapping = []
      const forConfiguration = this.isTplType ? defaultConfiguration : configuration
      for (const key in forConfiguration.attrMapping) {
        attrMapping.push({
          source: key,
          target: forConfiguration.attrMapping[key]
        })
      }
      forConfiguration.attrMapping = attrMapping
      for (const key in this.form) {
        this.form[key] = this.isTplType ? defaultConfiguration[key] : configuration[key]
      }
    }
  },
  created () {
    this.isTplType = Object.is(JSON.stringify(this.nodeInfo), '{}')
    this.init()
    this.getDeviceTypes()
  }
}
</script>

<style lang="scss" scoped>
  .desc {
    font-size: 12px;
    color: #808080;
  }
</style>
