<template>
  <div class="app-container" ref="appContainer" v-resize="mixinResize">
    <div class="icon-container">
      <wx-button type="primary" icon="el-icon-plus" circle @click="visible = true"></wx-button>
      <wx-button v-if="selection.length" type="primary" icon="icon-remove" circle @click="deleteMore"></wx-button>
    </div>
    <div class="filter-container" ref="filterContainer">
      <el-form :model="listQuery" class="filter-container-form" size="medium" :inline="true">
        <el-form-item>
          <el-input v-model="listQuery.textSearch" placeholder="搜索标题" @keyup.enter.native="getList()"></el-input>
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
            <el-button type="text" @click="openDashboard(scope.row)">打开应用库</el-button>
            <el-button type="text" @click="exportDashboard(scope.row.id.id)">导出应用库</el-button>
            <el-button type="text" @click="remove(scope.row)">取消分配用户</el-button>
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
      title="将应用库分配给客户">
      <el-form ref="form" :model="form" :rules="rules">
        <el-form-item label="请选择要分配给客户的应用库" prop="id">
          <el-select
            v-model="form.id"
            multiple
            filterable
            remote
            reserve-keyword
            :remote-method="remoteMethod"
            @focus="remoteMethod()">
            <el-option v-for="item in dashboardsList" :key="item.id.id" :label="item.name" :value="item.id.id"></el-option>
          </el-select>
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
import FileSaver from 'file-saver'
export default {
  props: ['customerId'],
  mixins: [page, resize],
  name: 'CustomerDashboards',
  data () {
    return {
      pageTitle: '',
      listQuery: {
        sortOrder: 'DESC',
        textSearch: ''
      },
      list: [],
      listTitle: [
        { property: 'createdTime', label: '创建时间', width: 150, sortable: true },
        { property: 'name', label: '标题', width: 150 },
        { property: 'btn', label: '操作', width: 250 }
      ],
      selection: [],
      visible: false,
      form: {
        id: []
      },
      rules: {
        id: [{ required: true, message: '分配给客户的应用库不能为空', trigger: 'change' }]
      },
      dashboardsList: []
    }
  },
  methods: {
    handleSelectionChange (val) {
      this.selection = val
    },
    async deleteMore () {
      this.$confirm('确认后，所有选定的应用库将被取消分配，客户将无法访问', `确定要删除${this.selection.length}应用库吗?`, {
        confirmButtonText: '是',
        cancelButtonText: '否'
      }).then(async _ => {
        try {
          await Promise.all([
            ...this.selection.map(item => this.$api.deleteCustomerDashboard(this.customerId, item.id.id))
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
    submit () {
      this.$refs.form.validate(async valid => {
        if (!valid) return false
        await Promise.all([
          ...this.form.id.map(item => this.$api.postCustomerDashboard(this.customerId, item))
        ])
        this.visible = false
        this.getList()
      })
    },
    async exportDashboard (id) {
      const res = await this.$api.getDashboardInfos(id)
      if (res.status === 200) {
        const data = JSON.stringify({
          title: res.data.title,
          configuration: res.data.configuration,
          name: res.data.name
        }, null, 2)
        const blob = new Blob([data], { type: '' })
        FileSaver.saveAs(blob, `${res.data.name}.json`)
      }
    },
    remove (row) {
      this.$confirm('确认后，面板将被取消分配，客户将无法访问', `您确定要取消分配应用库'${row.name}'吗?`, {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async _ => {
        const res = await this.$api.deleteCustomerDashboard(this.customerId, row.id.id)
        if (res.status === 200) {
          this.$message.success('操作成功')
          this.$refs.table.clearSelection()
          this.getList()
        }
      }).catch(() => {})
    },
    openDashboard (row) {
      this.$router.push({ path: `/customers/${this.customerId}/dashboards/${row.id.id}/view`, query: { title: row.name } })
    },
    cellClick (row, column) {
      if (column.label !== '操作' && column.type !== 'selection') {
        this.$router.push({ path: `/customers/${this.customerId}/dashboards/${row.id.id}/info`, query: { title: row.name } })
      }
    },
    async remoteMethod (value) {
      const result = await this.$api.getDashboardsList({
        pageSize: 50,
        page: 0,
        sortProperty: 'title',
        sortOrder: 'ASC',
        textSearch: value
      })
      this.dashboardsList = result.data.data
    },
    async getList (params) {
      this.loading = true
      try {
        const res = await this.$api.getCustomerDashboardList({
          page: params ? 0 : this.page - 1,
          pageSize: this.limit,
          sortProperty: 'createdTime',
          ...this.listQuery
        }, this.customerId)
        this.list = res.data.data.map(ele => Object.assign(ele, {
          createdTime: getDate({ timestamp: ele.createdTime })
        }))
        this.total = res.data.totalElements
      } catch (error) {}
      this.loading = false
    },
    async getCustomersInfo () {
      try {
        const { data } = await this.$api.getCustomersInfo(this.customerId)
        this.pageTitle = data.title
      } catch (error) {}
    }
  },
  activated () {
    this.getList()
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
