<template>
  <div class="app-container" ref="appContainer" v-resize="mixinResize">
    <div class="icon-container" v-if="!isCustomer">
      <el-dropdown trigger="click" placement="left-start">
        <wx-button type="primary" icon="el-icon-plus" circle></wx-button>
        <el-dropdown-menu slot="dropdown" class="iconfont">
          <el-dropdown-item icon="icon-guize" @click.native="openDialog('add')">创建新的资产</el-dropdown-item>
          <el-dropdown-item icon="icon-daoru" @click.native="openDialog('import')">导入资产</el-dropdown-item>
          <el-dropdown-item icon="icon-daoru" @click.native="exportTable()">导出资产</el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
      <wx-button v-if="selection.length" type="primary" icon="icon-remove" circle @click="deleteMore"></wx-button>
    </div>
    <div class="filter-container" ref="filterContainer">
      <el-form :model="listQuery" class="filter-container-form" size="medium" :inline="true">
        <el-form-item label="资产类型">
          <el-select v-model="listQuery.type" filterable>
            <el-option label="所有" value=""></el-option>
            <el-option v-for="item in assetTypes" :key="item.type" :label="item.type" :value="item.type"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-input placeholder="搜索资产名称" v-model="listQuery.textSearch" @keyup.enter.native="getList()"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getList()">查询</el-button>
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
            <span v-if="item.property === 'btn'">
              <!-- <el-button v-if="scope.row.icon.public" type="text" @click="open(scope.row, 'public')">资产设为公开</el-button> -->
              <el-button v-if="scope.row.icon.allocation" type="text" @click="openDialog('allocation', scope.row)">分配给客户</el-button>
              <el-button v-if="scope.row.icon.cancelAllocation" type="text" @click="open(scope.row, 'allocation')">取消分配客户</el-button>
              <!-- <el-button v-if="scope.row.icon.provide" type="text" @click="open(scope.row, 'private')">资产设为私有</el-button> -->
              <el-button type="text" @click="open(scope.row, 'delete')">删除资产</el-button>
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
    <icloud-dialog :title="title" :width="width" :visible.sync="visible">
      <el-form v-if="type === 'add'" ref="form" :model="form" :rules="rules">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name"></el-input>
        </el-form-item>
        <el-form-item label="资产类型" prop="type">
          <el-select v-model="form.type" allow-create filterable>
            <el-option v-for="item in assetTypes" :key="item.type" :label="item.type" :value="item.type"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="标签" prop="label">
          <el-input show-word-limit maxlength="255" v-model="form.label"></el-input>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input type="textarea" autosize v-model="form.description"></el-input>
        </el-form-item>
      </el-form>
      <el-form v-else-if="type === 'allocation'" ref="form" :model="allocationForm" :rules="allocationRules">
        <el-form-item label="客户" prop="id">
          <el-select v-model="allocationForm.id">
            <el-option v-for="item in customerList" :key="item.id.id" :label="item.name" :value="item.id.id"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <el-form v-else-if="type === 'import'" ref="form" :model="importForm" :rules="importRules">
        <el-steps direction="vertical" :active="active" finish-status="success">
          <el-step title="选择文件">
            <template slot="description">
              <el-form-item label="资产文件" prop="file" v-show="active === 0">
                <el-upload
                  class="el-input"
                  ref="upload"
                  action="#"
                  accept=".csv"
                  drag
                  :limit="1"
                  :http-request="httpRequest"
                  :on-remove="onRemove"
                  :on-exceed="handleExceed">
                  <i class="el-icon-upload"></i>
                  <div class="el-upload__text">拖动一个CSV文件或者单击以选择要上传的文件</div>
                </el-upload>
                <el-button size="mini" type="primary" @click="downloadTemplate">下载CSV模板</el-button>
              </el-form-item>
            </template>
          </el-step>
          <el-step title="导入配置">
            <div slot="description" v-show="active === 1">
              <el-form-item label="CSV 分隔符" prop="delimiter">
                <el-select v-model="importForm.delimiter">
                  <el-option label="," value=","></el-option>
                  <el-option label=";" value=";"></el-option>
                  <el-option label="|" value="|"></el-option>
                  <el-option label="Tab" value="Tab"></el-option>
                </el-select>
              </el-form-item>
              <el-form-item prop="lineName">
                <el-checkbox v-model="importForm.lineName">第一行包含列名</el-checkbox>
              </el-form-item>
              <el-form-item prop="updateAttrAndTelemetry">
                <el-checkbox v-model="importForm.updateAttrAndTelemetry">更新属性/遥测</el-checkbox>
              </el-form-item>
            </div>
          </el-step>
          <el-step title="选择列类型">
            <div slot="description" v-show="active === 2">
              <el-table :data="lineData">
                <el-table-column type="index">
                </el-table-column>
                <el-table-column
                  v-for="(item, index) in lineTilte"
                  :key="index"
                  :min-width="item.width"
                  :label="item.label"
                  show-overflow-tooltip>
                  <template slot-scope="scope">
                    <span v-if="item.property === 'value'">{{ scope.row[item.property] }}</span>
                    <el-select
                      v-else-if="item.property === 'type'"
                      v-model="scope.row.type"
                      @change="columnTypeChange">
                      <el-option
                        v-for="item in columnType"
                        :key="item.label"
                        :label="item.label"
                        :value="item.value"
                        :disabled="columnDisabled.includes(item.value)"></el-option>
                    </el-select>
                    <template v-else-if="item.property === 'key'">
                      <el-input
                        v-if="scope.row.type === 'server attribute' || scope.row.type === 'timeseries'"
                        v-model="scope.row.key"
                        :class="scope.row.key !== '' ? '' : 'is-error'"></el-input>
                    </template>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-step>
          <el-step title="创建新实体"></el-step>
          <el-step title="完成">
            <div slot="description" v-show="active === 4">{{msg}}</div>
          </el-step>
        </el-steps>
      </el-form>
      <div slot="footer" class="icloud-dialog-footer">
        <template v-if="type === 'import'">
          <wx-button v-if="active !== 0 && active !== 3 && active !== 4" type="primary" @click="back">上一步</wx-button>
          <wx-button v-if="active !== 4 && active !== 3" type="primary" @click="next">下一步</wx-button>
        </template>
        <wx-button v-if="(type === 'import' && active === 4) || (type !== 'import')" type="primary" @click="submit">确定</wx-button>
        <wx-button v-if="(type === 'import' && active !== 3 && active !== 4) || (type !== 'import')" @click="visible = false">取消</wx-button>
      </div>
    </icloud-dialog>
  </div>
</template>

<script>
import { page, resize } from '@/mixins'
import { getDate, exportTable } from '@/utils'
import FileSaver from 'file-saver'
export default {
  mixins: [page, resize],
  name: 'Assets',
  data () {
    return {
      isCustomer: this.$store.getters.userInfo.authority === 'CUSTOMER_USER',
      listQuery: {
        type: '',
        textSearch: '',
        sortOrder: 'DESC'
      },
      assetTypes: [],
      list: [],
      listTitle: [
        { property: 'createdTime', label: '创建时间', width: 180, sortable: true },
        { property: 'name', label: '名称', width: 150 },
        { property: 'type', label: '资产类型', width: 150 },
        { property: 'label', label: '标签', width: 150 },
        { property: 'customerTitle', label: '所属客户', width: 150 },
        // { property: 'customerIsPublic', label: '公开', width: 150 },
        { property: 'btn', label: '操作', width: 450 }
      ],
      visible: false,
      type: '',
      title: '',
      width: '',
      form: {
        name: '',
        type: '',
        label: '',
        description: ''
      },
      rules: {
        name: [{ required: true, message: '名称不能为空', trigger: 'change' }],
        type: [{ required: true, message: '资产类型不能为空', trigger: 'change' }]
      },
      allocationForm: {
        id: ''
      },
      allocationRules: {
        id: [{ required: true, message: '客户不能为空', trigget: 'change' }]
      },
      customerList: [],
      info: null,
      selection: [],
      importForm: {
        file: [],
        delimiter: ',',
        lineName: true,
        updateAttrAndTelemetry: true
      },
      importRules: {
        file: [{ required: true, message: '上传的文件不能为空', trigger: 'change' }],
        delimiter: [{ required: true, message: 'CSV分隔符不能为空', trigger: 'change' }]
      },
      active: 0,
      lineTilte: [
        { property: 'value', label: '示例值数据', width: 150 },
        { property: 'type', label: '列类型', width: 150 },
        { property: 'key', label: '属性/遥测键', width: 150 }
      ],
      lineData: [],
      columnType: [
        { label: '名称', value: 'name', isDisabled: true },
        { label: '类型', value: 'type', isDisabled: true },
        { label: '标签', value: 'label', isDisabled: true },
        { label: '描述', value: 'description', isDisabled: true },
        { label: '服务端属性', value: 'server attribute' },
        { label: '时间序列', value: 'timeseries' }
      ],
      columnDisabled: [],
      msg: ''
    }
  },
  methods: {
    async exportTable () {
      const pageSize = 1000
      const apiArr = new Array(parseInt(this.total / pageSize) + 1).fill('')
      const customerId = this.$store.getters.userInfo.customerId.id
      const apiName = this.isCustomer ? 'getCustomerAssetList' : 'getAssetInfos'
      const params = Object.assign({
        sortProperty: 'createdTime'
      }, this.listQuery)
      for (const key in params) {
        if (params[key] === '') {
          delete params[key]
        }
      }
      const result = await Promise.all([
        ...apiArr.map((ele, page) => this.$api[apiName]({
          ...params,
          page,
          pageSize
        }, this.isCustomer ? customerId : null))
      ])
      const list = []
      result.forEach(item => {
        item.data.data.forEach(row => {
          const { createdTime, name, type, label, customerTitle } = row
          list.push({
            createdTime: getDate({ timestamp: createdTime }),
            id: row.id.id,
            name,
            type,
            label,
            customerTitle
          })
        })
      })
      const tHeader = ['创建时间', '资产ID', '名称', '资产类型', '标签', '所属客户']
      const filterVal = ['createdTime', 'id', 'name', 'type', 'label', 'customerTitle']
      exportTable(tHeader, filterVal, list, `资产 ${new Date().getTime()}`)
    },
    downloadTemplate () {
      const data = '名称,类型,标签,共享属性1,服务器属性1,inactivityTimeout,温度,湿度,PM2.5,CO2,PM10,风向,风速,SO2,NO2,CO,O3,积水深度,积雪厚度,结冰厚度,大气压,露点,结霜概率,电量,机位状态,雨量,水温,电导率,氨氮,溶解氧,PH,浊度,使用状态,电压,电流,开关状态,液位,流量'
      const blob = new Blob([`\uFEFF${data}`], { type: 'text/plain,charset=utf-8' })
      FileSaver.saveAs(blob, '资产导入模板.csv')
    },
    columnTypeChange (value) {
      this.columnDisabled = []
      this.lineData.forEach(item => {
        const isDisabled = this.columnType.filter(row => row.value === item.type)[0].isDisabled
        if (isDisabled) {
          this.columnDisabled.push(item.type)
        }
      })
    },
    back () {
      this.active--
      if (this.active < 0) {
        this.active = 0
      }
    },
    async next () {
      this.active++
      if (this.active > 4) {
        this.active = 4
      }
      const typeList = ['name', 'type', 'label', 'description']
      const msgNum = [0, 0, 0]
      switch (this.active) {
        case 1:
          if (!this.importForm.file.length) {
            this.$refs.form.validate(valid => {
              this.active--
              if (!valid) return false
            })
          }
          break
        case 2:
          this.lineData = this.importForm.file[0].map((item, index) => {
            const isType = this.columnType.map(item => item.value).includes(item.toLowerCase()) && this.importForm.lineName
            return {
              value: this.importForm.file[this.importForm.lineName ? 1 : 0][index].toLowerCase(),
              type: isType ? item.toLowerCase() : 'server attribute',
              key: this.importForm.lineName ? item : ''
            }
          })
          this.columnTypeChange()
          break
        case 3:
          for (let i = 0; i < this.importForm.file.length; i++) {
            if (this.importForm.lineName && i === 0) {
              continue
            }
            const params = {
              serverAttr: {},
              timeseries: {}
            }
            this.lineData.forEach((item, index) => {
              if (typeList.includes(item.type)) {
                params[item.type] = this.importForm.file[i][index].replace(/\r/g, '')
              }
              if (item.type === 'server attribute') {
                if (this.importForm.file[i][index].replace(/^\s+|\s+$/g, '') !== '') {
                  params.serverAttr[item.key] = this.importForm.file[i][index].replace(/\r/g, '')
                }
              }
              if (item.type === 'timeseries') {
                if (this.importForm.file[i][index].replace(/^\s+|\s+$/g, '') !== '') {
                  params.timeseries[item.key] = this.importForm.file[i][index].replace(/\r/g, '')
                }
              }
            })
            if (!params.name || !params.type) {
              this.active = 2
              continue
            }
            let result = null
            const _params = {
              name: params.name,
              label: params.label,
              type: params.type
            }
            if (params.description) {
              _params.additionalInfo = {
                description: params.description
              }
            }
            try {
              result = await this.$api.postAsset(_params)
              msgNum[0] += 1
            } catch (error) {
              if (this.importForm.updateAttrAndTelemetry) {
                result = await this.$api.getTenantAssets({
                  assetName: params.name
                })
                await this.$api.postAsset({
                  ...result.data,
                  ..._params
                })
                msgNum[1] += 1
              } else {
                msgNum[2] += 1
                continue
              }
            }
            if (JSON.stringify(params.serverAttr) !== '{}') {
              await this.$api.postPluginsTelemetry(
                'ASSET',
                result.data.id.id,
                { ...params.serverAttr },
                'SERVER_SCOPE'
              )
            }
            if (JSON.stringify(params.timeseries) !== '{}') {
              await this.$api.postPluginsTelemetryTimeseries(
                'ASSET',
                result.data.id.id,
                { ...params.timeseries }
              )
            }
            if (this.importForm.file.length - 1 === i) {
              this.active = 4
            }
          }
          if (msgNum[0]) {
            this.msg += `已成功添加${msgNum[0]}个实体\n`
          }
          if (msgNum[1]) {
            this.msg += `已成功更新${msgNum[1]}个实体\n`
          }
          if (msgNum[2]) {
            this.msg += `${msgNum[2]}个实体已出错`
          }
          this.getList()
          break
        default:
          break
      }
    },
    httpRequest (data) {
      const isCSV = data.file.type === 'application/vnd.ms-excel'
      if (isCSV) {
        const reader = new FileReader()
        reader.onload = evt => {
          try {
            this.$refs.form.resetFields()
            this.importForm.file = evt.target.result.split(/\n/).filter(item => item).map(item => item.split(','))
          } catch (error) {
            this.$message.error(String(error))
            this.$refs.upload.clearFiles()
          }
        }
        reader.readAsText(data.file, 'gb2312')
      } else {
        this.$message.error('应用库只能上传CSV文件')
        this.$refs.upload.clearFiles()
      }
    },
    onRemove (file, fileList) {
      this.importForm.file = []
    },
    handleExceed (files, fileList) {
      this.$message.warning('资产文件只能上传一个文件')
    },
    handleSelectionChange (val) {
      this.selection = val
    },
    async deleteMore () {
      this.$confirm('小心！确认后所有选定的资产将被删除，所有相关数据将不可恢复', `确定要删除${this.selection.length}资产吗?`, {
        confirmButtonText: '是',
        cancelButtonText: '否'
      }).then(async _ => {
        try {
          await Promise.all([
            ...this.selection.map(item => this.$api.deleteAsset(item.id.id))
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
    openDialog (type, info) {
      this.type = type
      this.info = info
      switch (type) {
        case 'add':
          this.title = '添加资产'
          this.width = '600px'
          break
        case 'allocation':
          this.title = '将资产分配给客户'
          this.width = '600px'
          break
        case 'import':
          this.title = '导入资产'
          this.width = '1000px'
          break
        default:
          break
      }
      this.visible = true
    },
    open (row, type) {
      const info = {
        public: {
          title: `你确定你想创建公开'${row.name}'资产?`,
          msg: '确认后，资产及其所有数据将被公开并被他人访问',
          apiName: 'postPublicAsset'
        },
        allocation: {
          title: `你确定要取消对'${row.name}'资产的分配吗?`,
          msg: '确认后，资产将未分配，客户无法访问',
          apiName: 'deleteCustomerAsset'
        },
        private: {
          title: `你确定你想创建私有'${row.name}'资产?`,
          msg: '确认后，资产及其所有数据将被私有化，无法被他人访问',
          apiName: 'deleteCustomerAsset'
        },
        delete: {
          title: `确定要删除资产'${row.name}'?`,
          msg: '小心！确认后资产及其所有相关数据将不可恢复',
          apiName: 'deleteAsset'
        }
      }
      this.$confirm(info[type].msg, info[type].title, {
        confirmButtonText: '是',
        cancelButtonText: '否',
        type: 'warning'
      }).then(async _ => {
        try {
          await this.$api[info[type].apiName](row.id.id)
          this.$message.success('操作成功')
          if (type === 'delete') {
            this.$refs.table.clearSelection()
          }
          this.getList()
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
      if (this.type === 'import') {
        this.visible = false
        this.getList()
        return false
      }
      this.$refs.form.validate(async valid => {
        if (!valid) return false
        try {
          if (this.type === 'add') {
            const params = {
              ...this.form,
              additionalInfo: {
                description: this.form.description
              }
            }
            delete params.description
            await this.$api.postAsset(params)
          } else {
            await this.$api.postCustomerAsset(this.allocationForm.id, this.info.id.id)
          }
          this.$message.success('操作成功')
          this.visible = false
          this.getList()
        } catch (error) {
          // this.$message.error(error.response.data.message)
        }
      })
    },
    cellClick (row, column) {
      if (column.label !== '操作' && column.type !== 'selection') {
        this.$router.push({ path: `/assets/${row.id.id}`, query: { title: row.name } })
      }
    },
    async getAssetTypes () {
      const res = await this.$api.getAssetTypes()
      this.assetTypes = res.data
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
    async getList () {
      this.loading = true
      const customerId = this.$store.getters.userInfo.customerId.id
      const apiName = this.isCustomer ? 'getCustomerAssetList' : 'getAssetInfos'
      const res = await this.$api[apiName](Object.assign({
        page: this.page - 1,
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
          },
          customerIsPublic: customerIsPublic ? '是' : '否'
        }
      })
      this.total = res.data.totalElements
      this.loading = false
    }
  },
  activated () {
    this.getList()
    this.getAssetTypes()
    if (!this.isCustomer) {
      this.getCustomersList()
    }
    this.$refs.table.clearSelection()
  },
  watch: {
    visible (n) {
      if (!n) {
        this.$refs.form.resetFields()
        if (this.type === 'import') {
          this.$refs.upload.clearFiles()
          this.active = 0
          this.msg = ''
        }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
/deep/ .el-steps {
  .el-step {
    .el-step__main {
      .el-step__description {
        margin: 20px 0 30px 0;
      }
    }
    .is-error {
      .el-input__inner {
        border-color: #F56C6C;
      }
    }
  }
}
</style>
