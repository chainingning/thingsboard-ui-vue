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
        show-overflow-tooltip>
        <template slot-scope="scope">
          <div v-if="['body.error'].includes(item.property)">
            <i v-if="formatter(item.property, scope.row)" class="el-icon-more" @click="openDialog(item.label, formatter(item.property, scope.row))"></i>
          </div>
          <div v-else>{{ formatter(item.property, scope.row) }}</div>
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
      :total="total" />
    <icloud-dialog :title="title" :visible.sync="visible">
      <el-input type="textarea" autosize readonly v-model="bodyData" />
      <div slot="footer" class="icloud-dialog-footer">
        <wx-button @click="visible = false">关闭</wx-button>
      </div>
    </icloud-dialog>
  </div>
</template>

<script>
import { page } from '@/mixins'
import { getDate } from '@/utils'
export default {
  props: ['entityId', 'info'],
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
          { property: 'body.message', label: '消息处理', width: 150 },
          { property: 'body.error', label: '错误发生', width: 150 }
        ]
      },
      title: '',
      visible: false,
      bodyData: ''
    }
  },
  methods: {
    openDialog (title, value) {
      this.title = title
      if (title !== '错误') {
        value = JSON.stringify(JSON.parse(value), null, 4)
      }
      this.bodyData = value
      this.visible = true
    },
    sortChange ({ order }) {
      const isDesc = order === 'descending'
      this.listQuery.sortOrder = isDesc ? 'DESC' : 'ASC'
      this.getList()
    },
    formatter (property, row) {
      const pro = property.split('.')
      const value = pro.length > 1 ? row[pro[0]][pro[1]] : row[property]
      switch (property) {
        case 'createdTime':
          return getDate({ timestamp: value })
        default:
          if (!isNaN(value) && value !== null && value.constructor === Boolean) {
            return String(value)
          } else {
            return value
          }
      }
    },
    async getList (params) {
      this.loading = true
      try {
        const time = this.listQuery.time || ['', '']
        const res = await this.$api.getEvents('ENTITY_VIEW', this.entityId, this.listQuery.eventType, {
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
  },
  watch: {
    info: {
      deep: true,
      handler (n) {
        this.getList()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
