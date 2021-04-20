<template>
  <el-form ref="form" :model="form" :rules="rules">
    <el-form-item label="规则链" prop="name">
      <el-select v-model="form.name" clearable filterable>
        <el-option v-for="item in ruleChainList" :key="item.id.id" :label="item.name" :value="item.id.id"></el-option>
      </el-select>
    </el-form-item>
    <el-form-item label="描述" prop="description">
      <el-input type="textarea" autosize v-model="form.description"></el-input>
    </el-form-item>
  </el-form>
</template>

<script>
export default {
  name: 'RuleChain',
  props: ['nodeInfo', 'configurationDescriptor'],
  data () {
    return {
      isTplType: false,
      form: {
        name: '',
        description: ''
      },
      rules: {
        name: [{ required: true, message: '规则链不能为空', trigger: 'change' }]
      },
      ruleChainList: []
    }
  },
  methods: {
    submit () {
      this.$refs.form.validate(valid => {
        if (!valid) return false
        const info = this.ruleChainList.find(item => item.id.id === this.form.name)
        if (!info) {
          this.$message.error('请选择正确的目标节点')
          return
        }
        this.$emit('submit', {
          name: info.name,
          targetRuleChainId: {
            entityType: 'RULE_CHAIN',
            id: this.form.name
          },
          additionalInfo: {
            description: this.form.description
          },
          tplType: this.isTplType ? 'add' : 'edit',
          nodeType: 'RULE_CHAIN'
        })
      })
    },
    async getRuleChains () {
      const res = await this.$api.getRuleChainsList({
        pageSize: 50,
        page: 0,
        sortProperty: name,
        sortOrder: 'ASC'
      })
      this.ruleChainList = res.data.data
    },
    async init () {
      const { description } = this.nodeInfo.additionalInfo || {}
      this.form = {
        name: this.isTplType ? '' : this.nodeInfo.targetRuleChainId.id,
        description: this.isTplType ? '' : description
      }
    }
  },
  async created () {
    this.isTplType = Object.is(JSON.stringify(this.nodeInfo), '{}')
    await this.getRuleChains()
    this.init()
  }
}
</script>
