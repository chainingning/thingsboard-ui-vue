<template>
  <div class="app-container" ref="appContainer" v-resize="mixinResize">
    <div class="icon-container" v-if="!isCustomer">
      <el-dropdown trigger="click" placement="left-start">
        <wx-button type="primary" icon="el-icon-plus" circle></wx-button>
        <el-dropdown-menu slot="dropdown" class="iconfont">
          <el-dropdown-item icon="icon-guize" @click.native="openDialog('add')">创建新的设备</el-dropdown-item>
          <el-dropdown-item icon="icon-daoru" @click.native="openDialog('import')">导入设备</el-dropdown-item>
          <el-dropdown-item icon="icon-daoru" @click.native="exportTable()">导出设备</el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
      <wx-button v-if="selection.length" type="primary" icon="icon-remove" circle @click="deleteMore"></wx-button>
    </div>
    <div class="filter-container" ref="filterContainer">
      <div class="device-nums-container">
        <el-select v-model="listQuery.assetId" filterable @change="getList(listQuery)">
          <el-option label="全部资产" value=""></el-option>
          <el-option v-for="item in assetList" :key="item.id.id" :label="item.name" :value="item.id.id"></el-option>
        </el-select>
        <div class="device-nums">
          <div class="title">设备总数</div>
          <div class="num">{{ deviceTotal }}</div>
        </div>
        <div class="device-nums">
          <div class="title">当前在线</div>
          <div class="num">{{ activeDevice }}</div>
        </div>
        <!-- <div class="device-nums">
          <div class="title">当前在线</div>
          <div class="num">{{ online }}</div>
        </div> -->
      </div>
      <el-form :model="listQuery" class="filter-container-form" size="medium" :inline="true">
        <el-form-item label="设备类型">
          <el-select v-model="listQuery.type" filterable @change="getList(listQuery)">
            <el-option label="所有" value=""></el-option>
            <el-option v-for="item in deviceTypes" :key="item.type" :label="item.type" :value="item.type"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="节点类型">
          <el-select v-model="listQuery.gateway">
            <el-option label="所有" value=""></el-option>
            <el-option label="设备" :value="false"></el-option>
            <el-option label="网关" :value="true"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="设备启用">
          <el-select v-model="listQuery.enabled">
            <el-option label="所有" value=""></el-option>
            <el-option label="是" :value="true"></el-option>
            <el-option label="否" :value="false"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="listQuery.actived">
            <el-option label="所有" value=""></el-option>
            <el-option label="在线" :value="true"></el-option>
            <el-option label="离线" :value="false"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-input placeholder="搜索设备名称" v-model="listQuery.textSearch" @keyup.enter.native="getList()"></el-input>
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
          v-if="isCustomer ? item.property !== 'customerTitle' : true"
          :key="item.label"
          :min-width="item.width"
          :label="item.label"
          :sortable="item.sortable"
          :prop="item.property"
          :sort-orders="['ascending', 'descending']"
          show-overflow-tooltip>
          <template slot-scope="scope">
            <span v-if="item.property === 'btn'" >
              <!-- <el-button v-if="scope.row.icon.public && !isCustomer" type="text" @click="open(scope.row, 'public')">设为公开</el-button> -->
              <el-button v-if="scope.row.icon.allocation && !isCustomer" type="text" @click="openDialog('allocation', scope.row)">分配给客户</el-button>
              <el-button v-if="scope.row.icon.cancelAllocation && !isCustomer" type="text" @click="open(scope.row, 'allocation')">取消分配客户</el-button>
              <!-- <el-button v-if="scope.row.icon.provide && !isCustomer" type="text" @click="open(scope.row, 'private')">设为私有</el-button> -->
              <el-button type="text" @click="openDialog('credentials', scope.row)">{{ isCustomer ? '查看凭证' : '管理凭据' }}</el-button>
              <el-button v-if="!isCustomer" type="text" @click="open(scope.row, 'delete')">删除设备</el-button>
            </span>
            <el-switch
              v-else-if="item.property === 'enabled' && !isCustomer"
              v-model="scope.row.enabled"
              active-color="#40CB43"
              inactive-color="#DDDDDD"
              @change="$value => changeEnabled($value, scope.row)"></el-switch>
            <span v-else>{{ scope.row[item.property] | format(item.property) }}</span>
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
        <el-form-item label="设备类型" prop="type">
          <el-select v-model="form.type" allow-create filterable>
            <el-option v-for="item in deviceTypes" :key="item.type" :label="item.type" :value="item.type"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="标签" prop="label">
          <el-input v-model="form.label"></el-input>
        </el-form-item>
        <el-form-item prop="gateway">
          <el-checkbox v-model="form.gateway">是网关</el-checkbox>
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
              <el-form-item label="设备文件" prop="file" v-show="active === 0">
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
                <el-table-column type="index"></el-table-column>
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
      <el-form v-else-if="type === 'credentials'" ref="form" :model="credentialsForm" :rules="credentialsRules">
        <el-form-item label="凭据类型" prop="credentialsType">
          <el-select v-model="credentialsForm.credentialsType" :disabled="isCustomer">
            <el-option label="Access token" value="ACCESS_TOKEN"></el-option>
            <el-option label="X.509 Certificate" value="X509_CERTIFICATE"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item
          :label="credentialsForm.credentialsType === 'ACCESS_TOKEN' ? '访问令牌' : 'RSA公钥'"
          :prop="credentialsForm.credentialsType === 'ACCESS_TOKEN' ? 'credentialsId' : 'credentialsValue'">
          <el-input show-word-limit :maxlength="credentialsForm.credentialsType === 'ACCESS_TOKEN' ? 20 : null" :disabled="isCustomer" v-model="credentialsForm[credentialsForm.credentialsType === 'ACCESS_TOKEN' ? 'credentialsId' : 'credentialsValue']"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="icloud-dialog-footer">
        <template v-if="type === 'import'">
          <wx-button v-if="active !== 0 && active !== 3 && active !== 4" type="primary" @click="back">上一步</wx-button>
          <wx-button v-if="active !== 4 && active !== 3" type="primary" @click="next">下一步</wx-button>
        </template>
        <wx-button v-if="(type === 'import' && active === 4) || (type !== 'import') && !isCustomer" type="primary" @click="submit">确定</wx-button>
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
  name: 'Devices',
  data () {
    return {
      isCustomer: this.$store.getters.userInfo.authority === 'CUSTOMER_USER',
      assetList: [],
      deviceTotal: 0,
      activeDevice: 0,
      online: 0,
      listQuery: {
        assetId: '',
        gateway: '',
        textSearch: '',
        sortOrder: 'DESC',
        type: '',
        actived: '',
        enabled: ''
      },
      deviceTypes: [],
      list: [],
      listTitle: [
        { property: 'name', label: '设备名称', width: 150 },
        { property: 'type', label: '设备类型', width: 150 },
        { property: 'gateway', label: '节点类型', width: 150 },
        { property: 'enabled', label: '设备启用', width: 150 },
        { property: 'actived', label: '状态', width: 100 },
        { property: 'customerTitle', label: '所属客户', width: 150 },
        { property: 'btn', label: '操作', width: 400 }
      ],
      selection: [],
      visible: false,
      type: '',
      title: '',
      width: '',
      form: {
        name: '',
        type: '',
        label: '',
        gateway: '',
        description: ''
      },
      rules: {
        name: [{ required: true, message: '名称不能为空', trigger: 'change' }],
        type: [{ required: true, message: '设备类型不能为空', trigger: 'change' }]
      },
      allocationForm: {
        id: ''
      },
      allocationRules: {
        id: [{ required: true, message: '客户不能为空', trigget: 'change' }]
      },
      customerList: [],
      info: null,
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
        { label: '共享属性', value: 'shared attribute' },
        { label: '服务端属性', value: 'server attribute' },
        { label: '时间序列', value: 'timeseries' },
        { label: '访问令牌', value: 'access token', isDisabled: true },
        { label: '网关', value: 'is Gateway', isDisabled: true },
        { label: '设备ID', value: 'id', isDisabled: true }
      ],
      columnDisabled: [],
      msg: '',
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
    async exportTable () {
      const pageSize = 1000
      const apiArr = new Array(parseInt(this.total / pageSize) + 1).fill('')
      const customerId = this.$store.getters.userInfo.customerId.id
      const apiName = this.isCustomer ? 'getCustomerDeviceList' : 'getDeviceInfo'
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
          const { createdTime, name, type, label, gateway, enabled } = row
          list.push({
            createdTime: getDate({ timestamp: createdTime }),
            id: row.id.id,
            name,
            type,
            label,
            gateway: gateway ? '网关' : '设备',
            enabled: enabled ? '是' : '否'
          })
        })
      })
      const tHeader = ['创建时间', '设备ID', '设备名称', '设备类型', '设备标签', '所属客户', '节点类型', '设备启用']
      const filterVal = ['createdTime', 'id', 'name', 'type', 'label', 'customerTitle', 'gateway', 'enabled']
      exportTable(tHeader, filterVal, list, `设备 ${new Date().getTime()}`)
    },
    changeEnabled (value, row) {
      this.$api.postDevice({
        ...row,
        enabled: value
      })
    },
    downloadTemplate () {
      const data = '名称,类型,标签,共享属性1,服务器属性1,inactivityTimeout,温度,湿度,PM2.5,CO2,PM10,风向,风速,SO2,NO2,CO,O3,积水深度,积雪厚度,结冰厚度,大气压,露点,结霜概率,电量,机位状态,雨量,水温,电导率,氨氮,溶解氧,PH,浊度,使用状态,电压,电流,开关状态,液位,流量'
      const blob = new Blob([[`\uFEFF${data}`]], { type: 'text/plain,charset=utf-8' })
      FileSaver.saveAs(blob, '设备导入模板.csv')
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
      const typeList = ['name', 'type', 'label', 'id', 'description']
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
              sharedAttr: {},
              serverAttr: {},
              timeseries: {}
            }
            console.log(this.lineData)
            this.lineData.forEach((item, index) => {
              if (typeList.includes(item.type)) {
                params[item.type] = this.importForm.file[i][index].replace(/\r/g, '')
              }
              if (item.type === 'server attribute') {
                if (this.importForm.file[i][index].replace(/^\s+|\s+$/g, '') !== '') {
                  params.serverAttr[item.key] = this.importForm.file[i][index].replace(/\r/g, '')
                }
              }
              if (item.type === 'shared attribute') {
                if (this.importForm.file[i][index].replace(/^\s+|\s+$/g, '') !== '') {
                  params.sharedAttr[item.key] = this.importForm.file[i][index].replace(/\r/g, '')
                }
              }
              if (item.type === 'timeseries') {
                if (this.importForm.file[i][index].replace(/^\s+|\s+$/g, '') !== '') {
                  params.timeseries[item.key] = this.importForm.file[i][index].replace(/\r/g, '')
                }
              }
              if (item.type === 'access token') {
                if (this.importForm.file[i][index].replace(/^\s+|\s+$/g, '') !== '') {
                  params.accessToken = this.importForm.file[i][index].replace(/\r/g, '')
                }
              }
              if (item.type === 'is Gateway') {
                if (this.importForm.file[i][index].replace(/^\s+|\s+$/g, '') !== '') {
                  params.gateway = this.importForm.file[i][index].replace(/\r/g, '')
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
            if (params.id) {
              _params.id = {
                entityType: 'DEVICE',
                id: params.id
              }
            }
            if (params.description) {
              _params.additionalInfo = {
                description: params.description
              }
            }
            try {
              result = await this.$api.postDevice(_params)
              if (Object.prototype.hasOwnProperty.call(params, 'accessToken')) {
                const r = await this.$api.getDeviceCredentials(result.data.id.id)
                await this.$api.postDeviceCredentials(Object.assign({
                  ...r.data,
                  credentialsType: 'ACCESS_TOKEN',
                  credentialsId: params.accessToken
                }))
              }
              if (Object.prototype.hasOwnProperty.call(params, 'gateway')) {
                const r = await this.$api.getItemDeviceInfo(result.data.id.id)
                await this.$api.postDevice(Object.assign({
                  ...r.data,
                  additionalInfo: {
                    ...(r.data.additionalInfo || {}),
                    gateway: Boolean(Number(params.gateway))
                  }
                }))
              }
              msgNum[0] += 1
            } catch (error) {
              if (this.importForm.updateAttrAndTelemetry) {
                result = await this.$api.getTenantDevices({
                  assetName: params.name
                })
                await this.$api.postDevice({
                  ...result.data,
                  ..._params
                })
                msgNum[1] += 1
              } else {
                msgNum[2] += 1
                continue
              }
            }
            if (JSON.stringify(params.sharedAttr) !== '{}') {
              await this.$api.postPluginsTelemetry(
                'DEVICE',
                result.data.id.id,
                { ...params.sharedAttr },
                'SHARED_SCOPE'
              )
            }
            if (JSON.stringify(params.serverAttr) !== '{}') {
              await this.$api.postPluginsTelemetry(
                'DEVICE',
                result.data.id.id,
                { ...params.serverAttr },
                'SERVER_SCOPE'
              )
            }
            if (JSON.stringify(params.timeseries) !== '{}') {
              await this.$api.postPluginsTelemetryTimeseries(
                'DEVICE',
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
    async openDialog (type, info) {
      this.type = type
      this.info = info
      let result = null
      switch (type) {
        case 'add':
          this.title = '添加设备'
          this.width = '600px'
          this.getDeviceTypes()
          break
        case 'allocation':
          this.title = '将设备分配给客户'
          this.width = '600px'
          break
        case 'import':
          this.title = '导入设备'
          this.width = '1000px'
          break
        case 'credentials':
          this.title = '设备凭据'
          this.width = '600px'
          result = await this.$api.getDeviceCredentials(info.id.id)
          this.credentialsInfo = result.data
          this.credentialsForm = {
            credentialsType: result.data.credentialsType || 'ACCESS_TOKEN',
            credentialsId: result.data.credentialsId,
            credentialsValue: result.data.credentialsValue
          }
          break
        default:
          break
      }
      this.visible = true
    },
    open (row, type) {
      const info = {
        public: {
          title: `您确定要将设备'${row.name}'设为公开吗`,
          msg: '确认后，设备及其所有数据将被公开并被他人访问',
          apiName: 'postDeviceAsset'
        },
        allocation: {
          title: `您确定要取消分配设备'${row.name}'`,
          msg: '确认后,设备将被取消分配,客户将无法访问',
          apiName: 'deleteCustomerDevice'
        },
        private: {
          title: `您确定要将设备'${row.name}'设为私有吗`,
          msg: '确认后，设备及其所有数据将被设为私有，不被其他人访问',
          apiName: 'deleteCustomerDevice'
        },
        delete: {
          title: `确定要删除设备'${row.name}'?`,
          msg: '小心！确认后设备及其所有相关数据将不可恢复',
          apiName: 'deleteDevice'
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
    handleSelectionChange (val) {
      this.selection = val
    },
    async deleteMore () {
      this.$confirm('小心！确认后所有选定的设备将被删除,所有相关数据将不可恢复', `确定要删除${this.selection.length}设备吗?`, {
        confirmButtonText: '是',
        cancelButtonText: '否'
      }).then(async _ => {
        try {
          await Promise.all([
            ...this.selection.map(item => this.$api.deleteDevice(item.id.id))
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
      if (this.type === 'import') {
        this.visible = false
        this.getList()
        return false
      }
      this.$refs.form.validate(async valid => {
        if (!valid) return false
        if (this.type === 'add') {
          const params = {
            ...this.form,
            enabled: true,
            additionalInfo: {
              description: this.form.description,
              gateway: Boolean(this.form.gateway)
            }
          }
          delete params.description
          delete params.gateway
          await this.$api.postDevice(params)
        } else if (this.type === 'allocation') {
          await this.$api.postCustomerDevice(this.allocationForm.id, this.info.id.id)
        } else if (this.type === 'credentials') {
          await this.$api.postDeviceCredentials({
            ...this.credentialsInfo,
            ...this.credentialsForm
          })
        }
        this.$message.success('操作成功')
        this.visible = false
        this.getDeviceTypes()
        this.getList()
      })
    },
    cellClick (row, column) {
      if (column.label !== '操作' && column.type !== 'selection' && column.label !== '设备启用') {
        this.$router.push({ path: `/devices/${row.id.id}`, query: { title: row.name } })
      }
    },
    async getDeviceTypes () {
      const res = await this.$api.getDeviceTypes()
      this.deviceTypes = res.data
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
    async getDeviceTotal (assetId, customerId) {
      const params = {
        strAssetId: assetId,
        strCustomerId: customerId
      }
      for (const key in params) {
        if (!params[key]) {
          delete params[key]
        }
      }
      const result = await this.$api.getDeviceTotal(params)
      this.deviceTotal = result.data
    },
    async getActiveDevice (assetId, customerId) {
      const params = {
        strAssetId: assetId,
        strCustomerId: customerId
      }
      for (const key in params) {
        if (!params[key]) {
          delete params[key]
        }
      }
      const result = await this.$api.getStateDeviceActive(params)
      this.activeDevice = result.data
    },
    async getOnlineDevice (assetId, customerId) {
      const params = {
        strAssetId: assetId,
        strCustomerId: customerId
      }
      for (const key in params) {
        if (!params[key]) {
          delete params[key]
        }
      }
      const result = await this.$api.getOnlineDevice(params)
      this.online = result.data
    },
    async getAssetList () {
      const apiName = this.isCustomer ? 'getCustomerAssetInfos' : 'getAssetInfos'
      const customerId = this.$store.getters.userInfo.customerId.id
      const result = await this.$api[apiName]({ page: 0, pageSize: 999999 }, this.isCustomer ? customerId : null)
      this.assetList = result.data.data
    },
    async getList (listQuery) {
      this.loading = true
      try {
        const customerId = this.$store.getters.userInfo.customerId.id
        const apiName = this.isCustomer ? 'getCustomerDeviceList' : 'getDeviceInfo'
        const params = Object.assign({
          pageSize: this.limit,
          page: listQuery ? 0 : this.page - 1,
          sortProperty: 'createdTime'
        }, this.listQuery)
        for (const key in params) {
          if (params[key] === '') {
            delete params[key]
          }
        }
        const res = await this.$api[apiName](params, this.isCustomer ? customerId : null)
        this.list = res.data.data.map(ele => {
          const { customerIsPublic, customerTitle } = ele || {}
          return {
            ...ele,
            icon: {
              public: !customerIsPublic && !customerTitle,
              allocation: !customerTitle,
              cancelAllocation: !customerIsPublic && customerTitle,
              provide: customerIsPublic
            }
          }
        })
        this.total = res.data.totalElements
        this.getDeviceTotal(this.listQuery.assetId, this.isCustomer ? customerId : null)
        this.getActiveDevice(this.listQuery.assetId, this.isCustomer ? customerId : null)
        // this.getOnlineDevice(this.listQuery.assetId, this.isCustomer ? customerId : null)
      } catch (error) {
        this.$message.error(error.response.data.message)
      }
      this.loading = false
    }
  },
  filters: {
    format: (value, property) => {
      switch (property) {
        case 'createdTime':
          return getDate({ timestamp: value })
        case 'gateway':
          return value ? '网关' : '设备'
        case 'enabled':
          return value ? '是' : '否'
        case 'actived':
          return value ? '在线' : '离线'
        default:
          return value
      }
    }
  },
  activated () {
    this.getList()
    this.getDeviceTypes()
    this.getAssetList()
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
  .device-nums-container {
    height: 77px;
    margin-bottom: 45px;
    .el-select, .device-nums {
      float: left;
    }
    .el-select {
      width: 177px;
      margin-right: 84px;
    }
    .device-nums {
      width: 201px;
      position: relative;
      .title, .num {
        float: left;
        width: 100%;
      }
      .title {
        font-size: 14px;
        color: #000;
        line-height: 20px;
        margin: 3px 0 7px 28px;
      }
      .num {
        font-size: 31px;
        color: #374979;
        font-family: PingFangSC-Medium;
        line-height: 44px;
        margin-left: 28px;
      }
      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        width: 2px;
        height: 77px;
        background-color: #D8D8D8;
      }
    }
  }
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
