<template>
  <div class="alarm-container">
    <el-form :model="listQuery" size="medium" :inline="true">
      <el-form-item label="警告状态">
        <el-select v-model="listQuery.searchStatus">
          <el-option label="全部" value="ANY"></el-option>
          <el-option label="已激活" value="ACTIVE"></el-option>
          <el-option label="已清除" value="CLEARED"></el-option>
          <el-option label="已应答" value="ACK"></el-option>
          <el-option label="未应答" value="UNACK"></el-option>
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
          align="right">
        </el-date-picker>
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
        v-for="item in listTitle"
        :key="item.label"
        :min-width="item.width"
        :label="item.label"
        :sortable="item.sortable"
        :prop="item.property"
        :sort-orders="['ascending', 'descending']"
        show-overflow-tooltip>
        <template slot-scope="scope">
          <div v-if="item.property === 'details'">
            <i class="el-icon-more" @click="openDialog(scope.row)"></i>
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
      :total="total"
    ></el-pagination>
    <icloud-dialog title="警告详情" :visible.sync="visible">
      <el-form ref="form" :model="form">
        <el-form-item label="创建时间">
          <el-input readonly v-model="form.createdTime"></el-input>
        </el-form-item>
        <el-form-item label="起因">
          <el-input readonly v-model="form.originatorName"></el-input>
        </el-form-item>
        <el-form-item label="开始时间">
          <el-input readonly v-model="form.startTs"></el-input>
        </el-form-item>
        <el-form-item label="结束时间">
          <el-input readonly v-model="form.endTs"></el-input>
        </el-form-item>
        <el-form-item label="类型">
          <el-input readonly v-model="form.type"></el-input>
        </el-form-item>
        <el-form-item label="严重程度">
          <el-input readonly v-model="form.severity"></el-input>
        </el-form-item>
        <el-form-item label="状态">
          <el-input readonly v-model="form.status"></el-input>
        </el-form-item>
        <el-form-item label="详情">
          <el-input type="textarea" autosize readonly v-model="form.details"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="icloud-dialog-footer">
        <wx-button type="primary" @click="submit('ack')">应答</wx-button>
        <wx-button type="primary" @click="submit('clear')">清除</wx-button>
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
      listQuery: {
        searchStatus: 'ANY',
        sortOrder: 'DESC',
        time: [
          new Date(`${getDate({ timestamp: new Date(), format: 'yyyy-MM-dd' })} 00:00:00`).getTime(),
          new Date(`${getDate({ timestamp: new Date(), format: 'yyyy-MM-dd' })} 23:59:59`).getTime()
        ]
      },
      list: [],
      listTitle: [
        { property: 'createdTime', label: '创建时间', width: 180, sortable: true },
        { property: 'originatorName', label: '起因', width: 150 },
        { property: 'type', label: '类型', width: 100 },
        { property: 'severity', label: '严重程度', width: 100 },
        { property: 'status', label: '状态', width: 100 },
        { property: 'details', label: '详情', width: 150 }
      ],
      visible: false,
      form: {
        createdTime: '',
        originatorName: '',
        startTs: '',
        endTs: '',
        type: '',
        severity: '',
        status: '',
        details: {}
      },
      infos: {}
    }
  },
  methods: {
    async submit (alarmType) {
      await this.$api.postAlarmType(this.infos.id.id, alarmType)
      this.getList()
      this.visible = false
    },
    openDialog (data) {
      this.infos = data
      for (const key in this.form) {
        if (['createdTime', 'endTs', 'startTs'].includes(key)) {
          this.form[key] = getDate({ timestamp: data[key] })
        } else if (key === 'details') {
          this.form[key] = JSON.stringify(data[key], null, 4)
        } else {
          this.form[key] = data[key]
        }
      }
      this.visible = true
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
    sortChange ({ order }) {
      const isDesc = order === 'descending'
      this.listQuery.sortOrder = isDesc ? 'DESC' : 'ASC'
      this.getList()
    },
    async getList (params) {
      this.loading = true
      try {
        const time = this.listQuery.time || ['', '']
        const res = await this.$api.getAlarms('ENTITY_VIEW', this.entityId, {
          page: params ? 0 : this.page - 1,
          pageSize: this.limit,
          sortProperty: 'createdTime',
          sortOrder: this.listQuery.sortOrder,
          startTime: time[0],
          endTime: time[1],
          searchStatus: this.listQuery.searchStatus,
          fetchOriginator: true
        })
        this.list = res.data.data.map(ele => Object.assign(ele, {
          createdTime: getDate({ timestamp: ele.createdTime })
        }))
        this.total = res.data.totalElements
      } catch (error) {
        this.$message.error(error.response.data.message)
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
