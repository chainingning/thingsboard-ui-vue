<template>
  <div class="details-container">
    <div class="button-container">
      <wx-button type="warning" @click="remove">取消分配客户</wx-button>
    </div>
    <el-form ref="form" :model="form" :rules="rules">
      <el-form-item label="名称" prop="name">
        <el-input v-model="form.name"></el-input>
      </el-form-item>
      <el-form-item label="资产类型" prop="type">
        <el-select v-model="form.type">
          <el-option v-for="item in assetTypeList" :key="item.type" :label="item.type" :value="item.type"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="标签" prop="label">
        <el-input v-model="form.label"></el-input>
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
  props: ['assetId', 'info'],
  data () {
    return {
      form: {
        name: '',
        type: '',
        label: '',
        description: ''
      },
      rules: {
        name: [{ required: true, message: '名称不能为空', trigger: 'change' }],
        type: [{ required: true, message: '资产类型不能为空', trigger: 'change' }]
      },
      assetTypeList: []
    }
  },
  methods: {
    submit () {
      this.$refs.form.validate(async valid => {
        if (!valid) return false
        const params = {
          ...this.info,
          ...this.form,
          additionalInfo: {
            description: this.form.description
          }
        }
        delete params.description
        try {
          await this.$api.postAsset(params)
          this.$message.success('修改成功')
          this.$router.push({ path: `/customers/${this.$route.params.customerId}/assets/${this.assetId}?title=${this.form.name}` })
        } catch (error) {
          this.$message.error(error.response.data.message)
        }
      })
    },
    remove () {
      this.$confirm('确认后，资产将未分配，客户无法访问', `您确定要取消对'${this.info.name}'资产的分配吗?`, {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async _ => {
        const result = await this.$api.deleteCustomerAsset(this.info.id.id)
        if (result.status === 200) {
          this.$message.success('操作成功')
          this.$router.push({ path: `/customers/${this.$route.params.customerId}/assets` })
        }
      }).catch(() => {})
    },
    async getAssetTypes () {
      try {
        const result = await this.$api.getAssetTypes()
        this.assetTypeList = result.data
      } catch (error) {}
    },
    init () {
      const { description } = this.info.additionalInfo || {}
      for (const key in this.form) {
        this.form[key] = key === 'description' ? description : this.info[key]
      }
    }
  },
  async created () {
    await this.getAssetTypes()
    this.init()
  }
}
</script>
