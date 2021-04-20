<template>
  <div class="app-container details-container">
    <div class="btn-container">
      <wx-button type="primary" icon="icon-cuo" circle @click="$router.push({ path: '/devices' })"></wx-button>
    </div>
    <el-tabs type="border-card">
      <template v-for="item in tabPaneList">
        <el-tab-pane v-if="item.show" :key="item.label" :label="item.label">
          <component
            v-if="JSON.stringify(info) !== '{}'"
            :is="item.componentName"
            :deviceId="deviceId"
            :info="info"
            @submit="getDeviceInfo">
          </component>
        </el-tab-pane>
      </template>
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
        { label: '详情', componentName: 'DetailsInfo', show: true },
        { label: '属性', componentName: 'Attribute', show: true },
        { label: '最新遥测', componentName: 'Telemetering', show: true },
        { label: '警告', componentName: 'Alarm', show: true },
        { label: '事件', componentName: 'Event', show: true },
        { label: '关联', componentName: 'Relation', show: true },
        { label: '审计日志', componentName: 'Log', show: this.$store.getters.userInfo.authority !== 'CUSTOMER_USER' }
      ],
      info: {}
    }
  },
  methods: {
    async getDeviceInfo () {
      try {
        const result = await this.$api.getItemDeviceInfo(this.deviceId)
        this.info = result.data
      } catch (error) {
        this.$message.error(error.response.data.message)
      }
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
