<template>
  <div class="app-container details-container">
    <div class="btn-container">
      <wx-button type="primary" icon="icon-cuo" circle @click="$router.push({ path: '/dashboards' })"></wx-button>
    </div>
    <el-tabs type="border-card">
      <template v-for="item in tabPaneList">
        <el-tab-pane v-if="item.show" :key="item.label" :label="item.label">
          <component :is="item.componentName" :id="id"></component>
        </el-tab-pane>
      </template>
    </el-tabs>
  </div>
</template>

<script>
import {
  DetailsInfo,
  Log
} from './components'
export default {
  props: ['id'],
  components: {
    DetailsInfo,
    Log
  },
  data () {
    return {
      tabPaneList: [
        { label: '详情', componentName: 'DetailsInfo', show: true },
        { label: '审计日志', componentName: 'Log', show: this.$store.getters.userInfo.authority !== 'CUSTOMER_USER' }
      ]
    }
  }
}
</script>

<style lang="scss" scoped>
</style>
