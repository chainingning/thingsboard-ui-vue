<template>
  <div class="app-container" ref="appContainer" v-resize="mixinResize">
    <div class="icon-container" v-if="!isCustomer">
      <wx-button type="primary" icon="icon-add" circle @click="openDialog('add')"></wx-button>
      <wx-button v-if="selection.length" type="primary" icon="icon-remove" circle @click="deleteMore"></wx-button>
    </div>
    <div class="filter-container" ref="filterContainer">
      <el-form :model="listQuery" class="filter-container-form" size="medium" :inline="true">
        <el-form-item label="实体视图类型">
          <el-select v-model="listQuery.type">
            <el-option label="所有" value=""></el-option>
            <el-option v-for="item in entityViewTypes" :key="item.type" :label="item.type" :value="item.type"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-input placeholder="搜索名称" v-model="listQuery.textSearch" @keyup.enter.native="getList()"></el-input>
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
      <template v-for="item in listTitle">
        <el-table-column
          v-if="isCustomer ? item.property !== 'btn' && item.property !== 'customerTitle' : true"
          :key="item.label"
          :min-width="item.width"
          :label="item.label"
          :sortable="item.sortable"
          :prop="item.property"
          :sort-orders="['ascending', 'descending']"
          show-overflow-tooltip>
          <template slot-scope="scope">
            <div v-if="item.property === 'btn'" >
              <!-- <el-button v-if="scope.row.icon.public" type="text" @click="open(scope.row, 'public')">资产设为公开</el-button> -->
              <el-button v-if="scope.row.icon.allocation" type="text" @click="openDialog('allocation', scope.row)">分配给客户</el-button>
              <el-button v-if="scope.row.icon.cancelAllocation" type="text" @click="open(scope.row, 'allocation')">取消分配客户</el-button>
              <!-- <el-button v-if="scope.row.icon.provide" type="text" @click="open(scope.row, 'private')">资产设为私有</el-button> -->
              <el-button type="text" @click="open(scope.row, 'delete')">删除</el-button>
            </div>
            <span v-else>{{ scope.row[item.property] }}</span>
          </template>
        </el-table-column>
      </template>
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
      :title="title"
      :visible.sync="visible">
      <form-info v-if="type === 'add'" ref="form" @submit="save"></form-info>
      <el-form v-else ref="form" :model="allocationForm" :rules="allocationRules">
        <el-form-item label="客户" prop="id">
          <el-select v-model="allocationForm.id">
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
import { page, resize } from '@/mixins'
import { getDate } from '@/utils'
import { FormInfo } from './components'
export default {
  mixins: [page, resize],
  components: { FormInfo },
  name: 'Entityviews',
  data () {
    return {
      isCustomer: this.$store.getters.userInfo.authority === 'CUSTOMER_USER',
      listQuery: {
        type: '',
        textSearch: '',
        sortOrder: 'DESC'
      },
      entityViewTypes: [],
      list: [],
      listTitle: [
        { property: 'createdTime', label: '创建时间', width: 180, sortable: true },
        { property: 'name', label: '名称', width: 150 },
        { property: 'type', label: '实体视图类型', width: 150 },
        { property: 'customerTitle', label: '所属客户', width: 150 },
        // { property: 'customerIsPublic', label: 'Public', width: 150 },
        { property: 'btn', label: '操作', width: 250 }
      ],
      visible: false,
      type: '',
      title: '',
      allocationForm: {
        id: ''
      },
      allocationRules: {
        id: [{ required: true, message: '客户不能为空', trigget: 'change' }]
      },
      customerList: [],
      typeList: [],
      info: null,
      selection: []
    }
  },
  methods: {
    handleSelectionChange (val) {
      this.selection = val
    },
    async deleteMore () {
      this.$confirm('小心，确认后，所有选定的实体视图将被删除，所有相关的数据将变得不可恢复', `确定要删除${this.selection.length}实体视图吗?`, {
        confirmButtonText: '是',
        cancelButtonText: '否'
      }).then(async _ => {
        try {
          await Promise.all([
            ...this.selection.map(item => this.$api.deleteEntityView(item.id.id))
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
    save () {
      this.visible = false
      this.init()
    },
    open (row, type) {
      const info = {
        public: {
          title: `你确定你想创建公开'${row.name}'实体视图?`,
          msg: '确认后，实体视图 及其所有数据将被公开并被他人访问'
        },
        allocation: {
          title: `你确定要取消对'${row.name}'实体视图的分配吗?`,
          msg: '确认后，实体视图将未分配，客户无法访问'
        },
        private: {
          title: `你确定你想创建私有'${row.name}'实体视图?`,
          msg: '确认后，实体视图及其所有数据将被私有化，无法被他人访问'
        },
        delete: {
          title: `确定要删除实体视图'${row.name}'?`,
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
        const res = await this.$api[apiName](row.id.id)
        if (res.status === 200) {
          if (type === 'delete') {
            this.$refs.table.clearSelection()
          }
          this.$message.success('操作成功')
          this.getList()
        }
      }).catch(() => {})
    },
    submit () {
      if (this.type === 'add') {
        this.$refs.form.submit()
      } else {
        this.$refs.form.validate(async valid => {
          if (!valid) return false
          const res = await this.$api.postCustomerEntityView(this.allocationForm.id, this.info.id.id)
          if (res.status === 200) {
            this.$message.success('分配成功')
            this.visible = false
            this.init()
          }
        })
      }
    },
    openDialog (type, info) {
      this.visible = true
      this.type = type
      this.info = info
      this.title = type === 'add' ? '添加实体视图' : '将实体视图分配给客户'
    },
    cellClick (row, column) {
      if (column.label !== '操作') {
        this.$router.push({ path: `/entity-views/${row.id.id}`, query: { title: row.name } })
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
    async getEntityViewTypes () {
      const result = await this.$api.getEntityViewTypes()
      this.entityViewTypes = result.data
    },
    async getList (params) {
      this.loading = true
      try {
        const customerId = this.$store.getters.userInfo.customerId.id
        const apiName = this.isCustomer ? 'getCustomerEntityView' : 'getEntityViewList'
        const res = await this.$api[apiName](Object.assign({
          page: params ? 0 : this.page - 1,
          pageSize: this.limit,
          sortProperty: 'createdTime'
        }, this.listQuery), this.isCustomer ? customerId : null)
        this.list = res.data.data.map(ele => {
          const { customerIsPublic, customerTitle } = ele
          return {
            ...ele,
            createdTime: getDate({ timestamp: ele.createdTime }),
            icon: {
              public: !customerIsPublic && !customerTitle,
              allocation: !customerTitle,
              cancelAllocation: !customerIsPublic && customerTitle,
              provide: customerIsPublic
            }
          }
        })
        this.total = res.data.totalElements
      } catch (error) {
        console.log(error)
        this.loading = false
      }
      this.loading = false
    },
    init () {
      this.getList()
      this.getEntityViewTypes()
      if (!this.isCustomer) {
        this.getCustomersList()
      }
    }
  },
  activated () {
    this.init()
    this.$refs.table.clearSelection()
  }
}
</script>
