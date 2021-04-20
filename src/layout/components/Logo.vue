<template>
  <div class="logo-container">
    <img class="fl" :src="require('@img/logo.png')">
    <div class="logo fl">{{ require('@/settings.js').title }}</div>
  </div>
</template>

<script>
export default {}
</script>

<style lang="scss" scoped>
.logo-container {
  line-height: $header-height;
  float: left;
  img {
    height: 40px;
    margin: 20px 20px 0 30px;
  }
  .logo {
    color: #000;
    font-size: 28px;
    font-family: PingFangSC-Medium;
    // text-indent: 30px;
  }
}
</style>
