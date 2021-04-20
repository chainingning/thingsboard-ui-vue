<template>
  <div class="app-container" ref="appContainer" v-resize="mixinResize">
    <div class="icon-container" v-if="!isCustomer">
      <el-dropdown trigger="click" placement="left-start">
        <wx-button type="primary" icon="el-icon-plus" circle></wx-button>
        <el-dropdown-menu slot="dropdown" class="iconfont">
          <el-dropdown-item icon="icon-guize" @click.native="openDialog('add')">创建新的应用库</el-dropdown-item>
          <el-dropdown-item icon="icon-daoru" @click.native="openDialog('import')">导入应用库</el-dropdown-item>
        </el-dropdown-menu>
        <wx-button v-if="selection.length" type="primary" icon="icon-remove" circle @click="deleteMore"></wx-button>
      </el-dropdown>
    </div>
    <div class="filter-container" ref="filterContainer">
      <el-form :model="listQuery" class="filter-container-form" size="medium" :inline="true" @submit.native.prevent>
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
      <template v-for="item in listTitle">
        <el-table-column
          v-if="isCustomer ? item.property !== 'customerName' : true"
          :key="item.label"
          :min-width="item.width"
          :label="item.label"
          :sortable="item.sortable"
          :prop="item.property"
          :sort-orders="['ascending', 'descending']"
          show-overflow-tooltip>
          <template slot-scope="scope">
            <span v-if="item.property === 'btn'" >
              <el-button type="text" @click="openDetails(scope.row)">打开</el-button>
              <template v-if="!isCustomer">
                <el-button type="text" @click="exportDashboard(scope.row)">导出</el-button>
                <!-- <el-button v-if="!scope.row.private" type="text" @click="publicLink(scope.row)">设为公开</el-button> -->
                <el-button v-if="scope.row.private" type="text" @click="open(scope.row, 'private')">设为私有</el-button>
                <el-button type="text" @click="openDialog('manage', scope.row)">管理已分配的客户</el-button>
                <el-button type="text" @click="open(scope.row, 'remove')">删除</el-button>
              </template>
            </span>
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
      <el-form ref="form" :model="form" :rules="rules">
        <!-- 添加应用 -->
        <template v-if="tplType === 'add'">
          <el-form-item label="标题" prop="title">
            <el-input v-model="form.title"></el-input>
          </el-form-item>
          <el-form-item label="描述" prop="description">
            <el-input type="textarea" autosize v-model="form.description"></el-input>
          </el-form-item>
        </template>
        <!-- 管理已分配的客户 -->
        <template v-else-if="tplType === 'manage'">
          <el-form-item label="已分配的客户" prop="id">
            <el-select multiple filterable v-model="form.id">
              <el-option
                v-for="item in customerList"
                :key="item.id.id"
                :label="item.title"
                :value="item.id.id" />
            </el-select>
          </el-form-item>
        </template>
        <!-- 应用库导入 -->
        <template v-else-if="tplType === 'import'">
          <el-form-item label="应用库文件" prop="file">
            <el-upload
              class="el-input"
              ref="upload"
              action="#"
              accept=".json"
              drag
              :limit="1"
              :http-request="httpRequest"
              :on-remove="onRemove"
              :on-exceed="handleExceed">
              <i class="el-icon-upload"></i>
              <div class="el-upload__text">拖动一个JSON文件或者单击以选择要上传的文件</div>
            </el-upload>
          </el-form-item>
        </template>
      </el-form>
      <div class="icloud-dialog-footer" slot="footer">
        <wx-button type="primary" @click="submit">确定</wx-button>
        <wx-button @click="visible = false">取消</wx-button>
      </div>
    </icloud-dialog>
    <icloud-dialog title="应用现已公布" width="800px" :visible.sync="publicVisble">
      <div class="link">
        <span>应用库现已公布你的应用'{{publicInfo.name}}'已被公开，可通过如下<el-button
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
import { page, resize } from '@/mixins'
import { getDate } from '@/utils'
import FileSaver from 'file-saver'
export default {
  mixins: [page, resize],
  name: 'Dashboards',
  data () {
    return {
      isCustomer: this.$store.getters.userInfo.authority === 'CUSTOMER_USER',
      listQuery: {
        sortOrder: 'DESC',
        textSearch: ''
      },
      list: [],
      listTitle: [
        { property: 'createdTime', label: '创建时间', width: 180, sortable: true },
        { property: 'title', label: '标题', width: 150 },
        { property: 'customerName', label: '所属客户', width: 150 },
        // { property: 'private', label: '公共', width: 100 },
        { property: 'btn', label: '操作', width: 400 }
      ],
      selection: [],
      info: null,
      visible: false,
      title: '',
      tplType: '',
      form: {
        title: '',
        description: '',
        id: [],
        file: ''
      },
      rules: {
        title: [{ required: true, message: '标题不能为空', trigger: 'change' }],
        file: [{ required: true, message: '上传的文件不能为空', trigger: 'change' }]
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
    httpRequest (data) {
      const isJson = data.file.type === 'application/json'
      if (isJson) {
        const reader = new FileReader()
        reader.onload = evt => {
          try {
            this.form.file = JSON.parse(evt.target.result)
          } catch (error) {
            this.$message.error(String(error))
            this.$refs.upload.clearFiles()
          }
        }
        reader.readAsText(data.file)
      } else {
        this.$message.error('应用库只能上传JSON文件')
      }
    },
    onRemove (file, fileList) {
      this.form.file = ''
    },
    handleExceed (files, fileList) {
      this.$message.warning('应用库只能上传一个文件')
    },
    handleSelectionChange (val) {
      this.selection = val
    },
    async deleteMore () {
      this.$confirm('小心！确认后所有选定的应用库将被删除，所有相关数据将不可恢复', `确定要删除${this.selection.length}应用库吗?`, {
        confirmButtonText: '是',
        cancelButtonText: '否'
      }).then(async _ => {
        try {
          await Promise.all([
            ...this.selection.map(item => this.$api.deleteDashboard(item.id.id))
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
    submit () {
      this.$refs.form.validate(async valid => {
        if (!valid) return false
        try {
          switch (this.tplType) {
            case 'add':
              await this.$api.postDashboard({
                title: this.form.title,
                configuration: {
                  description: this.form.description,
                  timewindow: {
                    aggregation: {
                      limit: 10,
                      type: 'NONE'
                    },
                    displayValue: '',
                    hideAggInterval: false,
                    hideAggregation: false,
                    hideInterval: false,
                    realtime: {
                      interval: 1000,
                      timewindowMs: 60000
                    },
                    selectedTab: 0
                  }
                }
              })
              break
            case 'manage':
              await this.$api.postDashboardCustomers(this.info.id.id, this.form.id)
              break
            case 'import':
              // console.log('import', this.form.file)
              await this.checkDashboard(this.form.file)
              // await this.$api.postDashboard(this.form.file)
              return
              // break
            default:
              break
          }
          this.$message.success('操作成功')
          this.visible = false
          this.getList()
        } catch (error) {
          this.$message.error(error.response.data.message)
        }
      })
    },
    async checkDashboard (dashboard) {
      if (!dashboard.name || !dashboard.title || !dashboard.configuration) {
        this.$message.error('导入格式错误')
        return
      }
      // const { entityAliases } = dashboard.configuration
      await this.$api.postDashboard(dashboard)
      this.$message.success('操作成功')
      this.visible = false
      this.getList()
    },
    openDetails (row) {
      this.$router.push({ path: `/dashboards/${row.id.id}`, query: { title: row.title } })
    },
    async exportDashboard (row) {
      try {
        const res = await this.$api.getDashboardInfos(row.id.id)
        const data = JSON.stringify({
          title: res.data.title,
          configuration: res.data.configuration,
          name: res.data.name
        }, null, 2)
        const blob = new Blob([data], { type: '' })
        FileSaver.saveAs(blob, `${row.title}.json`)
      } catch (error) {
        this.$message.error(error.response.data.message)
      }
    },
    openLink () {
      window.open(this.publicInfo.link)
    },
    open (row, type) {
      const info = {
        private: {
          tipMsg: `您确定要将应用库'${row.name}'设为私有吗？`,
          msg: '确认后，应用库将被设为私有，不能被其他人访问。',
          apiName: 'deletePublicDashboard'
        },
        remove: {
          tipMsg: `您确定要删除应用库'${row.name}'吗？`,
          msg: '小心！确认后应用库及其所有相关数据将不可恢复。',
          apiName: 'deleteDashboard'
        }
      }
      this.$confirm(info[type].msg, info[type].tipMsg, {
        confirmButtonText: '是',
        cancelButtonText: '否'
      }).then(async _ => {
        try {
          await this.$api[info[type].apiName](row.id.id)
          this.$message.success('操作成功')
          if (type === 'remove' && this.list.length === 1 && this.page > 1) {
            this.page--
            this.$refs.table.clearSelection()
          }
          this.getList()
        } catch (error) {
          this.$message.error(error.response.data.message)
        }
      }).catch(() => {})
    },
    async publicLink (row) {
      try {
        const res = await this.$api.postPublicDashboard(row.id.id)
        const publicInfo = res.data.assignedCustomers.find(item => item.public)
        const publicId = publicInfo.customerId.id
        this.publicInfo = {
          name: row.title,
          link: `${this.$ip('BASE_URL')}/#/dashboard/${row.id.id}?publicId=${publicId}`
        }
        this.publicVisble = true
      } catch (error) {
        this.$message.error(error.response.data.message)
      }
    },
    openDialog (tplType, info) {
      this.info = info
      this.tplType = tplType
      const { assignedCustomers } = this.info || {}
      switch (tplType) {
        case 'add':
          this.title = '添加应用库'
          break
        case 'manage':
          this.title = '将应用库分配给客户'
          this.form.id = assignedCustomers && assignedCustomers.map(ele => ele.customerId.id)
          break
        case 'import':
          this.title = '导入应用库'
          break
        default:
          break
      }
      this.visible = true
    },
    sortChange ({ order }) {
      const isDesc = order === 'descending'
      this.listQuery.sortOrder = isDesc ? 'DESC' : 'ASC'
      this.getList()
    },
    cellClick (row, column) {
      if (column.label !== '操作' && column.type !== 'selection') {
        this.$router.push({ path: `/dashboards/${row.id.id}/details`, query: { title: row.title } })
      }
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
    async getList (params) {
      this.loading = true
      const customerId = this.$store.getters.userInfo.customerId.id
      const apiName = this.isCustomer ? 'getCustomerDashboardList' : 'getDashboardsList'
      const res = await this.$api[apiName]({
        page: params ? 0 : this.page - 1,
        pageSize: this.limit,
        sortProperty: 'createdTime',
        ...this.listQuery
      }, this.isCustomer ? customerId : null)
      this.list = res.data.data.map(ele => {
        const isPrivate = !(!ele.assignedCustomers || !ele.assignedCustomers.some(item => item.public === true))
        const customerName = (ele.assignedCustomers || []).filter(ele => ele.public === false).map(ele => ele.title).join(',')
        return {
          ...ele,
          createdTime: getDate({ timestamp: ele.createdTime }),
          customerName,
          private: isPrivate
        }
      })
      this.total = res.data.totalElements
      this.loading = false
    }
  },
  activated () {
    this.getList()
    if (!this.isCustomer) {
      this.getCustomersList()
    }
    this.$refs.table.clearSelection()
  },
  watch: {
    visible (n) {
      if (!n) {
        this.$refs.form.resetFields()
        if (this.tplType === 'import') {
          this.$refs.upload.clearFiles()
        }
      }
    },
    publicVisble (n) {
      if (!n) {
        this.getList()
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
