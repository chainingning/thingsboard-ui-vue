<template>
  <div class="details-container">
    <div class="button-container">
      <wx-button v-if="!(info.additionalInfo && info.additionalInfo.isPublic)" type="warning" size="mini" @click="jumpRouter()">管理设备管理员</wx-button>
      <wx-button v-if="!(info.additionalInfo && info.additionalInfo.isPublic)" type="warning" @click="del">删除设备管理员</wx-button>
    </div>
    <el-form ref="form" :model="form" :rules="formRules" v-if="!(info.additionalInfo && info.additionalInfo.isPublic)">
      <el-form-item label="标题" prop="title">
        <el-input v-model="form.title"></el-input>
      </el-form-item>
      <el-form-item label="描述" prop="description">
        <el-input type="textarea" autosize v-model="form.description"></el-input>
      </el-form-item>
      <el-form-item label="国家" prop="country">
        <el-input v-model="form.country"></el-input>
      </el-form-item>
      <div style="display: flex;">
        <el-form-item label="省" prop="province">
          <el-input v-model="form.province"></el-input>
        </el-form-item>
        <el-form-item label="市" style="margin: 0 10px;" prop="city">
          <el-input v-model="form.city"></el-input>
        </el-form-item>
        <el-form-item label="邮政编码" prop="zip">
          <el-input v-model="form.zip"></el-input>
        </el-form-item>
      </div>
      <el-form-item label="地址" prop="address">
        <el-input v-model="form.address"></el-input>
      </el-form-item>
      <el-form-item label="地址2" prop="address2">
        <el-input v-model="form.address2"></el-input>
      </el-form-item>
      <el-form-item label="手机" prop="phone">
        <el-input v-model="form.phone"></el-input>
      </el-form-item>
      <el-form-item label="邮箱" prop="email">
        <el-input v-model="form.email"></el-input>
      </el-form-item>
      <el-form-item>
        <wx-button type="primary" @click="submit">修改</wx-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
export default {
  props: ['tenantId', 'info'],
  data () {
    return {
      form: {
        title: '',
        description: '',
        country: '',
        city: '',
        state: '',
        zip: '',
        address: '',
        address2: '',
        phone: '',
        email: '',
        province: ''
      },
      formRules: {
        title: [{ required: true, message: '标题不能为空' }],
        email: [
          { message: '请输入邮箱地址', trigger: 'change' },
          { type: 'email', message: '请输入正确的邮箱地址', trigger: 'change' }
        ]
      }
    }
  },
  methods: {
    del () {
      this.$confirm('小心！确认后,用户及其所有相关数据将不可恢复', `确定要删除设备管理员'${this.info.name}'吗?`, {
        confirmButtonText: '是',
        cancelButtonText: '否'
      }).then(async _ => {
        await this.$api.deleteTenants(this.info.id.id)
        this.$message.success('删除成功')
        this.$router.push({ path: '/tenants' })
      }).catch(() => {})
    },
    jumpRouter () {
      this.$router.push({ path: `/tenants/${this.info.id.id}/admins` })
    },
    submit () {
      this.$refs.form.validate(async valid => {
        if (!valid) return false
        const params = Object.assign({}, {
          ...this.info,
          ...this.form,
          additionalInfo: { description: this.form.description }
        })
        delete params.description
        await this.$api.postTenants(params)
        this.$message.success('修改成功')
        this.$router.push({ path: `/tenants/${this.tenantId}`, query: { title: this.form.title } })
      })
    },
    init () {
      for (const key in this.form) {
        this.form[key] = key === 'description' ? this.info.additionalInfo.description : this.info[key]
      }
    }
  },
  created () {
    this.init()
  }
}
</script>
