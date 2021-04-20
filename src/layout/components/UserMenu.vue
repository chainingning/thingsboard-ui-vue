<template>
  <div class="user-container">
    <el-dropdown trigger="click" @command="handleCommand">
      <i class="iconfont icon-avatar"></i>
      <el-dropdown-menu slot="dropdown">
        <el-dropdown-item command="logout">退出登录</el-dropdown-item>
        <el-dropdown-item command="profile">个人信息</el-dropdown-item>
        <el-dropdown-item command="about">关于</el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>
    <div class="account">
      <span class="username">{{ username }}</span>
      <span class="user-author">{{ authority }}</span>
    </div>
    <icloud-dialog
      :title="title"
      :visible.sync="visible"
      class="aboutProject"
    >
      <el-form :model="form">
        <el-form-item class="center">序列号: {{ form.serialNumber }}</el-form-item>
        <el-form-item class="center">已授权</el-form-item>
        <el-form-item class="center">{{ form.copyright }}</el-form-item>
      </el-form>
    </icloud-dialog>
  </div>
</template>

<script>
export default {
  data () {
    return {
      userType: {
        TENANT_ADMIN: '租户管理员',
        SYS_ADMIN: '系统管理员',
        CUSTOMER_USER: '客户'
      },
      visible: false,
      title: '关于机场物联网平台',
      form: {
        serialNumber: '7e384c50-f183-11ea-883b-adb8230f2d6e',
        copyright: 'Copyright © 2020 浙江网新电气技术有限公司'
      }
    }
  },
  computed: {
    username () {
      const firstName = this.$store.getters.userInfo.firstName
      const lastName = this.$store.getters.userInfo.lastName
      const name = this.$store.getters.userInfo.name
      if ((firstName === null && lastName === null) || (firstName === '' && lastName === '')) {
        return name
      } else {
        return `${lastName} ${firstName}`
      }
    },
    authority () {
      return this.userType[this.$store.getters.userInfo.authority]
    }
  },
  methods: {
    async handleCommand (command) {
      if (command === 'logout') {
        try {
          await this.$api.logout()
        } catch (error) {
          this.$router.push({ path: '/login' })
        }
        this.$store.dispatch('logout')
      } else if (command === 'profile') {
        this.$router.push({ path: '/profile' })
      } else if (command === 'about') {
        this.visible = true
        const title = window.PROJECT_TITLE
        if (title) {
          this.title = `关于${title}`
        }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.user-container {
  width: 240px;
  height: 100%;
  float: right;
  .el-dropdown, .account {
    float: left;
  }
  .el-dropdown {
    height: 100%;
    width: 55px;
    display: flex;
    align-items: center;
    .icon-avatar {
      font-size: 55px;
      cursor: pointer;
    }
  }
  .account {
    margin-left: 27px;
    width: calc(100% - 27px - 55px);
    .username, .user-author {
      float: left;
      width: 100%;
      line-height: 1;
      font-size: 16px;
      color: #000;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .username {
      margin: 20px 0 9px 0;
    }
  }
}
.aboutProject {
  /deep/ .icloud-dialog__body {
    padding: 30px 30px 10px 30px !important;
    .el-form-item {
      &:nth-child(1), &:nth-child(2) {
        .el-form-item__content {
          font-size: 20px;
        }
      }
      &:nth-child(2) {
        padding-bottom: 40px;
        font-weight: bolder;
      }
    }
  }
}
</style>
