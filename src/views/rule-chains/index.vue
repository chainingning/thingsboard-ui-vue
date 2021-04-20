<template>
  <div class="app-container" ref="appContainer" v-resize="mixinResize">
    <div class="icon-container">
      <el-dropdown trigger="click" placement="left-start">
        <wx-button type="primary" icon="el-icon-plus" circle></wx-button>
        <el-dropdown-menu slot="dropdown" class="iconfont">
          <el-dropdown-item icon="icon-guize" @click.native="openDialog('add')">创建新的规则链</el-dropdown-item>
          <el-dropdown-item icon="icon-daoru" @click.native="openDialog('import')">导入规则</el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
      <wx-button v-if="selection.length" type="primary" icon="icon-remove" circle @click="deleteMore"></wx-button>
    </div>
    <div class="filter-container" ref="filterContainer">
      <el-form :model="listQuery" class="filter-container-form" size="medium" :inline="true" @submit.native.prevent>
        <el-form-item>
          <el-input v-model="listQuery.textSearch" placeholder="搜索名称" @keyup.enter.native="getList(listQuery)"></el-input>
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
            <el-button type="text" @click="$router.push({ path: `/rule-chains/${scope.row.id.id}`, query: { title: scope.row.name } })">打开规则链</el-button>
            <el-button type="text" @click="exportRuleChain(scope.row)">导出规则</el-button>
            <el-button v-if="!scope.row.root" type="text" @click="openMessageBox({ type: 'root', params: scope.row })">创建规则链根</el-button>
            <el-button v-if="!scope.row.root" type="text" @click="openMessageBox({ type: 'delete', params: scope.row })">删除规则</el-button>
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
      <el-form ref="form" :model="form" :rules="formRules">
        <!-- 添加规则-->
        <template v-if="tplType === 'add'">
          <el-form-item label="名称" prop="name">
            <el-input v-model="form.name"></el-input>
          </el-form-item>
          <el-form-item prop="debugMode">
            <el-checkbox v-model="form.debugMode">调试模式</el-checkbox>
          </el-form-item>
          <el-form-item label="描述" prop="description">
            <el-input type="textarea" autosize v-model="form.description"></el-input>
          </el-form-item>
        </template>
        <!-- 导入规则 -->
        <template v-else-if="tplType === 'import'">
          <el-form-item label="规则链文件" prop="file">
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
import FileSaver from 'file-saver'
import { getDate } from '@/utils'
export default {
  mixins: [page, resize],
  name: 'RuleChains',
  data () {
    return {
      listQuery: {
        sortOrder: 'DESC',
        textSearch: ''
      },
      list: [],
      listTitle: [
        { property: 'createdTime', label: '创建时间', width: 180, sortable: true },
        { property: 'name', label: '名称', width: 150 },
        { property: 'root', label: '根实体', width: 100 },
        { property: 'btn', label: '操作', width: 250 }
      ],
      selection: [],
      visible: false,
      title: '',
      tplType: '',
      form: {
        name: '',
        debugMode: false,
        description: '',
        file: ''
      },
      formRules: {
        name: [{ required: true, message: '名称不能为空', trigger: 'change' }],
        file: [{ required: true, message: '上传的文件不能为空', trigger: 'change' }]
      },
      info: {}
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
      this.$message.warning('规则链文件只能上传一个文件')
    },
    handleSelectionChange (val) {
      this.selection = val
    },
    openDialog (tplType) {
      this.tplType = tplType
      this.title = tplType === 'add' ? '添加规则' : '导入规则'
      this.visible = true
    },
    async deleteMore () {
      this.$confirm('小心，确认后，所有选定的规则链将被删除，所有相关的数据将变得不可恢复', `确定要删除${this.selection.length}规则链库吗?`, {
        confirmButtonText: '是',
        cancelButtonText: '否'
      }).then(async _ => {
        try {
          await Promise.all([
            ...this.selection.map(item => this.$api.deleteRuleChains(item.id.id))
          ])
          this.$message.success('操作成功')
        } catch (error) {
          console.log(error)
        }
        this.page = 1
        this.getList()
        this.$refs.table.clearSelection()
      }).catch(() => {})
    },
    sortChange ({ order }) {
      const isDesc = order === 'descending'
      this.listQuery.sortOrder = isDesc ? 'DESC' : 'ASC'
      this.getList()
    },
    cellClick (row, column) {
      if (column.label !== '操作' && column.type !== 'selection') {
        this.$router.push({ path: `/rule-chains/${row.id.id}/details`, query: { title: row.name } })
      }
    },
    async exportRuleChain (row) {
      try {
        const result = await Promise.all([
          this.$api.getRuleChainsInfo(row.id.id),
          this.$api.getRuleChainMetadata(row.id.id)
        ])
        const { additionalInfo, name, firstRuleNodeId, root, debugMode, configuration } = result[0].data
        const { firstNodeIndex, nodes, connections, ruleChainConnections } = result[1].data
        const data = JSON.stringify({
          ruleChain: { additionalInfo, name, firstRuleNodeId, root, debugMode, configuration },
          metadata: {
            firstNodeIndex,
            nodes: (nodes || []).map(ele => {
              delete ele.createdTime
              delete ele.id
              delete ele.ruleChainId
              return ele
            }),
            connections,
            ruleChainConnections
          }
        }, null, 2)
        const blob = new Blob([data], { type: '' })
        FileSaver.saveAs(blob, `${row.name}.json`)
      } catch (error) {
        this.$message.error(error.response.data.message)
      }
    },
    openMessageBox ({ type, params }) {
      const title = {
        delete: `确定要删除规则链'${params.name}'吗?`,
        root: '确定要生成规则链根吗?'
      }
      const message = {
        delete: '小心,确认后,规则链和所有相关数据将变得不可恢复',
        root: '确认之后,规则链将变为根规格链,并将处理所有传入的传输消息'
      }
      this.$confirm(message[type], title[type], {
        confirmButtonText: '是',
        cancelButtonText: '否'
      }).then(async _ => {
        try {
          switch (type) {
            case 'delete':
              await this.$api.deleteRuleChains(params.id.id)
              break
            case 'root':
              await this.$api.createRuleChainsRoot(params.id.id)
              break
            default:
              break
          }
          this.$message.success('操作成功')
          this.getList()
          if (type === 'delete') {
            this.$refs.table.clearSelection()
          }
        } catch (error) {
          this.$message.error(error.response.data.message)
        }
      }).catch(() => {})
    },
    submit () {
      this.$refs.form.validate(async valid => {
        if (!valid) return false
        const { name, debugMode, description } = this.form
        const { ruleChain, metadata } = this.form.file
        const isTpl = this.tplType === 'add'
        let params = null
        if (isTpl) {
          params = { name, debugMode, additionalInfo: { description } }
        } else {
          params = ruleChain
        }
        try {
          const result = await this.$api.updateRuleChain(params)
          const ruleChainId = result.data.id
          if (this.tplType === 'import') {
            await this.$api.postRuleChainMetadata({
              ...metadata,
              ruleChainId
            })
          }
          this.$message.success('操作成功')
          this.visible = false
          this.getList()
        } catch (error) {
          this.$message.error(error.response.data.message)
        }
      })
    },
    async getList (params) {
      this.loading = true
      try {
        const result = await this.$api.getRuleChainsList({
          page: params ? 0 : this.page - 1,
          pageSize: this.limit,
          sortProperty: 'createdTime',
          ...this.listQuery
        })
        this.list = result.data.data.map(ele => Object.assign(ele, {
          createdTime: getDate({ timestamp: ele.createdTime })
        }))
        this.total = result.data.totalElements
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
