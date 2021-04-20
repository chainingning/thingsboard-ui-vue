<template>
  <div class="layout-wrapper">
    <el-header>
      <logo></logo>
      <user-menu></user-menu>
    </el-header>
    <el-container>
      <el-aside>
        <sidebar></sidebar>
      </el-aside>
      <el-main :class="!isBreadcrumb ? 'hidden-breadcrumb' : ''">
        <breadcrumb v-if="isBreadcrumb"></breadcrumb>
        <router-view></router-view>
      </el-main>
    </el-container>
  </div>
</template>

<script>
import { Logo, UserMenu, Breadcrumb, Sidebar } from './components'
export default {
  components: {
    Logo,
    UserMenu,
    Breadcrumb,
    Sidebar
  },
  computed: {
    isBreadcrumb () {
      const meta = this.$route.meta
      if (meta) {
        return meta.isBreadcrumb !== false
      }
      return true
    }
  }
}
</script>

<style lang="scss" scoped>
.layout-wrapper {
  height: 100%;
  background-color: #F4F6FA;
  .el-header {
    height: $header-height !important;
    padding: 0;
    position: relative;
    background-color: #fff;
    border-bottom: 1px solid rgba(224, 224, 224, 0.5);
    /deep/ .logo-container, .el-breadcrumb {
      float: left;
    }
  }
  .el-container {
    height: calc(100% - #{$header-height});
    .el-aside {
      width: $sidebar-width !important;
    }
    .el-main {
      padding: 0;
      > .app-container {
        width: calc(100% - 40px);
        height: calc(100% - #{$breadcrumb-height} - 20px);
        margin-left: 20px;
        border: 1px solid #D5D5D5;
      }
      &.hidden-breadcrumb {
        > .app-container {
          height: 100%;
        }
      }
    }
  }
}
</style>
