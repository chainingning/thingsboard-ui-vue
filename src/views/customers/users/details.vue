<template>
  <div class="app-container details-container">
    <div class="btn-container">
      <wx-button type="primary" icon="icon-cuo" circle @click="$router.push({ path: `/customers/${$route.params.customerId}/users` })"></wx-button>
    </div>
    <el-tabs type="border-card">
      <el-tab-pane v-for="item in tabPaneList" :key="item.label" :label="item.label">
        <component
          v-if="JSON.stringify(info) !== '{}'"
          :is="item.componentName"
          :userId="userId"
          :info="info"
          @submit="getUserInfo"></component>
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
  props: ['userId'],
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
    async getUserInfo () {
      const result = await this.$api.getUserInfo(this.userId)
      this.info = result.data
    }
  },
  created () {
    this.getUserInfo()
  }
}
</script>
