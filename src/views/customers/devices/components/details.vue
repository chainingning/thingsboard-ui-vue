<template>
  <div class="details-container">
    <div class="button-container">
      <wx-button type="warning" @click="remove">取消分配客户</wx-button>
      <wx-button type="warning" @click="openDialog">管理凭据</wx-button>
    </div>
    <el-form ref="deviceForm" :model="deviceForm" :rules="deviceRules">
      <el-form-item label="名称" prop="name">
        <el-input v-model="deviceForm.name"></el-input>
      </el-form-item>
      <el-form-item label="设备类型" prop="type">
        <el-select v-model="deviceForm.type">
          <el-option v-for="item in DeviceTypeList" :key="item.type" :label="item.type" :value="item.type"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="标签" prop="label">
        <el-input v-model="deviceForm.label"></el-input>
      </el-form-item>
      <el-form-item prop="gateway">
        <el-checkbox v-model="deviceForm.gateway">是网关</el-checkbox>
      </el-form-item>
      <el-form-item label="描述" prop="description">
        <el-input type="textarea" autosize v-model="deviceForm.description"></el-input>
      </el-form-item>
      <el-form-item>
        <wx-button type="primary" @click="save">修改</wx-button>
      </el-form-item>
    </el-form>
    <icloud-dialog
      :visible.sync="visible"
      title="设备凭据">
      <el-form ref="form" :model="form" :rules="formRules">
        <el-form-item label="凭据类型" prop="credentialsType">
          <el-select v-model="form.credentialsType">
            <el-option label="Access token" value="ACCESS_TOKEN"></el-option>
            <el-option label="X.509 Certificate" value="X509_CERTIFICATE"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="RSA公钥" :prop="form.credentialsType === 'ACCESS_TOKEN' ? 'credentialsId' : 'credentialsValue'">
          <el-input v-model="form[form.credentialsType === 'ACCESS_TOKEN' ? 'credentialsId' : 'credentialsValue']"></el-input>
        </el-form-item>
      </el-form>
      <div class="icloud-dialog-footer" slot="footer">
        <wx-button type="primary" @click="submit">确定</wx-button>
        <wx-button @click="visible = false">取消</wx-button>
      </div>
    </icloud-dialog>
  </div>
</template>

<script>
export default {
  props: ['deviceId', 'info'],
  data () {
    return {
      visible: false,
      deviceForm: {
        name: '',
        type: '',
        label: '',
        gateway: '',
        description: ''
      },
      deviceRules: {
        name: [{ required: true, message: '名称不能为空', trigger: 'change' }],
        type: [{ required: true, message: '设备类型不能为空', trigger: 'change' }]
      },
      DeviceTypeList: [],
      credentialsInfo: {},
      form: {
        credentialsType: '',
        credentialsId: '',
        credentialsValue: ''
      },
      formRules: {
        credentialsId: [{ required: true, message: '访问令牌不能为空', trigger: 'change' }],
        credentialsValue: [{ required: true, message: '访问令牌不能为空', trigger: 'change' }]
      }
    }
  },
  methods: {
    save () {
      this.$refs.deviceForm.validate(async valid => {
        if (!valid) return false
        const params = {
          ...this.info,
          ...this.deviceForm,
          additionalInfo: {
            ...this.info.additionalInfo,
            gateway: this.deviceForm.gateway,
            description: this.deviceForm.description
          }
        }
        delete params.gateway
        delete params.description
        try {
          await this.$api.postDevice(params)
          this.$message.success('修改成功')
          this.$router.push({ path: `/customers/${this.$route.params.customerId}/devices/${this.deviceId}?title=${this.deviceForm.name}` })
        } catch (error) {
          this.$message.error(error.response.data.message)
        }
      })
    },
    submit () {
      this.$refs.form.validate(async valid => {
        if (!valid) return false
        try {
          await this.$api.postDeviceCredentials({
            ...this.credentialsInfo,
            ...this.form
          })
          this.$message.success('操作成功')
          this.visible = false
        } catch (error) {
          this.$message.error(error.response.data.message)
        }
      })
    },
    remove () {
      this.$confirm('确认后,设备将被取消分配,客户将无法访问', `您确定要取消分配设备'${this.info.name}'?`, {
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }).then(async _ => {
        try {
          await this.$api.deleteCustomerDevice(this.info.id.id)
          this.$message.success('操作成功')
          this.$router.push({ path: `/customers/${this.$route.params.customerId}/devices` })
        } catch (error) {
          this.$message.error(error.response.data.message)
        }
      }).catch(() => {})
    },
    async openDialog () {
      try {
        const result = await this.$api.getDeviceCredentials(this.info.id.id)
        this.credentialsInfo = result.data
        this.form = {
          credentialsType: result.data.credentialsType || 'ACCESS_TOKEN',
          credentialsId: result.data.credentialsId,
          credentialsValue: result.data.credentialsValue
        }
        this.visible = true
      } catch (error) {}
    },
    async getDeviceTypes () {
      try {
        const result = await this.$api.getDeviceTypes()
        this.DeviceTypeList = result.data
      } catch (error) {}
    },
    init () {
      for (const key in this.deviceForm) {
        this.deviceForm[key] = this.info[key]
      }
      this.deviceForm.description = this.info.additionalInfo.description
      this.deviceForm.gateway = this.info.additionalInfo.gateway || false
    }
  },
  async created () {
    await this.getDeviceTypes()
    this.init()
  }
}
</script>
