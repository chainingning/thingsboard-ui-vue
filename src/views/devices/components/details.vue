<template>
  <div class="details-container">
    <div class="button-container">
      <!-- <wx-button v-if="icon.public && !isCustomer" type="warning" @click="open('public')">设为公开</wx-button> -->
      <wx-button v-if="icon.allocation && !isCustomer" type="warning" @click="openDialog('allocation')">分配给客户</wx-button>
      <wx-button v-if="icon.cancelAllocation && !isCustomer" type="warning" @click="open('allocation')">取消分配客户</wx-button>
      <!-- <wx-button v-if="icon.provide && !isCustomer" type="warning" @click="open('private')">设为私有</wx-button> -->
      <wx-button type="warning" @click="openDialog('credentials')">{{ isCustomer ? '查看凭证' : '管理凭据' }}</wx-button>
      <wx-button v-if="!isCustomer" type="warning" @click="open('delete')">删除设备</wx-button>
      <wx-button type="warning" @click="copy('ID')">复制设备ID</wx-button>
      <wx-button type="warning" @click="copy('credentialsId')">复制访问令牌</wx-button>
    </div>
    <el-form ref="deviceForm" :model="deviceForm" :rules="deviceRules" :disabled="isCustomer">
      <el-form-item label="名称" prop="name">
        <el-input v-model="deviceForm.name"></el-input>
      </el-form-item>
      <el-form-item label="设备类型" prop="type">
        <el-select v-model="deviceForm.type" allow-create filterable>
          <el-option v-for="item in DeviceTypeList" :key="item.type" :label="item.type" :value="item.type"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="标签" prop="label">
        <el-input v-model="deviceForm.label"></el-input>
      </el-form-item>
      <el-form-item label="设备启用" prop="enabled">
        <el-switch
          v-model="deviceForm.enabled"
          active-color="#40CB43"
          inactive-color="#DDDDDD">
        </el-switch>
      </el-form-item>
      <el-form-item prop="gateway">
        <el-checkbox v-model="deviceForm.gateway">是网关</el-checkbox>
      </el-form-item>
      <el-form-item label="描述" prop="description">
        <el-input type="textarea" autosize v-model="deviceForm.description"></el-input>
      </el-form-item>
      <el-form-item>
        <wx-button v-if="!isCustomer" type="primary" @click="save">修改</wx-button>
      </el-form-item>
    </el-form>
    <icloud-dialog
      :visible.sync="visible"
      :title="title">
      <el-form v-if="type === 'credentials'" ref="form" :model="form" :rules="formRules" :disabled="isCustomer">
        <el-form-item label="凭据类型" prop="credentialsType">
          <el-select v-model="form.credentialsType">
            <el-option label="Access token" value="ACCESS_TOKEN"></el-option>
            <el-option label="X.509 Certificate" value="X509_CERTIFICATE"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item
          :label="form.credentialsType === 'ACCESS_TOKEN' ? '访问令牌' : 'RSA公钥'"
          :prop="form.credentialsType === 'ACCESS_TOKEN' ? 'credentialsId' : 'credentialsValue'">
          <el-input v-model="form[form.credentialsType === 'ACCESS_TOKEN' ? 'credentialsId' : 'credentialsValue']"></el-input>
        </el-form-item>
      </el-form>
      <el-form v-else-if="type === 'allocation'" ref="form" :model="allocationForm" :rules="allocationRules">
        <el-form-item label="客户" prop="id">
          <el-select v-model="allocationForm.id">
            <el-option v-for="item in customerList" :key="item.id.id" :label="item.name" :value="item.id.id"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <div class="icloud-dialog-footer" slot="footer">
        <wx-button v-if="!isCustomer" type="primary" @click="submit">确定</wx-button>
        <wx-button @click="visible = false">取消</wx-button>
      </div>
    </icloud-dialog>
  </div>
</template>

<script>
import { copy } from '@/utils'
export default {
  props: ['deviceId', 'info'],
  data () {
    return {
      isCustomer: this.$store.getters.userInfo.authority === 'CUSTOMER_USER',
      title: '',
      visible: false,
      deviceForm: {
        name: '',
        type: '',
        label: '',
        gateway: '',
        enabled: false,
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
      },
      allocationForm: {
        id: ''
      },
      allocationRules: {
        id: [{ required: true, message: '客户不能为空', trigget: 'change' }]
      },
      icon: {},
      type: '',
      customerList: []
    }
  },
  methods: {
    copy (type) {
      if (type === 'ID') {
        copy(this.info.id.id)
        this.$message.success('复制设备ID成功')
      } else {
        copy(this.credentialsInfo.credentialsId)
        this.$message.success('复制访问令牌成功')
      }
    },
    async openDialog (type) {
      this.type = type
      switch (type) {
        case 'allocation':
          this.title = '将设备分配给客户'
          break
        case 'credentials':
          this.title = '设备凭据'
          this.form = {
            credentialsType: this.credentialsInfo.credentialsType || 'ACCESS_TOKEN',
            credentialsId: this.credentialsInfo.credentialsId,
            credentialsValue: this.credentialsInfo.credentialsValue
          }
          break
        default:
          break
      }
      this.visible = true
    },
    open (type) {
      const info = {
        public: {
          title: `您确定要将设备'${this.info.name}'设为公开吗`,
          msg: '确认后，设备及其所有数据将被公开并被他人访问',
          apiName: 'postDeviceAsset'
        },
        allocation: {
          title: `您确定要取消分配设备'${this.info.name}'`,
          msg: '确认后,设备将被取消分配,客户将无法访问',
          apiName: 'deleteCustomerDevice'
        },
        private: {
          title: `您确定要将设备'${this.info.name}'设为私有吗`,
          msg: '确认后，设备及其所有数据将被设为私有，不被其他人访问',
          apiName: 'deleteCustomerDevice'
        },
        delete: {
          title: `确定要删除设备'${this.info.name}'?`,
          msg: '小心！确认后设备及其所有相关数据将不可恢复',
          apiName: 'deleteDevice'
        }
      }
      this.$confirm(info[type].msg, info[type].title, {
        confirmButtonText: '是',
        cancelButtonText: '否',
        type: 'warning'
      }).then(async _ => {
        try {
          await this.$api[info[type].apiName](this.info.id.id)
          this.$message.success('操作成功')
          if (type === 'delete') {
            this.$router.push({ path: '/devices' })
          } else {
            this.$emit('submit')
          }
        } catch (error) {
          this.$message.error(error.response.data.message)
        }
      }).catch(() => {})
    },
    save () {
      this.$refs.deviceForm.validate(async valid => {
        if (!valid) return false
        const params = {
          ...this.info,
          ...this.deviceForm,
          additionalInfo: {
            ...this.info.additionalInfo,
            gateway: Boolean(this.deviceForm.gateway),
            description: this.deviceForm.description
          }
        }
        delete params.gateway
        delete params.description
        try {
          await this.$api.postDevice(params)
          this.$message.success('修改成功')
          this.$router.push({ path: `/devices/${this.deviceId}?title=${this.deviceForm.name}` })
        } catch (error) {
          this.$message.error(error.response.data.message)
        }
      })
    },
    submit () {
      this.$refs.form.validate(async valid => {
        if (!valid) return false
        try {
          if (this.type === 'allocation') {
            await this.$api.postCustomerDevice(this.allocationForm.id, this.info.id.id)
          } else if (this.type === 'credentials') {
            await this.$api.postDeviceCredentials({
              ...this.credentialsInfo,
              ...this.form
            })
          }
          this.$message.success('操作成功')
          this.visible = false
          this.$emit('submit')
        } catch (error) {
          this.$message.error(error.response.data.message)
        }
      })
    },
    async getDeviceTypes () {
      try {
        const result = await this.$api.getDeviceTypes()
        this.DeviceTypeList = result.data
      } catch (error) {
        this.$message.error(error.response.data.message)
      }
    },
    async getCustomersList () {
      const res = await this.$api.getCustomersList({
        pageSize: 999999,
        page: 0,
        sortProperty: 'title',
        sortOrder: 'ASC'
      })
      this.customerList = res.data.data
    },
    async init () {
      const { description, gateway } = this.info.additionalInfo || {}
      for (const key in this.deviceForm) {
        this.deviceForm[key] = this.info[key]
      }
      this.deviceForm.description = description
      this.deviceForm.gateway = gateway || false
      const { customerIsPublic, customerTitle } = this.info
      this.icon = {
        public: !customerIsPublic && !customerTitle,
        allocation: !customerTitle,
        cancelAllocation: !customerIsPublic && customerTitle,
        provide: customerIsPublic
      }
      const result = await this.$api.getDeviceCredentials(this.info.id.id)
      this.credentialsInfo = result.data
    }
  },
  async created () {
    await this.getDeviceTypes()
    this.init()
    if (!this.isCustomer) {
      this.getCustomersList()
    }
  },
  watch: {
    visible (n) {
      if (!n) {
        this.$refs.form.resetFields()
      }
    },
    info: {
      deep: true,
      handler () {
        this.init()
      }
    }
  }
}
</script>
