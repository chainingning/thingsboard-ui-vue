<template>
  <div class="app-container details-container">
    <div class="btn-container">
      <wx-button type="primary" icon="icon-cuo" circle @click="$router.push({ path: '/entity-views' })"></wx-button>
    </div>
    <el-tabs type="border-card">
      <template v-for="item in tabPaneList">
        <el-tab-pane v-if="item.show" :key="item.label" :label="item.label">
          <component
            v-if="JSON.stringify(info) !== '{}'"
            :is="item.componentName"
            :entityId="entityId"
            :info="info"
            @submit="getEntityViewInfo"></component>
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
  props: ['entityId'],
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
        // { label: '警告', componentName: 'Alarm', show: true },
        { label: '事件', componentName: 'Event', show: true },
        { label: '关联', componentName: 'Relation', show: true },
        { label: '审计日志', componentName: 'Log', show: this.$store.getters.userInfo.authority !== 'CUSTOMER_USER' }
      ],
      info: {}
    }
  },
  methods: {
    async getEntityViewInfo () {
      const res = await this.$api.getEntityViewInfo(this.entityId)
      this.info = res.data
    }
  },
  created () {
    this.getEntityViewInfo()
  },
  beforeDestroy () {
    this.$store.dispatch('websocketAllUnsubscribe')
  }
}
</script>

<style lang="scss" scoped>
</style>
