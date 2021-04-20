<template>
  <div class="details-container">
    <div class="button-container" v-if="!isCustomer">
      <!-- <wx-button v-if="icon.public" type="warning" @click="open('public')">实体视图设为公开</wx-button> -->
      <wx-button v-if="icon.allocation" type="warning" @click="visible = true">分配给客户</wx-button>
      <wx-button v-if="icon.cancelAllocation" type="warning" @click="open('allocation')">取消分配客户</wx-button>
      <!-- <wx-button v-if="icon.provide" type="warning" @click="open('private')">实体视图设为私有</wx-button> -->
      <wx-button type="warning" @click="copy()">复制实体视图ID</wx-button>
      <wx-button type="warning" @click="open('delete')">删除实体视图</wx-button>
    </div>
    <form-info ref="info" :info="info"></form-info>
    <wx-button v-if="!isCustomer" style="margin: 20px 0;" type="primary" @click="$refs.info.submit()">修改</wx-button>
    <icloud-dialog
      title="将实体视图分配给客户"
      :visible.sync="visible">
      <el-form ref="form" :model="form" :rules="rules">
        <el-form-item label="客户" prop="id">
          <el-select v-model="form.id">
            <el-option v-for="item in customerList" :key="item.id.id" :label="item.name" :value="item.id.id"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="icloud-dialog-footer">
        <wx-button type="primary" @click="submit">确定</wx-button>
        <wx-button @click="visible = false">取消</wx-button>
      </div>
    </icloud-dialog>
  </div>
</template>

<script>
import { FormInfo } from './index.js'
import { copy } from '@/utils'
export default {
  props: ['entityId', 'info'],
  components: { FormInfo },
  data () {
    return {
      isCustomer: this.$store.getters.userInfo.authority === 'CUSTOMER_USER',
      icon: {},
      visible: false,
      form: {
        id: ''
      },
      rules: {
        id: [{ required: true, message: '客户不能为空', trigget: 'change' }]
      },
      customerList: []
    }
  },
  methods: {
    copy () {
      copy(this.info.id.id)
      this.$message.success('实体视图ID已经复制到粘贴板')
    },
    submit () {
      this.$refs.form.validate(async valid => {
        if (!valid) return false
        await this.$api.postCustomerEntityView(this.form.id, this.entityId)
        this.$message.success('分配成功')
        this.visible = false
        this.init()
        this.$emit('submit')
      })
    },
    open (type) {
      const info = {
        public: {
          title: `你确定你想创建公开'${this.info.name}'实体视图?`,
          msg: '确认后，实体视图 及其所有数据将被公开并被他人访问'
        },
        allocation: {
          title: `你确定要取消对'${this.info.name}'实体视图的分配吗?`,
          msg: '确认后，实体视图将未分配，客户无法访问'
        },
        private: {
          title: `你确定你想创建私有'${this.info.name}'实体视图?`,
          msg: '确认后，实体视图及其所有数据将被私有化，无法被他人访问'
        },
        delete: {
          title: `确定要删除实体视图'${this.info.name}'?`,
          msg: '小心！确认后实体视图及其所有相关数据将不可恢复'
        }
      }
      this.$confirm(info[type].msg, info[type].title, {
        confirmButtonText: '是',
        cancelButtonText: '否',
        type: 'warning'
      }).then(async _ => {
        let apiName = ''
        if (type === 'public') {
          apiName = 'postCustomerPublicEntityView'
        } else if (type === 'allocation' || type === 'private') {
          apiName = 'deleteCustomerEntityView'
        } else if (type === 'delete') {
          apiName = 'deleteEntityView'
        }
        const res = await this.$api[apiName](this.info.id.id)
        if (res.status === 200) {
          this.$message.success('操作成功')
          if (type === 'delete') {
            this.$router.push({ path: '/entity-views' })
          } else {
            this.init()
            this.$emit('submit')
          }
        }
      }).catch(() => {})
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
      const { customerIsPublic, customerTitle } = this.info
      this.icon = {
        public: !customerIsPublic && !customerTitle,
        allocation: !customerTitle,
        cancelAllocation: !customerIsPublic && customerTitle,
        provide: customerIsPublic
      }
      if (!this.isCustomer) {
        this.getCustomersList()
      }
    }
  },
  created () {
    this.init()
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
