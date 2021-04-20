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
    <el-form-item label="每日定时时间" prop="hour">
      <el-select v-model="form.hour">
        <el-option v-for="(item, key) in 23" :key="key" :value="item" :label="item"></el-option>
      </el-select>
    </el-form-item>
    <el-form-item label="清除事件类型" prop="eventType">
      <el-select v-model="form.eventType" @change="handlerEventType">
        <el-option label="DEBUG_RULE_NODE" value="DEBUG_RULE_NODE"></el-option>
        <el-option label="LC_EVENT" value="LC_EVENT"></el-option>
        <el-option label="STATS" value="STATS"></el-option>
      </el-select>
    </el-form-item>
    <el-form-item v-if="form.eventType === 'DEBUG_RULE_NODE'">
      <el-checkbox v-model="form.selectNodes">是否选择规则节点</el-checkbox>
    </el-form-item>
    <template v-if="form.selectNodes">
      <el-form-item label="规则链" prop="ruleChain">
        <el-select
          v-model="form.ruleChain"
          filterable
          clearable
          @change="form.debugNodes = ''">
          <el-option
            v-for="item in ruleChainList"
            :key="item.id.id"
            :label="item.name"
            :value="item.id.id"
            ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="规则链节点" prop="debugNodes">
        <el-select
          v-model="form.debugNodes"
          filterable
          clearable
          @focus="getRuleChainNodeList(form.ruleChain)">
          <el-option
            v-for="item in ruleChainNodeList"
            :key="item.id.id"
            :label="item.name"
            :value="item.id.id"
            ></el-option>
        </el-select>
      </el-form-item>
    </template>
    <el-form-item label="清除N天前时间" prop="clearStartDays">
      <el-input type="number" :min="0" v-model="form.clearStartDays"></el-input>
    </el-form-item>
    <el-form-item label="描述" prop="description">
      <el-input type="textarea" autosize v-model="form.description"></el-input>
    </el-form-item>
  </el-form>
</template>

<script>
export default {
  name: 'ClearEvent',
  props: ['nodeInfo', 'configurationDescriptor'],
  data () {
    return {
      isTplType: false,
      form: {
        name: '',
        debugMode: '',
        hour: '',
        eventType: '',
        clearStartDays: '',
        description: '',
        selectNodes: '',
        debugNodes: '',
        ruleChain: ''
      },
      rules: {
        name: [{ required: true, message: '名称不能为空', trigger: 'change' }],
        hour: [{ required: true, message: '每日定时时间不能为空', trigger: 'change' }],
        eventType: [{ required: true, message: '清除事件类型不能为空', trigger: 'change' }],
        clearStartDays: [{ required: true, message: '清除前N天时间不能为空', trigger: 'change' }],
        debugNodes: [{ required: true, message: '规则链节点不能为空', trigger: 'change' }],
        ruleChain: [{ required: true, message: '规则链不能为空', trigger: 'change' }]
      },
      ruleChainList: [],
      ruleChainNodeList: []
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
            hour: this.form.hour,
            eventType: this.form.eventType,
            clearStartDays: this.form.clearStartDays,
            selectNodes: this.form.selectNodes,
            debugNodes: this.form.debugNodes,
            ruleChain: this.form.ruleChain
          },
          additionalInfo: {
            description: this.form.description
          },
          tplType: this.isTplType ? 'add' : 'edit'
        })
      })
    },
    handlerEventType (value) {
      if (value !== 'DEBUG_RULE_NODE') {
        this.form.selectNodes = false
      }
    },
    async getRuleChainList () {
      const params = {
        page: 0,
        pageSize: 1000,
        sortProperty: 'createdTime',
        sortOrder: 'DESC'
      }
      const result = await this.$api.getRuleChainsList(params)
      this.ruleChainList = result.data.data
    },
    async getRuleChainNodeList (id) {
      console.log(id)
      if (!id) return
      const result = await this.$api.getRuleChainMetadata(id)
      this.ruleChainNodeList = result.data.nodes
    },
    init () {
      const { defaultConfiguration } = this.configurationDescriptor.nodeDefinition
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
    this.getRuleChainList()
    this.getRuleChainNodeList(this.form.ruleChain)
  }
}
</script>
