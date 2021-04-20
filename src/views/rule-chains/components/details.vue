<template>
  <div class="details-container">
    <div class="button-container">
      <wx-button type="warning" @click="openRuleChain">打开规则链</wx-button>
      <wx-button type="warning" @click="exportRuleChain">导出规则</wx-button>
      <wx-button type="warning" v-if="!this.info.root" @click="openMessageBox('delete')">删除规则</wx-button>
      <wx-button type="warning" @click="copy">复制规则链ID</wx-button>
      <wx-button type="warning" v-if="!this.info.root" @click="openMessageBox('root')">创建规则链根</wx-button>
    </div>
    <el-form ref="form" :model="form" :rules="rules">
      <el-form-item label="名称" prop="name">
        <el-input v-model="form.name"></el-input>
      </el-form-item>
      <!-- <el-form-item prop="debugMode">
        <el-checkbox v-model="form.debugMode">调试模式</el-checkbox>
      </el-form-item> -->
      <el-form-item label="描述" prop="description">
        <el-input type="textarea" autosize v-model="form.description"></el-input>
      </el-form-item>
      <el-form-item>
        <wx-button type="primary" @click="submit">修改</wx-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import FileSaver from 'file-saver'
export default {
  props: ['id', 'info'],
  data () {
    return {
      form: {
        name: '',
        // debugMode: false,
        description: ''
      },
      rules: {
        name: [{ required: true, message: '名称不能为空', trigger: 'change' }]
      }
    }
  },
  methods: {
    openRuleChain () {
      this.$router.push({ path: `/rule-chains/${this.id}`, query: { title: this.info.name } })
    },
    async exportRuleChain () {
      try {
        const result = await Promise.all([
          this.$api.getRuleChainsInfo(this.id),
          this.$api.getRuleChainMetadata(this.id)
        ])
        const { additionalInfo, name, firstRuleNodeId, root, debugMode, configuration } = result[0].data
        const { firstNodeIndex, nodes, connections, ruleChainConnections } = result[1].data
        const data = JSON.stringify({
          ruleChain: { additionalInfo, name, firstRuleNodeId, root, debugMode, configuration },
          metadata: {
            firstNodeIndex,
            nodes: (nodes || []).map(ele => {
              delete ele.createdTime
              delete ele.id
              delete ele.ruleChainId
              return ele
            }),
            connections,
            ruleChainConnections
          }
        }, null, 2)
        const blob = new Blob([data], { type: '' })
        FileSaver.saveAs(blob, `${this.info.name}.json`)
      } catch (error) {
        this.$message.error(error.response.data.message)
      }
    },
    openMessageBox (type) {
      const title = {
        delete: `确定要删除规则链'${this.info.name}'吗?`,
        root: '确定要生成规则链根吗?'
      }
      const message = {
        delete: '小心,确认后,规则链和所有相关数据将变得不可恢复',
        root: '确认之后,规则链将变为根规格链,并将处理所有传入的传输消息'
      }
      this.$confirm(message[type], title[type], {
        confirmButtonText: '是',
        cancelButtonText: '否',
        type: 'warning'
      }).then(async _ => {
        try {
          switch (type) {
            case 'delete':
              await this.$api.deleteRuleChains(this.id)
              break
            case 'root':
              await this.$api.createRuleChainsRoot(this.id)
              break
            default:
              break
          }
          if (type === 'delete') {
            this.$router.push({ path: '/rule-chains' })
          } else {
            this.init()
            this.$emit('submit')
          }
          this.$message.success('操作成功')
        } catch (error) {
          this.$message.error(error.response.data.message)
        }
      }).catch(() => {})
    },
    copy () {
      const input = document.createElement('input')
      input.value = this.id
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      this.$message.success('规则链ID复制成功')
    },
    submit () {
      this.$refs.form.validate(async valid => {
        if (!valid) return false
        const params = {
          ...this.info,
          name: this.form.name,
          // debugMode: this.form.debugMode || false,
          additionalInfo: {
            ...this.info.additionalInfo,
            description: this.form.description
          }
        }
        try {
          await this.$api.postRuleChain(params)
          this.$message.success('修改成功')
          this.$router.push(`/rule-chains/${this.id}/details?title=${this.form.name}`)
        } catch (error) {
          this.$message.error(error.response.data.message)
        }
      })
    },
    init () {
      const { name } = this.info || {}
      const { description } = this.info.additionalInfo || {}
      this.form = {
        name,
        description
      }
    }
  },
  created () {
    this.init()
  },
  watch: {
    info: {
      deep: true,
      handler () {
        this.init()
      }
    }
  }
}
</script>
