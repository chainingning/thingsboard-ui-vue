<template>
  <div class="app-container details-container">
    <div class="btn-container">
      <wx-button type="primary" icon="icon-cuo" circle @click="$router.push({ path: '/widgets-bundles' })"></wx-button>
    </div>
    <el-tabs type="border-card">
      <el-tab-pane v-for="item in tabPaneList" :key="item.label" :label="item.label">
        <component :is="item.componentName" :id="id"></component>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import DetailsInfo from './components/details'
export default {
  props: ['id'],
  components: { DetailsInfo },
  data () {
    return {
      tabPaneList: [
        { label: '详情', componentName: 'DetailsInfo' }
      ]
    }
  }
}
</script>
