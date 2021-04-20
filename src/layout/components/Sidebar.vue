<template>
  <el-menu router class="el-menu" :default-openeds="['/settings']">
    <template v-for="item in sidebarList">
      <el-submenu v-if="Object.is(item.isChildren, true) && !Object.is(item.isShow, false)" :key="item.path" :index="item.path" :class="item.className">
        <template slot="title">
          <i class="iconfont" :class="item.children[0].meta.icon"></i>
          <span slot="title">{{ item.children[0].meta.title }}</span>
        </template>
        <el-menu-item-group>
          <el-menu-item
            v-for="row in item.children[0].children"
            :key="row.path"
            :class="`${item.path}/${row.path}` === $route.path ? 'active' : ''"
            :index="`${item.path}/${row.path}`"
          >{{ row.meta.title }}</el-menu-item>
        </el-menu-item-group>
      </el-submenu>
      <el-menu-item v-else-if="!Object.is(item.isShow, false)" :key="item.path" :index="item.path" :class="item.className">
        <i class="iconfont" :class="item.children[0].meta.icon"></i>
        <span slot="title">{{ item.children[0].meta.title }}</span>
      </el-menu-item>
    </template>
  </el-menu>
</template>

<script>
export default {
  computed: {
    sidebarList () {
      let permissionRouter = this.$store.getters.permissionRouter
      permissionRouter = permissionRouter.map(ele => {
        return {
          ...ele,
          className: ele.path === `/${this.$route.path.split('/')[1]}` ? 'active' : ''
        }
      })
      return permissionRouter
    }
  }
}
</script>

<style lang="scss" scoped>
.el-menu {
  height: 100%;
  width: calc(100% - 22px);
  float: right;
  > .el-menu-item {
    height: 48px;
    line-height: 48px;
    background-color: #fff;
    position: relative;
    span {
      font-size: 16px;
      color: #000;
    }
    i {
      color: #6993FF;
      font-size: 16px;
      margin-right: 20px;
    }
    &.active {
      background-color: #6993FF;
      span, i {
        color: #fff;
      }
      &:before {
        content: '';
        position: absolute;
        height: 100%;
        width: 10px;
        background-color: #6993FF;
        top: 0;
        left: -22px;
      }
    }
  }
  /deep/ .el-submenu {
    > .el-submenu__title {
      height: 48px;
      line-height: 48px;
      background-color: #fff;
      position: relative;
      span {
        font-size: 16px;
        color: #000;
        margin-left: 20px;
      }
      i {
        color: #6993FF;
        font-size: 16px;
      }
    }
    &.active {
      > .el-submenu__title {
        background-color: #6993FF;
        span, i {
          color: #fff;
        }
        &:before {
          content: '';
          position: absolute;
          height: 100%;
          width: 10px;
          background-color: #6993FF;
          top: 0;
          left: -22px;
        }
      }
    }
    .el-menu-item-group {
      .el-menu-item {
        &.active {
          color: #409EFF;
        }
      }
    }
  }
}
</style>
