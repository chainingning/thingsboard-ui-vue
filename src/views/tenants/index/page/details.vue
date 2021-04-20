<template>
  <div class="app-container details-container">
    <div class="btn-container">
      <wx-button type="primary" icon="icon-cuo" circle @click="$router.push({ path: '/tenants' })"></wx-button>
    </div>
    <el-tabs type="border-card">
      <el-tab-pane v-for="item in tabPaneList"  :key="item.label" :label="item.label">
        <component
          v-if="JSON.stringify(info) !== '{}'"
          :is="item.componentName"
          :tenantId="tenantId"
          :info="info"></component>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import {
  DetailsInfo,
  Attribute,
  Telemetering,
  Alarm,
  Event,
  Relation
} from '../components'
export default {
  props: ['tenantId'],
  components: {
    DetailsInfo,
    Attribute,
    Telemetering,
    Alarm,
    Event,
    Relation
  },
  data () {
    return {
      tabPaneList: [
        { label: '详情', componentName: 'DetailsInfo' },
        // { label: '属性', componentName: 'Attribute' },
        { label: '最新遥测', componentName: 'Telemetering' }
        // { label: '警告', componentName: 'Alarm' },
        // { label: '事件', componentName: 'Event' },
        // { label: '关联', componentName: 'Relation' }
      ],
      info: {}
    }
  },
  methods: {
    async getTenantsInfo () {
      const result = await this.$api.getTenantsInfo(this.tenantId)
      this.info = result.data
    }
  },
  created () {
    this.getTenantsInfo()
  },
  beforeDestroy () {
    this.$store.dispatch('websocketAllUnsubscribe')
  }
}
</script>
