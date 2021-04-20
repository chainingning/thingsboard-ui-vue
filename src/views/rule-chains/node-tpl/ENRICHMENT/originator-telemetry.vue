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
    <el-form-item label="读取模式" prop="fetchMode">
      <el-select v-model="form.fetchMode">
        <el-option label="起始" value="FIRST"></el-option>
        <el-option label="最后" value="LAST"></el-option>
        <el-option label="全部" value="ALL"></el-option>
      </el-select>
      <span class="desc">如果提取模式选择了'ALL'，则可以选择遥测采样顺序</span>
    </el-form-item>
    <template v-if="form.fetchMode === 'ALL'">
      <el-form-item label="排序" prop="orderBy">
        <el-select v-model="form.orderBy">
          <el-option label="升序" value="ASC"></el-option>
          <el-option label="降序" value="DESC"></el-option>
        </el-select>
        <span class="desc">选择以选择遥测采样顺序</span>
      </el-form-item>
      <el-form-item label="限制" prop="limit">
        <el-input v-model="form.limit"></el-input>
        <span class="desc">最小限制值为2,最大-1000如果要获取单个条目,请选择获取模式'FIRST'或'LAST'</span>
      </el-form-item>
    </template>
    <el-form-item prop="useMetadataIntervalPatterns">
      <el-checkbox v-model="form.useMetadataIntervalPatterns">使用元数据中的分隔格式</el-checkbox>
      <div class="desc">如果选中,规则节点将使用消息元数据中的开始和结束分隔格式（假设间隔以毫秒为单位）</div>
    </el-form-item>
    <template v-if="!form.useMetadataIntervalPatterns">
      <el-form-item label="开始间隔" prop="startInterval">
        <el-input type="number" v-model="form.startInterval"></el-input>
      </el-form-item>
      <el-form-item label="开始间隔时间单位" prop="startIntervalTimeUnit">
        <el-select v-model="form.startIntervalTimeUnit">
          <el-option label="毫秒" value="MILLISECONDS"></el-option>
          <el-option label="秒" value="SECONDS"></el-option>
          <el-option label="分钟" value="MINUTES"></el-option>
          <el-option label="小时" value="HOURS"></el-option>
          <el-option label="天" value="DAYS"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="结束间隔" prop="endInterval">
        <el-input type="number" v-model="form.endInterval"></el-input>
      </el-form-item>
      <el-form-item label="结束间隔时间单位" prop="endIntervalTimeUnit">
        <el-select v-model="form.endIntervalTimeUnit">
          <el-option label="毫秒" value="MILLISECONDS"></el-option>
          <el-option label="秒" value="SECONDS"></el-option>
          <el-option label="分钟" value="MINUTES"></el-option>
          <el-option label="小时" value="HOURS"></el-option>
          <el-option label="天" value="DAYS"></el-option>
        </el-select>
      </el-form-item>
    </template>
    <template v-else>
      <el-form-item label="开始间隔模式" prop="startIntervalPattern">
        <el-input v-model="form.startIntervalPattern"></el-input>
        <span class="desc">开始间隔模式,使用 $ {metaKeyName} 替换元数据中的变量</span>
      </el-form-item>
      <el-form-item label="结束间隔模式" prop="endIntervalPattern">
        <el-input v-model="form.endIntervalPattern"></el-input>
        <span class="desc">结束间隔模式,使用 $ {metaKeyName} 替换元数据中的变量</span>
      </el-form-item>
    </template>
    <el-form-item label="描述" prop="description">
      <el-input type="textarea" autosize v-model="form.description"></el-input>
    </el-form-item>
  </el-form>
</template>

<script>
export default {
  name: 'OriginatorTelemetry',
  props: ['nodeInfo', 'configurationDescriptor'],
  data () {
    const limit = (rule, value, callback) => {
      if (value === undefined || value === '') {
        callback(new Error('限制不能为空'))
      } else if (value >= 2 && value <= 1000) {
        callback()
      } else {
        callback(new Error('最小限制为2,最大限制为1000'))
      }
    }
    return {
      form: {
        name: '',
        debugMode: '',
        latestTsKeyNames: [],
        fetchMode: '',
        startIntervalPattern: '',
        endIntervalPattern: '',
        description: '',
        orderBy: '',
        limit: '',
        startInterval: '',
        startIntervalTimeUnit: '',
        endInterval: '',
        endIntervalTimeUnit: ''
      },
      rules: {
        name: [{ required: true, message: '名称不能为空', trigger: 'change' }],
        fetchMode: [{ required: true, message: '读取模式不能为空', trigger: 'change' }],
        startIntervalPattern: [{ required: true, message: '开始间隔模式不能为空', trigger: 'change' }],
        endIntervalPattern: [{ required: true, message: '结束间隔模式不能为空', trigger: 'change' }],
        orderBy: [{ required: true, message: '排序不能为空', trigger: 'change' }],
        limit: [{ required: true, validator: limit, trigger: 'change' }],
        startInterval: [{ required: true, message: '开始间隔不能为空', trigger: 'change' }],
        startIntervalTimeUnit: [{ required: true, message: '开始间隔时间单位不能为空', trigger: 'change' }],
        endInterval: [{ required: true, message: '结束间隔不能为空', trigger: 'change' }],
        endIntervalTimeUnit: [{ required: true, message: '结束间隔时间不能为空', trigger: 'change' }]
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
            latestTsKeyNames: this.form.latestTsKeyNames,
            fetchMode: this.form.fetchMode,
            startIntervalPattern: this.form.startIntervalPattern,
            endIntervalPattern: this.form.endIntervalPattern,
            orderBy: this.form.orderBy,
            limit: this.form.limit,
            startInterval: this.form.startInterval,
            startIntervalTimeUnit: this.form.startIntervalTimeUnit,
            endInterval: this.form.endInterval,
            endIntervalTimeUnit: this.form.endIntervalTimeUnit,
            useMetadataIntervalPatterns: this.form.useMetadataIntervalPatterns
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
