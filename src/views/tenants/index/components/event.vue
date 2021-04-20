<template>
  <div class="event-container">
    <el-form :model="listQuery" size="medium" :inline="true">
      <el-form-item label="事件类型">
        <el-select v-model="listQuery.eventType">
          <el-option v-for="item in eventTypeList" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="时间">
        <el-date-picker
          v-model="listQuery.time"
          value-format="timestamp"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          align="right" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="getList(listQuery)">查询</el-button>
      </el-form-item>
    </el-form>
    <el-table
      :data="list"
      v-loading="loading"
      :default-sort="{prop: 'createdTime', order: 'descending'}"
      @sort-change="sortChange"
      size="mini"
      height="calc(100% - 126px)">
      <el-table-column width="30px"></el-table-column>
      <el-table-column
        v-for="item in listTitle[listQuery.eventType]"
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
      :total="total" />
  </div>
</template>

<script>
import { page } from '@/mixins'
import { getDate } from '@/utils'
export default {
  props: ['tenantId', 'info'],
  mixins: [page],
  data () {
    return {
      eventTypeList: [
        { label: '错误', value: 'ERROR' },
        { label: '生命周期事件', value: 'LC_EVENT' },
        { label: '类型统计', value: 'STATS' }
      ],
      listQuery: {
        eventType: 'ERROR',
        sortOrder: 'DESC',
        time: [
          new Date(`${getDate({ timestamp: new Date(), format: 'yyyy-MM-dd' })} 00:00:00`).getTime(),
          new Date(`${getDate({ timestamp: new Date(), format: 'yyyy-MM-dd' })} 23:59:59`).getTime()
        ]
      },
      list: [],
      listTitle: {
        ERROR: [
          { property: 'createdTime', label: '事件时间', width: 180, sortable: true },
          { property: 'body.server', label: '服务器', width: 150 },
          { property: 'body.method', label: '方法', width: 150 },
          { property: 'body.error', label: '错误', width: 150 }
        ],
        LC_EVENT: [
          { property: 'createdTime', label: '事件时间', width: 180, sortable: true },
          { property: 'body.server', label: '服务器', width: 150 },
          { property: 'body.event', label: '事件', width: 150 },
          { property: 'body.success', label: '状态', width: 150 },
          { property: 'body.error', label: '错误', width: 150 }
        ],
        STATS: [
          { property: 'createdTime', label: '事件时间', width: 180, sortable: true },
          { property: 'body.server', label: '服务器', width: 150 },
          { property: 'body.messagesProcessed', label: '消息处理', width: 150 },
          { property: 'body.errorsOccurred', label: '错误发生', width: 150 }
        ]
      }
    }
  },
  methods: {
    sortChange ({ order }) {
      const isDesc = order === 'descending'
      this.listQuery.sortOrder = isDesc ? 'DESC' : 'ASC'
      this.getList()
    },
    formatter (row, column, cellValue) {
      switch (column.property) {
        case 'createdTime':
          return getDate({ timestamp: cellValue })
        default:
          if (!isNaN(cellValue) && cellValue.constructor === Boolean) {
            return String(cellValue)
          } else {
            return cellValue
          }
      }
    },
    async getList (params) {
      this.loading = true
      try {
        const time = this.listQuery.time || ['', '']
        const res = await this.$api.getEvents('CUSTOMER', this.tenantId, this.listQuery.eventType, {
          page: params ? 0 : this.page - 1,
          pageSize: this.limit,
          sortProperty: 'createdTime',
          sortOrder: this.listQuery.sortOrder,
          tenantId: this.info.tenantId.id,
          startTime: time[0],
          endTime: time[1]
        })
        this.list = res.data.data
        this.total = res.data.totalElements
      } catch (error) {
        console.log(error)
      }
      this.loading = false
    }
  }
}
</script>
