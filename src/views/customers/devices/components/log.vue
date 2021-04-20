<template>
  <div class="log-container">
    <el-form :model="listQuery" size="medium" :inline="true">
      <el-form-item label="时间">
        <el-date-picker
          v-model="listQuery.time"
          value-format="timestamp"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          align="right">
        </el-date-picker>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="getList(listQuery)">查询</el-button>
      </el-form-item>
    </el-form>
    <el-table
      :data="list"
      :default-sort="{prop: 'createdTime', order: 'descending'}"
      @sort-change="sortChange"
      size="mini"
      height="calc(100% - 126px)">
      <el-table-column width="30px"></el-table-column>
      <el-table-column
        v-for="(item, index) in listTitle"
        :key="index"
        :min-width="item.width"
        :label="item.label"
        :sortable="item.sortable"
        :prop="item.property"
        :sort-orders="['ascending', 'descending']"
        show-overflow-tooltip>
        <template slot-scope="scope">
          <div v-if="item.property === 'btn'" >
            <i class="el-icon-more" @click="openDialog(scope.row)"></i>
          </div>
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
    <icloud-dialog title="审计日志详情" :visible.sync="visible">
      <el-form ref="form" :model="form">
        <el-form-item label="活动数据">
          <el-input type="textarea" autosize readonly v-model="form.actionData"></el-input>
        </el-form-item>
        <el-form-item label="失败详情" v-if="form.actionFailureDetails">
          <el-input type="textarea" autosize readonly v-model="form.actionFailureDetails"></el-input>
        </el-form-item>
      </el-form>
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
  props: ['deviceId'],
  mixins: [page],
  data () {
    return {
      listQuery: {
        time: [
          new Date(`${getDate({ timestamp: new Date(), format: 'yyyy-MM-dd' })} 00:00:00`).getTime(),
          new Date(`${getDate({ timestamp: new Date(), format: 'yyyy-MM-dd' })} 23:59:59`).getTime()
        ],
        sortOrder: 'DESC'
      },
      list: [],
      listTitle: [
        { property: 'createdTime', label: '创建时间', width: 180, sortable: true },
        { property: 'userName', label: '用户', width: 150 },
        { property: 'actionType', label: '类型', width: 150 },
        { property: 'actionStatus', label: '状态', width: 100 },
        { property: 'btn', label: '详情', width: 100 }
      ],
      visible: false,
      form: {
        actionData: {},
        actionFailureDetails: ''
      }
    }
  },
  methods: {
    sortChange ({ order }) {
      const isDesc = order === 'descending'
      this.listQuery.sortOrder = isDesc ? 'DESC' : 'ASC'
      this.getList()
    },
    openDialog (row) {
      this.visible = true
      this.form = {
        actionData: JSON.stringify(row.actionData, null, 4),
        actionFailureDetails: row.actionFailureDetails
      }
    },
    async getList (params) {
      try {
        const time = this.listQuery.time || ['', '']
        const res = await this.$api.getEntityViewLogs({
          page: params ? 0 : this.page - 1,
          pageSize: this.limit,
          sortProperty: 'createdTime',
          sortOrder: this.listQuery.sortOrder,
          startTime: time[0],
          endTime: time[1]
        }, 'DEVICE', this.deviceId)
        this.list = res.data.data.map(ele => Object.assign(ele, {
          createdTime: getDate({ timestamp: ele.createdTime })
        }))
        this.total = res.data.totalElements
      } catch (error) {}
    }
  },
  created () {
    this.getList()
  }
}
</script>
