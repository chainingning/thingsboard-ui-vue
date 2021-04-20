<template>
  <div class="details-container">
    <div class="button-container">
      <wx-button type="warning" @click="openDetails">打开</wx-button>
      <template v-if="!isCustomer">
        <wx-button type="warning" @click="exportDashboard">导出</wx-button>
        <!-- <wx-button v-if="!form.link" type="warning" @click="publicLink">设为公开</wx-button>
        <wx-button v-if="form.link" type="warning" @click="open('private')">设为私有</wx-button> -->
        <wx-button type="warning" @click="openDialog">管理已分配的客户</wx-button>
        <wx-button type="warning" @click="open('remove')">删除</wx-button>
      </template>
    </div>
    <el-form ref="form" :model="form" :rules="rules" :disabled="isCustomer">
      <el-form-item label="标题" prop="title">
        <el-input v-model="form.title" placeholder="请输入标题"></el-input>
      </el-form-item>
      <el-form-item label="分配客户" prop="customer">
        <el-input readonly v-model="form.customer"></el-input>
      </el-form-item>
      <!-- <el-form-item v-if="form.link" label="公共链接" prop="link">
        <el-input readonly v-model="form.link"></el-input>
      </el-form-item> -->
      <el-form-item label="描述" prop="description">
        <el-input type="textarea" autosize v-model="form.description" placeholder="请输入描述"></el-input>
      </el-form-item>
      <el-form-item v-if="!isCustomer">
        <wx-button type="primary" @click="submit('edit')">修改</wx-button>
      </el-form-item>
    </el-form>
    <icloud-dialog
      title="将应用库分配给客户"
      :visible.sync="visible">
      <el-form ref="form" :model="form" :rules="rules">
        <el-form-item label="已分配的客户" prop="id">
          <el-select multiple filterable v-model="form.id">
            <el-option
              v-for="item in customerList"
              :key="item.id.id"
              :label="item.title"
              :value="item.id.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <div class="icloud-dialog-footer" slot="footer">
        <wx-button type="primary" @click="submit('allocation')">确定</wx-button>
        <wx-button @click="visible = false">取消</wx-button>
      </div>
    </icloud-dialog>
    <icloud-dialog title="应用库现已公布" width="800px" :visible.sync="publicVisble">
      <div class="link">
        <span>应用库现已公布你的应用库'{{publicInfo.name}}'已被公开，可通过如下<el-button
          type="text"
          class="active"
          @click="openLink">链接</el-button>访问:</span>
      </div>
      <div class="link-address">
        <code>{{ publicInfo.link }}</code>
      </div>
    </icloud-dialog>
  </div>
</template>

<script>
import FileSaver from 'file-saver'
export default {
  props: ['id'],
  data () {
    return {
      info: {},
      isCustomer: this.$store.getters.userInfo.authority === 'CUSTOMER_USER',
      icon: {},
      visible: false,
      form: {
        title: '',
        description: '',
        id: [],
        customer: '',
        link: ''
      },
      rules: {
        title: [{ required: true, message: '标题不能为空', trigger: 'change' }]
      },
      customerList: [],
      publicVisble: false,
      publicInfo: {
        name: '',
        link: ''
      }
    }
  },
  methods: {
    submit (type) {
      this.$refs.form.validate(async valid => {
        if (!valid) return false
        try {
          const isTpl = type === 'edit'
          const configuration = {
            ...this.info.configuration,
            description: this.form.description
          }
          const params = isTpl ? {
            ...this.info,
            title: this.form.title,
            configuration
          } : this.form.id
          const apiName = isTpl ? 'postDashboard' : 'postDashboardCustomers'
          await this.$api[apiName](
            isTpl ? params : this.info.id.id, params
          )
          this.$message.success('操作成功')
          if (isTpl) {
            this.$router.push({ path: `/dashboards/${this.id}/details`, query: { title: this.form.title } })
          } else {
            this.init()
            this.visible = false
          }
        } catch (error) {
          this.$message.error(error.response.data.message)
        }
      })
    },
    openDetails () {
      this.$router.push({ path: `/dashboards/${this.id}`, query: { title: this.form.title } })
    },
    async exportDashboard () {
      try {
        const res = await this.$api.getDashboardInfos(this.info.id.id)
        const data = JSON.stringify({
          title: res.data.title,
          configuration: res.data.configuration,
          name: res.data.name
        }, null, 2)
        const blob = new Blob([data], { type: '' })
        FileSaver.saveAs(blob, `${this.info.title}.json`)
      } catch (error) {
        this.$message.error(error.response.data.message)
      }
    },
    async publicLink () {
      try {
        const res = await this.$api.postPublicDashboard(this.info.id.id)
        const publicInfo = res.data.assignedCustomers.find(item => item.public)
        const publicId = publicInfo.customerId.id
        this.publicInfo = {
          name: this.info.title,
          link: `${this.$ip('BASE_URL')}/#/dashboard/${this.info.id.id}?publicId=${publicId}`
        }
        this.publicVisble = true
      } catch (error) {
        this.$message.error(error.response.data.message)
      }
    },
    open (type) {
      const info = {
        private: {
          tipMsg: `您确定要将应用库'${this.info.name}'设为私有吗？`,
          msg: '确认后，应用库将被设为私有，不能被其他人访问。',
          apiName: 'deletePublicDashboard'
        },
        remove: {
          tipMsg: `您确定要删除应用库'${this.info.name}'吗？`,
          msg: '小心！确认后应用库及其所有相关数据将不可恢复。',
          apiName: 'deleteDashboard'
        }
      }
      this.$confirm(info[type].msg, info[type].tipMsg, {
        confirmButtonText: '是',
        cancelButtonText: '否'
      }).then(async _ => {
        try {
          await this.$api[info[type].apiName](this.info.id.id)
          this.$message.success('操作成功')
          if (type === 'remove') {
            this.$router.push({ path: '/dashboards' })
          } else {
            this.init()
          }
        } catch (error) {
          this.$message.error(error.response.data.message)
        }
      }).catch(() => {})
    },
    openDialog () {
      this.visible = true
    },
    openLink () {
      window.open(this.publicInfo.link)
    },
    async getCustomersList () {
      const res = await this.$api.getCustomersList({
        pageSize: 9999999,
        page: 0,
        sortProperty: 'title',
        sortOrder: 'ASC'
      })
      this.customerList = res.data.data
    },
    async getDashboardInfos () {
      const res = await this.$api.getDashboardInfos(this.id)
      this.info = res.data
    },
    async init () {
      await this.getDashboardInfos()
      const { description } = this.info.configuration || {}
      const { assignedCustomers } = this.info || {}
      const publicInfo = assignedCustomers && assignedCustomers.find(item => item.public)
      const link = publicInfo ? `${this.$ip('BASE_URL')}/#/dashboard/${this.info.id.id}?publicId=${publicInfo.customerId.id}` : ''
      this.form = {
        title: this.info.title,
        description,
        id: assignedCustomers ? assignedCustomers.map(ele => ele.customerId.id) : '',
        customer: assignedCustomers && assignedCustomers.map(ele => ele.title).join(','),
        link
      }
    }
  },
  async created () {
    if (!this.isCustomer) {
      await this.getCustomersList()
    }
    this.init()
  },
  watch: {
    publicVisble (n) {
      if (!n) {
        this.init()
      }
    }
  }
}
</script>
