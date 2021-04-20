<template>
  <div class="details-container">
    <div class="button-container">
      <wx-button type="warning" @click="openWidgetsBundles">打开</wx-button>
      <wx-button type="warning" @click="exportWidgetsBundle">导出</wx-button>
      <wx-button v-if="!this.info.isSystem" type="warning" @click="remove">删除</wx-button>
    </div>
    <el-form ref="form" :model="form" :rules="rules" style="max-width: 955px;">
      <el-form-item label="标题" prop="title">
        <el-input v-model="form.title"></el-input>
      </el-form-item>
      <el-form-item>
        <wx-button v-if="!this.info.isSystem" type="primary" @click="submit">修改</wx-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import FileSaver from 'file-saver'
export default {
  props: ['id'],
  data () {
    return {
      info: {
        isSystem: true
      },
      form: {
        title: ''
      },
      rules: {
        title: [{ required: true, message: '标题不能为空', trigger: 'change' }]
      },
      sysId: this.$store.getters.userInfo.tenantId.id
    }
  },
  methods: {
    openWidgetsBundles () {
      this.$router.push({ path: `/widgets-bundles/${this.id}`, query: { title: this.info.title } })
    },
    submit () {
      try {
        this.$refs.form.validate(async valid => {
          if (!valid) return false
          await this.$api.postWidgetsBundle({
            ...this.info,
            ...this.form
          })
          this.$message.success('操作成功')
          this.$router.push({ path: `/widgets-bundles/${this.id}/details`, query: { title: this.form.title } })
        })
      } catch (error) {
        this.$message.error(error.response.data.message)
      }
    },
    async exportWidgetsBundle () {
      try {
        const result = await Promise.all([
          this.$api.getWidgetsBundleInfos(this.info.id.id),
          this.$api.getWidgetTypes({
            isSystem: this.info.isSystem,
            bundleAlias: this.info.alias
          })
        ])
        const { alias, title, image } = result[0].data
        const widgetTypes = (result[1].data || []).map(ele => {
          return {
            alias: ele.alias,
            name: ele.name,
            descriptor: ele.descriptor
          }
        })
        const data = JSON.stringify({
          widgetsBundle: {
            alias,
            title,
            image
          },
          widgetTypes
        }, null, 2)
        const blob = new Blob([data], { type: '' })
        FileSaver.saveAs(blob, `${title}.json`)
      } catch (error) {
        this.$message.error(error.response.data.message)
      }
    },
    remove () {
      this.$confirm('小心！确认后，部件包和所有相关数据将不可恢复。', `您确定要删除部件包 '${this.info.title}'吗？`, {
        confirmButtonText: '是',
        cancelButtonText: '否'
      }).then(async _ => {
        try {
          await this.$api.deleteWidgetsBundle(this.info.id.id)
          this.$message.success('操作成功')
          this.$router.push({ path: '/widgets-bundles' })
        } catch (error) {
          this.$message.error(error.response.data.message)
        }
      }).catch(() => {})
    },
    async init () {
      try {
        const { data } = await this.$api.getWidgetsBundleInfos(this.id)
        Object.assign(this.info, data, {
          isSystem: this.sysId !== data.tenantId.id
        })
        this.form.title = this.info.title
      } catch (error) {
        this.$message.error(error.response.data.message)
      }
    }
  },
  created () {
    this.init()
  }
}
</script>
