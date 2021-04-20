<template>
  <div class="app-container" ref="appContainer" v-resize="mixinResize">
    <div class="icon-container">
      <el-dropdown trigger="click" placement="left-start">
        <wx-button type="primary" icon="el-icon-plus" circle></wx-button>
        <el-dropdown-menu slot="dropdown" class="iconfont">
          <el-dropdown-item icon="icon-guize" @click.native="openDialog('add')">创建新的部件包</el-dropdown-item>
          <el-dropdown-item icon="icon-daoru" @click.native="openDialog('import')">导入部件包</el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
      <wx-button v-if="selection.length" type="primary" icon="icon-remove" circle @click="deleteMore"></wx-button>
    </div>
    <div class="filter-container" ref="filterContainer">
      <el-form :model="listQuery" class="filter-container-form" size="medium" :inline="true" @submit.native.prevent>
        <el-form-item>
          <el-input v-model="listQuery.textSearch" placeholder="搜索部件" @keyup.enter.native="getList()"></el-input>
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
      :height="mixinHeight - 20"
      :class="['configurationTable', {afterRenderClass: mixinShowAfterRenderClass}]"
      @cell-click="cellClick"
      @selection-change="handleSelectionChange"
      :row-key="row => row.id.id">
      <el-table-column
        type="selection"
        width="90"
        :reserve-selection="true"
        :selectable="row => !row.isSystem">
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
            <el-button type="text" @click="$router.push({ path: `/widgets-bundles/${scope.row.id.id}`, query: { title: scope.row.title } })">打开</el-button>
            <el-button type="text" @click="exportWidgetsBundle(scope.row)">导出</el-button>
            <el-button v-if="!scope.row.isSystem" type="text" @click="remove(scope.row)">删除</el-button>
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
      :title="title"
      :visible.sync="visible">
      <el-form ref="form" :model="form" :rules="rules" @submit.native.prevent>
        <!-- 添加部件包 -->
        <template v-if="tplType === 'add'">
          <el-form-item label="标题" prop="title">
            <el-input v-model="form.title"></el-input>
          </el-form-item>
        </template>
        <!-- 导入部件包 -->
        <template v-else-if="tplType === 'import'">
          <el-form-item label="部件包文件" prop="file">
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
  </div>
</template>

<script>
import { page, resize } from '@/mixins'
import { getDate } from '@/utils'
import FileSaver from 'file-saver'
export default {
  mixins: [page, resize],
  name: 'WidgetsBundles',
  data () {
    return {
      listQuery: {
        sortOrder: 'DESC',
        textSearch: ''
      },
      list: [],
      listTitle: [
        { property: 'createdTime', label: '创建时间', width: 180, sortable: true },
        { property: 'title', label: '标题', width: 150 },
        { property: 'isSystem', label: '系统', width: 150 },
        { property: 'btn', label: '操作', width: 250 }
      ],
      selection: [],
      visible: false,
      title: '',
      tplType: '',
      form: {
        title: '',
        file: ''
      },
      rules: {
        title: [{ required: true, message: '标题不能为空', trigger: 'change' }],
        file: [{ required: true, message: '上传的文件不能为空', trigger: 'change' }]
      },
      sysId: this.$store.getters.userInfo.tenantId.id
    }
  },
  methods: {
    openDialog (tplType) {
      this.tplType = tplType
      this.title = tplType === 'add' ? '添加部件包' : '导入部件包'
      this.visible = true
    },
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
      this.$message.warning('部件包只能上传一个文件')
    },
    handleSelectionChange (val) {
      this.selection = val
    },
    async deleteMore () {
      this.$confirm('小心！确认后所有选定的部件包将被删除，所有相关数据将不可恢复', `确定要删除${this.selection.length}部件包吗?`, {
        confirmButtonText: '是',
        cancelButtonText: '否'
      }).then(async _ => {
        try {
          await Promise.all([
            ...this.selection.map(item => this.$api.deleteWidgetsBundle(item.id.id))
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
      try {
        this.$refs.form.validate(async valid => {
          if (!valid) return false
          const isTpl = this.tplType === 'add'
          if (isTpl) {
            await this.$api.postWidgetsBundle(this.form)
          } else {
            const { widgetsBundle, widgetTypes } = this.form.file
            const res = await this.$api.postWidgetsBundle(widgetsBundle)
            const bundleAlias = res.data.alias
            await Promise.all([
              ...widgetTypes.map(item => this.$api.postWidgetType({
                ...item,
                bundleAlias
              }))
            ])
          }
          this.$message.success('操作成功')
          this.visible = false
          this.getList()
        })
      } catch (error) {
        this.$message.error(error.response.data.message)
      }
    },
    remove (row) {
      this.$confirm('小心！确认后，部件包和所有相关数据将不可恢复。', `您确定要删除部件包 '${row.title}'吗？`, {
        confirmButtonText: '是',
        cancelButtonText: '否'
      }).then(async _ => {
        try {
          await this.$api.deleteWidgetsBundle(row.id.id)
          this.$message.success('操作成功')
          if (this.list.length === 1 && this.page > 1) {
            this.page--
          }
          this.$refs.table.clearSelection()
          this.getList()
        } catch (error) {
          this.$message.error(error.response.data.message)
        }
      }).catch(() => {})
    },
    async exportWidgetsBundle (row) {
      try {
        const result = await Promise.all([
          this.$api.getWidgetsBundleInfos(row.id.id),
          this.$api.getWidgetTypes({
            isSystem: row.isSystem,
            bundleAlias: row.alias
          })
        ])
        const { alias, title, image } = result[0].data
        const widgetTypes = (result[1].data || []).map(ele => {
          return {
            alias: ele.alias,
            name: ele.name,
            descriptor: ele.descriptor
          }
        })
        const data = JSON.stringify({
          widgetsBundle: {
            alias,
            title,
            image
          },
          widgetTypes
        }, null, 2)
        const blob = new Blob([data], { type: '' })
        FileSaver.saveAs(blob, `${title}.json`)
      } catch (error) {
        this.$message.error(error.response.data.message)
      }
    },
    sortChange ({ order }) {
      const isDesc = order === 'descending'
      this.listQuery.sortOrder = isDesc ? 'DESC' : 'ASC'
      this.getList()
    },
    cellClick (row, column) {
      if (column.label !== '操作' && column.type !== 'selection') {
        this.$router.push({ path: `/widgets-bundles/${row.id.id}/details`, query: { title: row.title } })
      }
    },
    async getList (params) {
      this.loading = true
      try {
        const res = await this.$api.getWidgetsBundlesList({
          page: params ? 0 : this.page - 1,
          pageSize: this.limit,
          sortProperty: 'createdTime',
          ...this.listQuery
        })
        this.list = res.data.data.map(ele => {
          return {
            ...ele,
            isSystem: this.sysId !== ele.tenantId.id,
            createdTime: getDate({ timestamp: ele.createdTime })
          }
        })
        this.total = res.data.totalElements
      } catch (error) {
        this.$message.error(error.response.data.message)
      }
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
        if (this.tplType === 'import') {
          this.$refs.upload.clearFiles()
        }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
