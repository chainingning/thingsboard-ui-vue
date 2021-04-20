<template>
  <div class="main-container">
    <keep-alive :include="cashViewList">
      <router-view></router-view>
    </keep-alive>
  </div>
</template>

<script>
export default {
  computed: {
    cashViewList () {
      return this.$store.getters.cashViewList
    }
  }
}
</script>

<style lang="scss" scoped>
.main-container {
  height: calc(100% - #{$breadcrumb-height});
  > .app-container {
    width: calc(100% - 40px);
    height: calc(100% - 20px);
    margin-left: 20px;
    border: 1px solid #D5D5D5;
  }
}
</style>
