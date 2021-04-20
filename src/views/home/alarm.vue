<template>
  <div class="app-container" ref="appContainer" v-resize="mixinResize">
    <div class="filter-container" ref="filterContainer">
      <el-form :model="listQuery" class="filter-container-form" size="medium" :inline="true">
        <el-form-item label="时间">
          <el-date-picker
            v-model="listQuery.time"
            value-format="timestamp"
            type="datetimerange"
            :picker-options="pickerOptions"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            align="right">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="告警状态" class="alarm-select">
          <el-select v-model="listQuery.status" multiple :multiple-limit="2">
            <el-option label="激活未应答" value="ACTIVE_UNACK"></el-option>
            <el-option label="激活已应答" value="ACTIVE_ACK"></el-option>
            <el-option label="清除未应答" value="CLEARED_UNACK"></el-option>
            <el-option label="清除已应答" value="CLEARED_ACK"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-input v-model="listQuery.textSearch" placeholder="告警类型" @keyup.enter.native="getList(listQuery)"></el-input>
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
      :default-sort="{prop: 'startTs', order: 'descending'}"
      @sort-change="sortChange"
      size="mini"
      :height="mixinHeight"
      :class="['configurationTable', {afterRenderClass: mixinShowAfterRenderClass}]"
      :row-key="row => row.id.id">
      <el-table-column width="30px"></el-table-column>
      <el-table-column
        v-for="item in listTitle"
        :key="item.label"
        :min-width="item.width"
        :label="item.label"
        :sortable="item.sortable"
        :prop="item.property"
        :sort-orders="['ascending', 'descending']"
        :formatter="formatter"
        show-overflow-tooltip>
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
  </div>
</template>

<script>
import { page, resize } from '@/mixins'
import pickerOptions from '@/mixins/pickerOptions'
import { getDate } from '@/utils'
export default {
  mixins: [page, resize, pickerOptions],
  data () {
    return {
      listQuery: {
        time: [],
        status: ['ACTIVE_UNACK', 'ACTIVE_ACK'],
        textSearch: '',
        sortOrder: 'DESC'
      },
      list: [],
      listTitle: [
        { property: 'startTs', label: '告警时间', width: 180, sortable: true },
        { property: 'clearTs', label: '告警清除时间', width: 180 },
        { property: 'originatorName', label: '设备ID及名称', width: 150 },
        { property: 'severity', label: '告警等级', width: 150 },
        { property: 'status', label: '告警状态', width: 150 },
        { property: 'type', label: '告警类型', width: 150 }
      ]
    }
  },
  methods: {
    sortChange ({ order }) {
      const isDesc = order === 'descending'
      this.listQuery.sortOrder = isDesc ? 'DESC' : 'ASC'
      this.getList()
    },
    formatter (row, column, cellValue) {
      const severity = {
        CRITICAL: '危险',
        MAJOR: '重要',
        MINOR: '次要',
        WARNING: '警告',
        INDETERMINATE: '不确定'
      }
      const status = {
        ACTIVE_UNACK: '激活未应答',
        ACTIVE_ACK: '激活已应答',
        CLEARED_UNACK: '清除未应答',
        CLEARED_ACK: '清除已应答'
      }
      switch (column.property) {
        case 'startTs':
        case 'clearTs':
          return cellValue ? getDate({ timestamp: cellValue }) : ''
        case 'severity':
          return severity[cellValue]
        case 'status':
          return status[cellValue]
        default:
          return cellValue
      }
    },
    async getList (params) {
      this.loading = true
      try {
        const time = this.listQuery.time || ['', '']
        const _params = {
          page: params ? 0 : this.page - 1,
          pageSize: this.limit,
          sortProperty: 'createdTime',
          startTime: time[0],
          endTime: time[1],
          textSearch: this.listQuery.textSearch,
          sortOrder: this.listQuery.sortOrder
        }
        this.listQuery.status.forEach((item, index) => {
          _params[`status${index + 1}`] = item
        })
        const res = await this.$api.getAlarm(_params)
        this.list = res.data.data
        this.total = res.data.totalElements
      } catch (error) {}
      this.loading = false
    }
  },
  created () {
    this.getList()
  }
}
</script>

<style lang="scss" scoped>
.alarm-select {
  .el-select {
    width: 240px;
  }
}
</style>
