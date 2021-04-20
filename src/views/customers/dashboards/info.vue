<template>
  <div class="app-container details-container">
    <div class="btn-container">
      <wx-button type="primary" icon="icon-cuo" circle @click="$router.push({ path: `/customers/${$route.params.customerId}/dashboards` })"></wx-button>
    </div>
    <el-tabs type="border-card">
      <el-tab-pane v-for="item in tabPaneList" :key="item.label" :label="item.label">
        <component v-if="JSON.stringify(info) !== '{}'" :is="item.componentName" :dashboardId="dashboardId" :info="info"></component>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import {
  DetailsInfo,
  Log
} from './components'
export default {
  props: ['dashboardId'],
  components: {
    DetailsInfo,
    Log
  },
  data () {
    return {
      tabPaneList: [
        { label: '详情', componentName: 'DetailsInfo' },
        { label: '审计日志', componentName: 'Log' }
      ],
      info: {}
    }
  },
  methods: {
    async getDashboardsInfo () {
      try {
        const result = await this.$api.getDashboardInfos(this.dashboardId)
        this.info = result.data
      } catch (error) {}
    }
  },
  created () {
    this.getDashboardsInfo()
  }
}
</script>
