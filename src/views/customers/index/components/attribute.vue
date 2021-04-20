<template>
  <div class="attribute-container">
    <el-form :model="listQuery" size="medium" :inline="true">
      <el-form-item label="设备属性范围">
        <el-select v-model="listQuery.scope">
          <el-option label="服务端属性" value="SERVER_SCOPE"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="getList()">查询</el-button>
        <el-button type="primary" @click="openDialog('add')">添加</el-button>
      </el-form-item>
      <el-form-item v-if="selection.length" class="fr">
        <wx-button type="primary" icon="icon-remove" circle @click="deleteMore"></wx-button>
      </el-form-item>
    </el-form>
    <el-table
      :data="list"
      v-loading="loading"
      :default-sort="{prop: 'key', order: 'descending'}"
      @sort-change="sortChange"
      size="mini"
      height="calc(100% - 126px)"
      @selection-change="handleSelectionChange">
      <el-table-column
        type="selection"
        width="90">
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
          <div v-if="item.property === 'btn'">
            <i class="el-icon-edit" @click="openDialog('edit', scope.row)"></i>
          </div>
          <div v-else>{{ scope.row[item.property] }}</div>
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
    <icloud-dialog :title="title" :visible.sync="visible">
      <el-form ref="form" :model="form" :rules="rules">
        <el-form-item v-if="type === 'add'" label="键" prop="key">
          <el-input v-model="form.key"></el-input>
        </el-form-item>
        <el-form-item label="值类型" prop="valueType">
          <el-select v-model="form.valueType" @change="form.value = form.valueType === 'boolean' ? false : ''">
            <el-option v-for="item in valueTypeList" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item :label="valueTypeList.filter(item => item.value === form.valueType)[0].label" prop="value">
          <el-checkbox v-if="form.valueType === 'boolean'" v-model="form.value">{{ form.value ? '真' : '假' }}</el-checkbox>
          <el-input v-else v-model="form.value"></el-input>
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
import { page } from '@/mixins'
import { getDate } from '@/utils'
export default {
  props: ['customerId'],
  mixins: [page],
  data () {
    const value = (rule, value, callback) => {
      const msg = this.valueTypeList.filter(item => item.value === this.form.valueType)[0].label
      if (value === '') {
        callback(new Error(`${msg}不能为空`))
      }
      switch (this.form.valueType) {
        case 'number':
          if (value % 1 !== 0) {
            callback(new Error('数字格式不正确'))
          }
          break
        case 'double':
          if (value % 1 === 0) {
            callback(new Error('双精度小数格式不正确'))
          }
          break
        default:
          break
      }
      callback()
    }
    return {
      listQuery: {
        scope: 'SERVER_SCOPE'
      },
      list: [],
      listTitle: [
        { property: 'lastUpdateTs', label: '最后更新时间', width: 180 },
        { property: 'key', label: '键', width: 180, sortable: true },
        { property: 'value', label: '值', width: 180 },
        { property: 'btn', width: 100 }
      ],
      valueTypeList: [
        { label: '字符串', value: 'string' },
        { label: '数字', value: 'number' },
        { label: '双精度小数', value: 'double' },
        { label: '布尔', value: 'boolean' }
      ],
      visible: false,
      title: '',
      form: {
        key: '',
        valueType: 'string',
        value: ''
      },
      rules: {
        key: [{ required: true, message: '键值不能为空', trigger: 'change' }],
        value: [{ required: true, validator: value, trigger: 'change' }]
      },
      type: 'add',
      selection: []
    }
  },
  methods: {
    openDialog (type, params) {
      this.title = type === 'edit' ? `修改属性(${params.key})` : '添加属性'
      this.type = type
      if (type === 'edit') {
        let valueType = typeof params.value
        valueType = valueType === 'number' ? params.value % 1 === 0 ? 'number' : 'double' : valueType
        this.form = {
          key: params.key,
          value: params.value,
          valueType
        }
      } else {
        this.form = {
          key: '',
          value: '',
          valueType: 'string'
        }
      }
      this.visible = true
    },
    async deleteMore () {
      this.$confirm('注意,确认后所有选中的属性都会被删除', `确定要删除${this.selection.length}属性吗?`, {
        confirmButtonText: '是',
        cancelButtonText: '否'
      }).then(async _ => {
        await this.$api.deletePluginsTelemetry('CUSTOMER', this.customerId, {
          keys: this.selection.map(ele => ele.key).join(',')
        }, 'SERVER_SCOPE')
        this.$message.success('操作成功')
        this.page = 1
        this.getList()
        this.$refs.table.clearSelection()
      }).catch(() => {})
    },
    handleSelectionChange (val) {
      this.selection = val
    },
    submit () {
      this.$refs.form.validate(async valid => {
        if (!valid) return false
        const valueType = this.form.valueType
        let value = this.form.value
        value = valueType === 'number' || valueType === 'double' ? Number(value) : valueType === 'boolean' ? Boolean(value) : value
        const params = {
          [this.form.key]: value
        }
        await this.$api.postPluginsTelemetry('CUSTOMER', this.customerId, params, 'SERVER_SCOPE')
        this.getList()
        this.visible = false
      })
    },
    sortChange ({ order }) {},
    async getList () {
      try {
        const result = await this.$api.getAttribute('CUSTOMER', this.customerId, this.listQuery.scope)
        this.list = result.data.map(ele => Object.assign(ele, {
          lastUpdateTs: getDate({ timestamp: ele.lastUpdateTs })
        }))
        this.total = result.data.length
      } catch (error) {}
    }
  },
  created () {
    this.getList()
  }
}
</script>
