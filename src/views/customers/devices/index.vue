<template>
  <div class="app-container" ref="appContainer" v-resize="mixinResize">
    <div class="icon-container">
      <wx-button type="primary" icon="el-icon-plus" circle @click="openDialog('add')"></wx-button>
      <wx-button v-if="selection.length" type="primary" icon="icon-remove" circle @click="deleteMore"></wx-button>
    </div>
    <div class="filter-container" ref="filterContainer">
      <el-form :model="listQuery" class="filter-container-form" size="medium" :inline="true">
        <el-form-item label="设备类型">
          <el-select v-model="listQuery.type">
            <el-option label="全部" value=""></el-option>
            <el-option v-for="item in deviceTypeList" :key="item.type" :label="item.type" :value="item.type"></el-option>
          </el-select>
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
            <el-button type="text" @click="remove(scope.row)">取消分配用户</el-button>
            <el-button type="text" @click="openDialog('credentials', scope.row)">管理凭据</el-button>
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
      :visible.sync="visible"
      :title="title">
      <el-form v-if="type === 'add'" ref="form" :model="form" :rules="rules">
        <el-form-item label="请选择要分配给客户的设备" prop="id">
          <el-select
            v-model="form.id"
            multiple
            filterable
            remote
            reserve-keyword
            :remote-method="remoteMethod"
            @focus="remoteMethod()">
            <el-option v-for="item in deviceList" :key="item.id.id" :label="item.name" :value="item.id.id"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <el-form v-else ref="form" :model="credentialsForm" :rules="credentialsRules">
        <el-form-item label="凭据类型" prop="credentialsType">
          <el-select v-model="credentialsForm.credentialsType">
            <el-option label="Access token" value="ACCESS_TOKEN"></el-option>
            <el-option label="X.509 Certificate" value="X509_CERTIFICATE"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="credentialsForm.credentialsType === 'ACCESS_TOKEN' ? '访问令牌' : 'RSA公钥'" :prop="credentialsForm.credentialsType === 'ACCESS_TOKEN' ? 'credentialsId' : 'credentialsValue'">
          <el-input v-model="credentialsForm[credentialsForm.credentialsType === 'ACCESS_TOKEN' ? 'credentialsId' : 'credentialsValue']"></el-input>
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
  props: ['customerId'],
  mixins: [page, resize],
  name: 'CustomerDevices',
  data () {
    return {
      pageTitle: '',
      listQuery: {
        type: '',
        sortOrder: 'DESC'
      },
      list: [],
      listTitle: [
        { property: 'createdTime', label: '创建时间', width: 180, sortable: true },
        { property: 'name', label: '名称', width: 150 },
        { property: 'type', label: '设备类型', width: 150 },
        { property: 'label', label: '标签', width: 150 },
        { property: 'gateway', label: '是网关', width: 150 },
        { property: 'btn', label: '操作', width: 250 }
      ],
      selection: [],
      visible: false,
      title: '',
      type: '',
      credentialsInfo: null,
      form: {
        id: []
      },
      rules: {
        id: [{ required: true, message: '要分配给客户的设备不能为空', trigger: 'change' }]
      },
      deviceTypeList: [],
      deviceList: [],
      credentialsForm: {
        credentialsType: '',
        credentialsId: '',
        credentialsValue: ''
      },
      credentialsRules: {
        credentialsId: [{ required: true, message: '访问令牌不能为空', trigger: 'change' }],
        credentialsValue: [{ required: true, message: 'RSA公钥不能为空', trigger: 'change' }]
      }
    }
  },
  methods: {
    handleSelectionChange (val) {
      this.selection = val
    },
    async deleteMore () {
      this.$confirm('确认后,所有选定的设备将被取消分配,并且客户将无法访问', `确定要删除${this.selection.length}设备吗?`, {
        confirmButtonText: '是',
        cancelButtonText: '否'
      }).then(async _ => {
        try {
          await Promise.all([
            ...this.selection.map(item => this.$api.deleteCustomerDevice(item.id.id))
          ])
          this.$message.success('操作成功')
          this.page = 1
          this.getList()
          this.$refs.table.clearSelection()
        } catch (error) {
          console.log(error)
        }
      }).catch(() => {})
    },
    sortChange ({ order }) {
      const isDesc = order === 'descending'
      this.listQuery.sortOrder = isDesc ? 'DESC' : 'ASC'
      this.getList()
    },
    async openDialog (type, params) {
      this.type = type
      if (type === 'credentials') {
        this.title = '设备凭据'
        const res = await this.$api.getDeviceCredentials(params.id.id)
        this.credentialsInfo = res.data
        this.credentialsForm = {
          credentialsType: res.data.credentialsType || 'ACCESS_TOKEN',
          credentialsId: res.data.credentialsId,
          credentialsValue: res.data.credentialsValue
        }
      } else {
        this.title = '将设备分配给客户'
      }
      this.visible = true
    },
    submit () {
      this.$refs.form.validate(async valid => {
        if (!valid) return false
        if (this.type === 'add') {
          await Promise.all([
            ...this.form.id.map(item => this.$api.postCustomerDevice(this.customerId, item))
          ])
        } else {
          await this.$api.postDeviceCredentials({
            ...this.credentialsInfo,
            ...this.credentialsForm
          })
          this.$message.success('操作成功')
        }
        this.visible = false
        this.getList()
      })
    },
    cellClick (row, column) {
      if (column.label !== '操作' && column.type !== 'selection') {
        this.$router.push({ path: `/customers/${this.customerId}/devices/${row.id.id}`, query: { title: row.name } })
      }
    },
    remove (row) {
      this.$confirm('确认后,设备将被取消分配,客户将无法访问', `您确定要取消分配设备'${row.name}'?`, {
        confirmButtonText: '确定',
        cancelButtonText: '取消'
      }).then(async _ => {
        const res = await this.$api.deleteCustomerDevice(row.id.id)
        if (res.status === 200) {
          this.$message.success('操作成功')
          this.$refs.table.clearSelection()
          this.getList()
        }
      }).catch(() => {})
    },
    async getDeviceTypes () {
      const res = await this.$api.getDeviceTypes()
      this.deviceTypeList = res.data
    },
    async remoteMethod (value) {
      const res = await this.$api.getTenantDeviceInfos({
        pageSize: 50,
        page: 0,
        sortProperty: 'name',
        sortOrder: 'ASC',
        type: '',
        textSearch: value
      })
      this.deviceList = res.data.data
    },
    async getList (params) {
      this.loading = true
      try {
        const res = await this.$api.getCustomerDeviceLists(Object.assign({
          page: params ? 0 : this.page - 1,
          pageSize: this.limit,
          sortProperty: 'createdTime'
        }, this.listQuery), this.customerId)
        this.list = res.data.data.map(ele => Object.assign(ele, {
          createdTime: getDate({ timestamp: ele.createdTime }),
          gateway: (ele.additionalInfo && ele.additionalInfo.gateway) || false
        }))
        this.total = res.data.totalElements
      } catch (error) {
        console.log(error)
      }
      this.loading = false
    },
    async getCustomersInfo () {
      try {
        const { data } = await this.$api.getCustomersInfo(this.customerId)
        this.pageTitle = data.title
      } catch (error) {
        console.log(error)
      }
    }
  },
  activated () {
    this.getList()
    this.getDeviceTypes()
    this.getCustomersInfo()
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
