<template>
  <div class="app-container" ref="appContainer" v-resize="mixinResize">
    <div class="icon-container">
      <wx-button type="primary" icon="el-icon-plus" circle @click="openDialog()"></wx-button>
      <wx-button v-if="selection.length" type="primary" icon="icon-remove" circle @click="deleteMore"></wx-button>
    </div>
    <div class="filter-container" ref="filterContainer">
      <el-form :model="listQuery" class="filter-container-form" size="medium" :inline="true" @submit.native.prevent>
        <el-form-item>
          <el-input v-model="listQuery.textSearch" placeholder="搜索标题" @keyup.enter.native="getList(listQuery)"></el-input>
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
            <el-button v-if="!scope.row.icon.public" type="text" @click="jumpRouter(scope.row, 'users')">{{ $store.getters.userInfo.authority === 'TENANT_ADMIN' ? '管理客户账户' : '管理租户管理员' }}</el-button>
            <el-button v-if="$store.getters.userInfo.authority === 'TENANT_ADMIN'" type="text" @click="jumpRouter(scope.row, 'assets')">管理客户资产</el-button>
            <el-button v-if="$store.getters.userInfo.authority === 'TENANT_ADMIN'" type="text" @click="jumpRouter(scope.row, 'devices')">管理客户设备</el-button>
            <el-button v-if="$store.getters.userInfo.authority === 'TENANT_ADMIN'" type="text" @click="jumpRouter(scope.row, 'dashboards')">管理客户应用</el-button>
            <el-button v-if="!scope.row.icon.public" type="text" @click="del(scope.row)">删除客户</el-button>
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
      title="添加客户"
      :visible.sync="visible"
      width="616px">
      <el-form ref="form" :model="form" :rules="formRules" size="mini">
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
      </el-form>
      <div class="icloud-dialog-footer" slot="footer">
        <wx-button type="primary" @click="submit">确定</wx-button>
        <wx-button @click="visible = false">取消</wx-button>
      </div>
    </icloud-dialog>
  </div>
</template>

<script>
import { page, resize } from '@/mixins'
import { getDate } from '@/utils'
export default {
  mixins: [page, resize],
  name: 'Customers',
  data () {
    return {
      listQuery: {
        sortOrder: 'DESC',
        textSearch: ''
      },
      list: [],
      listTitle: [
        { property: 'createdTime', label: '创建时间', width: 180, sortable: true },
        { property: 'name', label: '标题', width: 150 },
        { property: 'email', label: '邮箱', width: 150 },
        { property: 'country', label: '国家', width: 150 },
        { property: 'city', label: '城市', width: 150 },
        { property: 'btn', label: '操作', width: 600 }
      ],
      selection: [],
      visible: false,
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
    handleSelectionChange (val) {
      this.selection = val
    },
    async deleteMore () {
      this.$confirm('小心！确认后，所有选定的客户将被删除，所有相关数据将不可恢复', `确定要删除${this.selection.length}客户吗?`, {
        confirmButtonText: '是',
        cancelButtonText: '否'
      }).then(async _ => {
        try {
          await Promise.all([
            ...this.selection.map(item => this.$api.deleteCustomer(item.id.id))
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
    del (row) {
      this.$confirm('小心！确认后,用户及其所有相关数据将不可恢复', `确定要删除客户'${row.name}'吗?`, {
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }).then(async _ => {
        await this.$api.deleteCustomer(row.id.id)
        this.$message.success('删除成功')
        this.$refs.table.clearSelection()
        this.getList()
      }).catch(() => {})
    },
    cellClick (row, column) {
      if (column.label !== '操作') {
        this.$router.push({ path: `/customers/${row.id.id}`, query: { title: row.name } })
      }
    },
    jumpRouter (row, path) {
      this.$router.push({ path: `/customers/${row.id.id}/${path}` })
    },
    openDialog () {
      this.visible = true
    },
    submit () {
      this.$refs.form.validate(async valid => {
        if (!valid) return false
        const params = Object.assign({
          additionalInfo: { description: this.form.description }
        }, this.form)
        delete params.description
        await this.$api.updateOneUser(params, 'customer')
        this.visible = false
        this.getList()
      })
    },
    async getList (params) {
      this.loading = true
      try {
        const res = await this.$api.getOneUserList({
          page: params ? 0 : this.page - 1,
          pageSize: this.limit,
          sortProperty: 'createdTime',
          ...this.listQuery
        }, 'customers')
        this.list = res.data.data.map(ele => {
          const { isPublic } = ele.additionalInfo || {}
          return {
            ...ele,
            createdTime: getDate({ timestamp: ele.createdTime }),
            icon: {
              public: isPublic
            }
          }
        })
        this.total = res.data.totalElements
      } catch (error) {}
      this.loading = false
    }
  },
  activated () {
    this.getList()
    this.$refs.table.clearSelection()
  },
  watch: {
    visible (n) {
      if (!n) {
        this.$refs.form.resetFields()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
