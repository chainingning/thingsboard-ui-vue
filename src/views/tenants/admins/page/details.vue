<template>
  <div class="app-container details-container">
    <div class="btn-container">
      <wx-button type="primary" icon="icon-cuo" circle @click="$router.push({ path: `/tenants/${$route.params.tenantId}/admins` })"></wx-button>
    </div>
    <el-tabs type="border-card">
      <el-tab-pane v-for="item in tabPaneList" :key="item.label" :label="item.label">
        <component
          v-if="JSON.stringify(info) !== '{}'"
          :is="item.componentName"
          :adminId="adminId"
          :info="info"
          @submit="getUserInfo"></component>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import { DetailsInfo } from '../components'
export default {
  props: ['adminId'],
  components: { DetailsInfo },
  data () {
    return {
      tabPaneList: [
        { label: '详情', componentName: 'DetailsInfo' }
      ],
      info: {}
    }
  },
  methods: {
    async getUserInfo () {
      const result = await this.$api.getUserInfo(this.adminId)
      this.info = result.data
    }
  },
  created () {
    this.getUserInfo()
  }
}
</script>
