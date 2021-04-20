<template>
  <div class="app-container" ref="appContainer" v-resize="mixinResize">
    <div class="icon-container">
      <wx-button type="primary" icon="el-icon-plus" circle @click="visible = true"></wx-button>
      <wx-button v-if="selection.length" type="primary" icon="icon-remove" circle @click="deleteMore"></wx-button>
    </div>
    <div class="filter-container" ref="filterContainer">
      <el-form :model="listQuery" class="filter-container-form" size="medium" :inline="true">
        <el-form-item label="资产类型">
          <el-select v-model="listQuery.type">
            <el-option label="全部" value=""></el-option>
            <el-option v-for="item in assetTypeList" :key="item.type" :label="item.type" :value="item.type"></el-option>
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
      title="将资产分配给客户">
      <el-form ref="form" :model="form" :rules="rules">
        <el-form-item label="请选择要分配给客户的资产" prop="id">
          <el-select
            v-model="form.id"
            multiple
            filterable
            remote
            reserve-keyword
            :remote-method="remoteMethod"
            @focus="remoteMethod()">
            <el-option v-for="item in assetList" :key="item.id.id" :label="item.name" :value="item.id.id"></el-option>
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
export default {
  props: ['customerId'],
  mixins: [page, resize],
  name: 'CustomerAssets',
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
        { property: 'type', label: '资产类型', width: 150 },
        { property: 'label', label: '标签', width: 150 },
        { property: 'btn', label: '操作', width: 250 }
      ],
      selection: [],
      visible: false,
      form: {
        id: []
      },
      rules: {
        id: [{ required: true, message: '要分配给客户的资产不能为空', trigger: 'change' }]
      },
      assetTypeList: [],
      assetList: []
    }
  },
  methods: {
    handleSelectionChange (val) {
      this.selection = val
    },
    async deleteMore () {
      this.$confirm('确认后，所有选定的资产将被分配，客户无法访问', `确定要删除${this.selection.length}资产吗?`, {
        confirmButtonText: '是',
        cancelButtonText: '否'
      }).then(async _ => {
        try {
          await Promise.all([
            ...this.selection.map(item => this.$api.deleteCustomerAsset(item.id.id))
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
        try {
          await Promise.all([
            ...this.form.id.map(item => this.$api.postCustomerAsset(this.customerId, item))
          ])
          this.visible = false
          this.getList()
        } catch (error) {
          this.$message.error(error.response.data.message)
        }
      })
    },
    cellClick (row, column) {
      if (column.label !== '操作' && column.type !== 'selection') {
        this.$router.push({ path: `/customers/${this.customerId}/assets/${row.id.id}`, query: { title: row.name } })
      }
    },
    remove (row) {
      this.$confirm('确认后，资产将未分配，客户无法访问', `您确定要取消对'${row.name}'资产的分配吗?`, {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async _ => {
        const res = await this.$api.deleteCustomerAsset(row.id.id)
        if (res.status === 200) {
          this.$message.success('操作成功')
          this.$refs.table.clearSelection()
          this.getList()
        }
      }).catch(() => {})
    },
    async getAssetTypes () {
      const result = await this.$api.getAssetTypes()
      this.assetTypeList = result.data
    },
    async remoteMethod (value) {
      const res = await this.$api.getAssetInfos({
        pageSize: 50,
        page: 0,
        sortProperty: 'name',
        sortOrder: 'ASC',
        type: '',
        textSearch: value
      })
      this.assetList = res.data.data
    },
    async getList (params) {
      this.loading = true
      try {
        const res = await this.$api.getCustomerAssetList(Object.assign({
          page: params ? 0 : this.page - 1,
          pageSize: this.limit,
          sortProperty: 'createdTime'
        }, this.listQuery), this.customerId)
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
    this.getAssetTypes()
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
