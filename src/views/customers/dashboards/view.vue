<template>
  <div class="app-container">
    仪表板
  </div>
</template>

<script>
export default {
  props: ['customerId', 'dashboardId'],
  created () {
    console.log(this.customerId, this.dashboardId)
  }
}
</script>
