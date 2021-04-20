<template>
  <div class="app-container" ref="appContainer" v-resize="mixinResize">
    <div class="icon-container">
      <wx-button v-if="selection.length" type="primary" icon="icon-remove" circle @click="deleteMore"></wx-button>
    </div>
    <div class="filter-container" ref="filterContainer">
      <el-form :model="listQuery" class="filter-container-form" size="medium" :inline="true" @submit.native.prevent>
        <el-form-item>
          <el-input v-model="listQuery.textSearch" placeholder="请输入固件名称" @keyup.enter.native="getList()"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getList(listQuery)">查询</el-button>
          <el-button type="primary" @click="openDialog('add')">添加固件</el-button>
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
            <i class="el-icon-delete" title="删除固件" @click="remove(scope.row)"></i>
          </span>
          <span v-else-if="item.property === 'token'">
            <el-button type="text" @click="copy(scope.row, 'token')">复制令牌</el-button>
            <el-button type="text" @click="openDialog('credentials', scope.row)">管理令牌</el-button>
          </span>
          <span v-else-if="item.property === 'url'">
            <el-button type="text" @click="copy(scope.row, 'outUrl')">复制地址</el-button>
          </span>
          <span v-else>{{ scope.row[item.property] | format(item.property) }}</span>
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
    <icloud-dialog :visible.sync="visible" :title="title">
      <el-form v-if="type === 'add'" ref="form" :model="form" :rules="rules">
        <el-form-item label="固件名称" prop="name">
          <el-input placeholder="请输入固件名称" v-model="form.name"></el-input>
        </el-form-item>
        <el-form-item label="固件版本"  prop="version">
          <el-input placeholder="请输入固件版本" v-model="form.version"></el-input>
        </el-form-item>
        <el-form-item label="选择固件" prop="otaFile">
          <el-upload
            class="el-input"
            ref="upload"
            action="#"
            :limit="1"
            :http-request="httpRequest"
            :on-remove="onRemove"
            :on-exceed="handleExceed">
            <wx-button type="primary">上传固件</wx-button>
          </el-upload>
        </el-form-item>
        <el-form-item label="固件描述" prop="description">
          <el-input type="textarea" placeholder="请输入固件描述" v-model="form.description"></el-input>
        </el-form-item>
      </el-form>
      <el-form v-else ref="form" :model="credentialsForm" :rules="credentialsRules">
        <el-form-item label="凭据" prop="credentialsType">
          <el-input v-model="credentialsForm.credentialsType"></el-input>
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
import { getDate, copy, getBase64, dataURItoBlob } from '@/utils'
export default {
  mixins: [page, resize],
  data () {
    return {
      listQuery: {
        textSearch: '',
        sortOrder: 'DESC'
      },
      list: [],
      listTitle: [
        { property: 'createdTime', label: '创建时间', width: 180, sortable: true },
        { property: 'name', label: '固件名称', width: 180 },
        { property: 'version', label: '固件版本', width: 150 },
        { property: 'token', label: 'TOKEN', width: 200 },
        { property: 'url', label: 'URL地址', width: 150 },
        { property: 'description', label: '描述', width: 150 },
        { property: 'btn', label: '操作', width: 180 }
      ],
      selection: [],
      visible: false,
      title: '',
      type: '',
      form: {
        name: '',
        version: '',
        otaFile: '',
        description: ''
      },
      rules: {
        name: [{ required: true, message: '固件名称不能为空', trigger: 'change' }],
        otaFile: [{ required: true, message: '上传固件不能为空', trigger: 'change' }]
      },
      credentialsForm: {
        credentialsType: ''
      },
      credentialsRules: {
        credentialsType: [{ required: true, message: '凭据不能为空', trigger: 'change' }]
      },
      info: null,
      d: null
    }
  },
  methods: {
    handleSelectionChange (val) {
      this.selection = val
    },
    async deleteMore () {
      this.$confirm('小心！确认后固件及其所有相关数据将不可恢复', `确定要删除${this.selection.length}固件吗?`, {
        confirmButtonText: '是',
        cancelButtonText: '否'
      }).then(async _ => {
        try {
          await Promise.all([
            ...this.selection.map(item => this.$api.deleteOta(item.id.id))
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
    openDialog (type, params) {
      this.type = type
      if (type === 'credentials') {
        this.title = '管理令牌'
        this.credentialsForm.credentialsType = params.token
      } else {
        this.title = '添加固件'
      }
      this.visible = true
      this.info = params
    },
    submit () {
      this.$refs.form.validate(async valid => {
        if (!valid) return false
        let params = null
        let apiName = ''
        if (this.type === 'add') {
          const formData = new FormData()
          for (const key in this.form) {
            formData.append(key, this.form[key])
          }
          params = formData
          apiName = 'postOta'
        } else if (this.type === 'credentials') {
          params = { ...this.info, token: this.credentialsForm.credentialsType }
          apiName = 'putOta'
        }
        try {
          await this.$api[apiName](params)
          this.$message.success('操作成功')
          this.visible = false
          this.getList()
        } catch (error) {
          console.log(error)
          this.$message.error('操作失败')
        }
      })
    },
    remove (row) {
      this.$confirm('小心！确认后固件及其所有相关数据将不可恢复', `确定要删除固件'${row.name}'`, {
        confirmButtonText: '是',
        cancelButtonText: '否'
      }).then(async _ => {
        try {
          await this.$api.deleteOta(row.id.id)
          this.$message.success('操作成功')
          if (this.list.length === 1 && this.page > 1) {
            this.page--
          }
          this.getList()
          this.$refs.table.clearSelection()
        } catch (error) {
          this.$message.error(error.response.data.message)
        }
      }).catch(() => {})
    },
    async httpRequest (data) {
      this.form.otaFile = dataURItoBlob(await getBase64(data.file))
      this.$refs.form.clearValidate('otaFile')
    },
    onRemove (file, fileList) {
      this.form.otaFile = ''
    },
    handleExceed (files, fileList) {
      this.$message.warning('固件只能上传一个文件')
    },
    copy (row, type) {
      let msg = ''
      const code = row[type]
      if (type === 'token') {
        msg = '复制令牌成功'
      } else {
        msg = '复制地址成功'
      }
      copy(code)
      this.$message.success(msg)
    },
    sortChange ({ order }) {
      const isDesc = order === 'descending'
      this.listQuery.sortOrder = isDesc ? 'DESC' : 'ASC'
      this.getList()
    },
    async getList (params) {
      this.loading = true
      try {
        const res = await this.$api.getOtas(Object.assign({
          page: params ? 0 : this.page - 1,
          pageSize: this.limit,
          sortProperty: 'createdTime'
        }, this.listQuery))
        this.list = res.data.data
        this.total = res.data.totalElements
      } catch (error) {
        this.$message.error(error.response.data.message)
      }
      this.loading = false
    }
  },
  created () {
    this.getList()
  },
  filters: {
    format (value, property) {
      return property === 'createdTime' ? getDate({ timestamp: value }) : value
    }
  },
  watch: {
    visible (n) {
      if (!n) {
        this.$refs.form.resetFields()
        if (this.type === 'add') {
          this.$refs.upload.clearFiles()
        }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.app-container {
  /deep/ .filter-container-form {
    .el-input__inner {
      width: 550px;
    }
  }
}
</style>
