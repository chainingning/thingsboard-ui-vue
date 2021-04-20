<template>
  <div class="app-container" ref="appContainer" v-resize="mixinResize">
    <div class="icon-container">
      <wx-button type="primary" icon="el-icon-plus" circle @click="visible = true"></wx-button>
      <wx-button v-if="selection.length" type="primary" icon="icon-remove" circle @click="deleteMore"></wx-button>
    </div>
    <div class="filter-container" ref="filterContainer">
      <el-form :model="listQuery" class="filter-container-form" size="medium" :inline="true" @submit.native.prevent>
        <el-form-item>
          <el-input v-model="listQuery.textSearch" placeholder="搜索电子邮件" @keyup.enter.native="getList()"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getList(listQuery)">查询</el-button>
        </el-form-item>
      </el-form>
    </div>
    <el-table
      ref="table"
      :data="list"
      v-loading="loading"
      :default-sort="{prop: 'createdTime', order: 'descending'}"
      @sort-change="sortChange"
      size="mini"
      :height="mixinHeight"
      :class="['configurationTable', {afterRenderClass: mixinShowAfterRenderClass}]"
      @cell-click="cellClick"
      @selection-change="handleSelectionChange"
      :row-key="row => row.id.id">
      <el-table-column
        type="selection"
        width="90"
        :reserve-selection="true">
      </el-table-column>
      <el-table-column
        v-for="item in listTitle"
        :key="item.label"
        :min-width="item.width"
        :label="item.label"
        :sortable="item.sortable"
        :prop="item.property"
        :sort-orders="['ascending', 'descending']"
        show-overflow-tooltip>
        <template slot-scope="scope">
          <span v-if="item.property === 'btn'" >
            <el-button type="text" @click="login(scope.row.id.id)">以用户身份登录</el-button>
            <el-button type="text" @click="del(scope.row)">删除</el-button>
          </span>
          <span v-else>{{ scope.row[item.property] }}</span>
        </template>
      </el-table-column>
    </el-table>
    <el-pagination
      class="pagination-container"
      ref="pagination"
      @size-change="getList()"
      @current-change="getList()"
      :current-page.sync="page"
      background
      :page-sizes="sizes"
      :page-size.sync="limit"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
    ></el-pagination>
    <icloud-dialog
      title="添加设备管理员账号"
      :visible.sync="visible">
      <el-form ref="form" :model="form" :rules="formRules" size="mini">
        <el-form-item label="电子邮件" prop="email">
          <el-input v-model="form.email"></el-input>
        </el-form-item>
        <el-form-item label="证书Key" prop="certKey">
          <el-input v-model="form.certKey"></el-input>
        </el-form-item>
        <el-form-item label="名字" prop="firstName">
          <el-input v-model="form.firstName"></el-input>
        </el-form-item>
        <el-form-item label="姓" prop="lastName">
          <el-input v-model="form.lastName"></el-input>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input type="textarea" autosize v-model="form.description"></el-input>
        </el-form-item>
        <el-form-item label="激活方式" prop="sendActivationMail">
          <el-select v-model="form.sendActivationMail">
            <el-option label="显示激活链接" :value="false"></el-option>
            <el-option label="发送激活邮件" :value="true"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <div class="icloud-dialog-footer" slot="footer">
        <wx-button size="mini" type="primary" @click="submit('form')">添加</wx-button>
        <wx-button size="mini" @click="visible = false">取消</wx-button>
      </div>
    </icloud-dialog>
    <icloud-dialog
      :visible.sync="userAcitonVisible"
      title="用户激活链接">
      <div class="link">
        <span>使用该链接<el-button type="text" class="active" @click="active">激活</el-button>激活用户</span>
      </div>
      <div class="link-address">
        <code>{{ link }}</code>
      </div>
    </icloud-dialog>
  </div>
</template>

<script>
import { page, resize } from '@/mixins'
import { getDate } from '@/utils'
import { setToken } from '@/utils/token'
export default {
  props: ['tenantId'],
  mixins: [page, resize],
  name: 'Admins',
  data () {
    return {
      pageTitle: '',
      listQuery: {
        sortOrder: 'DESC',
        textSearch: ''
      },
      list: [],
      listTitle: [
        { property: 'createdTime', label: '创建时间', width: 180, sortable: true },
        { property: 'firstName', label: '名字', width: 150 },
        { property: 'lastName', label: '姓', width: 150 },
        { property: 'email', label: '电子邮件', width: 150 },
        { property: 'btn', label: '操作', width: 250 }
      ],
      selection: [],
      visible: false,
      form: {
        email: '',
        certKey: '',
        firstName: '',
        lastName: '',
        description: '',
        sendActivationMail: false
      },
      formRules: {
        email: [
          { required: true, message: '电子邮件必填', trigger: ['blur', 'change'] },
          { type: 'email', message: '请输入正确的电子邮件地址', trigger: 'change' }
        ]
      },
      userAcitonVisible: false,
      link: ''
    }
  },
  methods: {
    active () {
      if (this.link) {
        const activateToken = this.link.split('?')[1].split('=')[1]
        window.open(`${this.$ip('BASE_URL')}/#/login/createPassword?activateToken=${activateToken}`)
      }
    },
    handleSelectionChange (val) {
      this.selection = val
    },
    async deleteMore () {
      this.$confirm('小心！确认后，所有选定的用户将被删除，所有相关数据将不可恢复', `确定要删除${this.selection.length}用户吗?`, {
        confirmButtonText: '是',
        cancelButtonText: '否'
      }).then(async _ => {
        try {
          await Promise.all([
            ...this.selection.map(item => this.$api.deleteUser(item.id.id))
          ])
          this.$message.success('操作成功')
          this.page = 1
          this.getList()
          this.$refs.table.clearSelection()
        } catch (error) {
          this.$message.error(error.response.data.message)
        }
      }).catch(() => {})
    },
    sortChange ({ order }) {
      const isDesc = order === 'descending'
      this.listQuery.sortOrder = isDesc ? 'DESC' : 'ASC'
      this.getList()
    },
    async login (userId) {
      try {
        const result = await this.$api.getToken(userId)
        setToken(result.data.token, result.data.refreshToken)
        const userInfo = await this.$api.getUserInfo(userId)
        this.$store.commit('SET_USER_INFO', userInfo.data)
        this.$store.commit('SET_PERMISSION_ROUTER', userInfo.data.authority)
        this.$router.push({ path: '/home' })
      } catch (error) {
        this.$message.error(error.response.data.message)
      }
    },
    del (row) {
      this.$confirm('小心！确认后,账户和所有相关数据将不可恢复。', `您确定要删除账户 '${row.name}' 吗？`, {
        confirmButtonText: '是',
        cancelButtonText: '否',
        type: 'warning'
      }).then(async _ => {
        const res = await this.$api.deleteUser(row.id.id)
        if (res.status === 200) {
          this.$message.success('删除成功')
          this.$refs.table.clearSelection()
          this.getList()
        }
      }).catch(() => {})
    },
    submit (formName) {
      this.$refs[formName].validate(async valid => {
        if (!valid) return false
        const customerId = {
          entityType: 'CUSTOMER',
          id: this.$store.getters.userInfo.customerId.id
        }
        const tenantId = {
          entityType: 'TENANT',
          id: this.tenantId
        }
        const params = Object.assign({
          additionalInfo: { description: this.form.description },
          authority: 'TENANT_ADMIN',
          customerId,
          tenantId
        }, this.form)
        delete params.description
        delete params.sendActivationMail
        const res = await this.$api.postUserSendActivationMail(params, this.form.sendActivationMail)
        if (res.status === 200) {
          if (this.form.sendActivationMail) {
            this.visible = false
          } else {
            const activationLink = await this.$api.getUserActivationLink(res.data.id.id)
            this.link = activationLink.data
            this.userAcitonVisible = true
          }
          this.getList()
        }
      })
    },
    cellClick (row, column) {
      if (column.label !== '操作' && column.type !== 'selection') {
        this.$router.push({ path: `/tenants/${this.tenantId}/admins/${row.id.id}`, query: { title: row.name } })
      }
    },
    async getList (params) {
      this.loading = true
      const res = await this.$api.getOneUsersList({
        page: params ? 0 : this.page - 1,
        pageSize: this.limit,
        sortProperty: 'createdTime',
        ...this.listQuery
      }, this.tenantId, 'tenant')
      this.list = res.data.data.map(ele => Object.assign(ele, {
        createdTime: getDate({ timestamp: ele.createdTime })
      }))
      this.total = res.data.totalElements
      this.loading = false
    },
    async getOneUserInfo () {
      const { data } = await this.$api.getOneUserInfo(this.tenantId, 'tenant')
      this.pageTitle = data.title
    }
  },
  activated () {
    this.getList()
    this.getOneUserInfo()
    this.$refs.table.clearSelection()
  },
  watch: {
    userAcitonVisible (n) {
      if (!n) {
        this.visible = false
      }
    },
    visible (n) {
      if (!n) {
        this.$refs.form.resetFields()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.active {
  font-size: 20px;
  padding: 0 5px;
}
.link {
  font-size: 20px;
  color: rgba(0, 0, 0, 0.87);
}
.link-address {
  code {
    margin: 20px 0;
    padding: 15px;
    display: inline-block;
    line-height: 1;
    color: #303030;
    font-size: 16px;
    font-family: monospace;
    font-weight: 700;
    background-color: #f7f7f7;
  }
  .el-button {
    margin-left: 10px;
  }
}
</style>
