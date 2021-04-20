<template>
  <div class="details-container">
    <div class="button-container">
      <wx-button type="warning" @click="openDashboard">打开应用库</wx-button>
      <wx-button type="warning" @click="remove">取消分配客户</wx-button>
    </div>
    <el-form ref="form" :model="form" :rules="rules">
      <el-form-item label="名称" prop="title">
        <el-input v-model="form.title"></el-input>
      </el-form-item>
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
export default {
  props: ['dashboardId', 'info'],
  data () {
    return {
      form: {
        title: '',
        description: ''
      },
      rules: {
        title: [{ required: true, message: '标题不能为空', trigger: 'change' }]
      }
    }
  },
  methods: {
    submit () {
      this.$refs.form.validate(async valid => {
        if (!valid) return false
        try {
          await this.$api.postDashboard({
            ...this.info,
            configuration: {
              ...this.info.configuration,
              description: this.form.description
            },
            title: this.form.title
          })
          this.$message.success('修改成功')
          this.$router.push({ path: `/customers/${this.$route.params.customerId}/dashboards/${this.dashboardId}/info?title=${this.form.title}` })
        } catch (error) {
          this.$message.error(error.response.data.message)
        }
      })
    },
    openDashboard () {
      this.$router.push({ path: `/customers/${this.$route.params.customerId}/dashboards/${this.info.id.id}/view`, query: { title: this.info.name } })
    },
    remove () {
      this.$confirm('确认后，面板将被取消分配，客户将无法访问', `您确定要取消分配应用库'${this.info.name}'吗?`, {
        confirmButtonText: '是',
        cancelButtonText: '否',
        type: 'warning'
      }).then(async _ => {
        try {
          await this.$api.deleteCustomerDashboard(this.$route.params.customerId, this.info.id.id)
          this.$message.success('操作成功')
          this.$router.push({ path: `/customers/${this.$route.params.customerId}/dashboards` })
        } catch (error) {
          this.$message.error(error.response.data.message)
        }
      }).catch(() => {})
    },
    init () {
      const { description } = this.info.configuration || {}
      this.form = {
        title: this.info.title,
        description
      }
    }
  },
  created () {
    this.init()
  }
}
</script>

<style lang="scss" scope>
  .app-container {
    height: 100%;
  }
</style>
