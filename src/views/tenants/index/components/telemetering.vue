<template>
  <div class="telemetering-container">
    <el-form :model="listQuery" size="medium" :inline="true">
      <el-form-item>
        <el-input placeholder="搜索键名" v-model="listQuery.keyword"></el-input>
      </el-form-item>
    </el-form>
    <el-table
      :data="list"
      :default-sort="{prop: 'key', order: 'descending'}"
      size="mini"
      height="calc(100% - 58px)">
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
        :sort-by="item.property === 'key' ? ['key', 'updatedTime'] : ['updatedTime', 'key']">
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { getDate } from '@/utils'
export default {
  props: ['tenantId'],
  data () {
    return {
      listQuery: {
        keyword: ''
      },
      listTitle: [
        { property: 'updatedTime', label: '最后更新时间', width: 180, sortable: true },
        { property: 'key', label: '键', width: 180, sortable: true },
        { property: 'value', label: '值', width: 180 }
      ],
      cmdIdList: []
    }
  },
  computed: {
    list () {
      const websocketData = this.$store.getters.websocketData.find(item => this.cmdIdList.includes(item.subscriptionId))
      const { data } = websocketData || {}
      return data ? Object.keys(data).map(key => {
        return {
          updatedTime: getDate({ timestamp: data[key][0][0] }),
          value: data[key][0][1],
          key
        }
      }) : []
    }
  },
  methods: {
    async websocketsend () {
      this.cmdIdList = await this.$store.dispatch('websocketsend', {
        attrSubCmds: [],
        tsSubCmds: [
          {
            entityType: 'TENANT',
            entityId: this.tenantId,
            scope: 'LATEST_TELEMETRY'
          }
        ],
        historyCmds: []
      })
    }
  },
  created () {
    this.websocketsend()
  }
}
</script>
