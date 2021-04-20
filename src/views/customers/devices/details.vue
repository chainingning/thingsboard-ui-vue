<template>
  <div class="app-container details-container">
    <div class="btn-container">
      <wx-button type="primary" icon="icon-cuo" circle @click="$router.push({ path: `/customers/${$route.params.customerId}/devices` })"></wx-button>
    </div>
    <el-tabs type="border-card">
      <el-tab-pane v-for="item in tabPaneList" :key="item.label" :label="item.label">
        <component
          v-if="JSON.stringify(info) !== '{}'"
          :is="item.componentName"
          :deviceId="deviceId"
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
  Relation,
  Log
} from './components'
export default {
  props: ['deviceId'],
  components: {
    DetailsInfo,
    Attribute,
    Telemetering,
    Alarm,
    Event,
    Relation,
    Log
  },
  data () {
    return {
      tabPaneList: [
        { label: '详情', componentName: 'DetailsInfo' },
        { label: '属性', componentName: 'Attribute' },
        { label: '最新遥测', componentName: 'Telemetering' },
        { label: '警告', componentName: 'Alarm' },
        { label: '事件', componentName: 'Event' },
        { label: '关联', componentName: 'Relation' },
        { label: '审计日志', componentName: 'Log' }
      ],
      info: {}
    }
  },
  methods: {
    async getDeviceInfo () {
      try {
        const result = await this.$api.getItemDeviceInfo(this.deviceId)
        this.info = result.data
      } catch (error) {}
    }
  },
  created () {
    this.getDeviceInfo()
  },
  beforeDestroy () {
    this.$store.dispatch('websocketAllUnsubscribe')
  }
}
</script>
