<template>
  <div class="details-container">
    <div class="button-container">
      <template v-if="!isCustomer">
        <!-- <wx-button type="warning" v-if="icon.public" @click="open('public')">资产设为公开</wx-button> -->
        <wx-button type="warning" v-if="icon.allocation" @click="visible = true">分配给客户</wx-button>
        <wx-button type="warning" v-if="icon.cancelAllocation" @click="open('allocation')">取消分配客户</wx-button>
        <!-- <wx-button type="warning" v-if="icon.provide" @click="open('private')">资产设为私有</wx-button> -->
        <wx-button type="warning" @click="open('delete')">删除</wx-button>
      </template>
      <wx-button type="warning" @click="copy">复制资产ID</wx-button>
    </div>
    <el-form ref="form" :model="form" :rules="rules">
      <el-form-item label="名称" prop="name">
        <el-input v-model="form.name"></el-input>
      </el-form-item>
      <el-form-item label="资产类型" prop="type">
        <el-input v-model="form.type"></el-input>
      </el-form-item>
      <el-form-item label="标签" prop="label">
        <el-input show-word-limit maxlength="255" v-model="form.label"></el-input>
      </el-form-item>
      <el-form-item label="描述" prop="description">
        <el-input type="textarea" autosize v-model="form.description"></el-input>
      </el-form-item>
      <el-form-item v-if="!isCustomer">
        <wx-button type="primary" @click="submit">修改</wx-button>
      </el-form-item>
    </el-form>
    <icloud-dialog title="将资产分配给客户" :visible.sync="visible">
      <el-form ref="allocationForm" :model="allocationForm" :rules="allocationRules">
        <el-form-item label="客户" prop="id">
          <el-select v-model="allocationForm.id">
            <el-option v-for="item in customerList" :key="item.id.id" :label="item.name" :value="item.id.id"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="icloud-dialog-footer">
        <wx-button type="primary" @click="save">确定</wx-button>
        <wx-button @click="visible = false">取消</wx-button>
      </div>
    </icloud-dialog>
  </div>
</template>

<script>
import { copy } from '@/utils'
export default {
  props: ['assetId', 'info'],
  data () {
    return {
      isCustomer: this.$store.getters.userInfo.authority === 'CUSTOMER_USER',
      icon: {},
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
      visible: false,
      allocationForm: {
        id: ''
      },
      allocationRules: {
        id: [{ required: true, message: '客户不能为空', trigget: 'change' }]
      },
      customerList: []
    }
  },
  methods: {
    copy () {
      copy(this.info.id.id)
      this.$message.success('资产ID已经复制到粘贴板')
    },
    save () {
      this.$refs.allocationForm.validate(async valid => {
        if (!valid) return false
        try {
          await this.$api.postCustomerAsset(this.allocationForm.id, this.assetId)
          this.$message.success('操作成功')
          this.visible = false
          this.$emit('submit')
        } catch (error) {
          this.$message.error(error.response.data.message)
        }
      })
    },
    open (type) {
      const info = {
        public: {
          title: `你确定你想创建公开'${this.info.name}'资产?`,
          msg: '确认后，资产及其所有数据将被公开并被他人访问',
          apiName: 'postPublicAsset'
        },
        allocation: {
          title: `你确定要取消对'${this.info.name}'资产的分配吗?`,
          msg: '确认后，资产将未分配，客户无法访问',
          apiName: 'deleteCustomerAsset'
        },
        private: {
          title: `你确定你想创建私有'${this.info.name}'资产?`,
          msg: '确认后，资产及其所有数据将被私有化，无法被他人访问',
          apiName: 'deleteCustomerAsset'
        },
        delete: {
          title: `确定要删除资产'${this.info.name}'?`,
          msg: '小心！确认后资产及其所有相关数据将不可恢复',
          apiName: 'deleteAsset'
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
            this.$router.push({ path: '/assets' })
          } else {
            this.$emit('submit')
          }
        } catch (error) {
          this.$message.error(error.response.data.message)
        }
      }).catch(() => {})
    },
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
          this.$emit('submit')
          this.$message.success('资产修改成功')
          this.$router.push({ path: `/assets/${this.assetId}`, query: { title: this.form.name } })
        } catch (error) {
          this.$message.error(error.response.data.message)
        }
      })
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
    init () {
      const { description } = this.info.additionalInfo || {}
      for (const key in this.form) {
        this.form[key] = key === 'description' ? description : this.info[key]
      }
      const { customerIsPublic, customerTitle } = this.info
      this.icon = {
        public: !customerIsPublic && !customerTitle,
        allocation: !customerTitle,
        cancelAllocation: !customerIsPublic && customerTitle,
        provide: customerIsPublic
      }
    }
  },
  created () {
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
