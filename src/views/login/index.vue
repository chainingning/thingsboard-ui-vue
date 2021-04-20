<template>
  <div class="login-container">
    <img class="login-bg" :src="require('@img/login-bg.png')">
    <el-form :model="form" :rules="rules" ref="form" class="login-form" label-position="left">
      <div class="project-title">{{ require('@/settings.js').title }}</div>
      <el-form-item class="login-form-username" label="用户名" prop="username">
        <el-input placeholder="请输入用户名" v-model="form.username" name="username" @keyup.enter.native="login" auto-complete="on"></el-input>
      </el-form-item>
      <el-form-item class="login-form-pwd" label="密码" prop="password">
        <el-input type="password" auto-complete="new-password" placeholder="请输入密码" v-model="form.password" @keyup.enter.native="login"></el-input>
        <a href="javascript:void(0);" class="forget-pwd" @click="$router.push({ path: '/login/resetPasswordRequest' })">忘记密码?</a>
      </el-form-item>
      <el-form-item class="login-form-btn">
        <el-button type="primary" :loading="loading" @click="login">登 录</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
export default {
  data () {
    return {
      form: {
        username: '',
        password: ''
      },
      rules: {
        username: { required: true, message: '用户名不能为空', trigger: 'change' },
        password: { required: true, message: '密码不能为空', trigger: 'change' }
      },
      loading: false
    }
  },
  methods: {
    login () {
      this.$refs.form.validate(async valid => {
        if (!valid) return false
        this.loading = true
        try {
          await this.$store.dispatch('login', this.form)
        } catch (error) {}
        this.loading = false
      })
    },
    closeDialog () {
      this.$store.dispatch('logout')
      const dialog = document.getElementsByClassName('icloud-dialog__wrapper')
      for (let i = 0; i < dialog.length; i++) {
        dialog[i].style.display = 'none'
      }
    }
  },
  created () {
    this.$store.dispatch('websocketAllUnsubscribe')
    const websocket = this.$store.state.websocket.websocket
    websocket && websocket.close()
    this.closeDialog()
  }
}
</script>

<style lang="scss" scoped>
.login-container {
  width: 100%;
  height: 100%;
  min-height: 969px;
  position: relative;
  .login-bg {
    width: calc(100% - 765px);
    height: 100%;
  }
  .login-form {
    width: 509px;
    position: absolute;
    top: 241px;
    right: 131px;
    .project-title {
      color: #000;
      font-size: 48px;
      font-family: PingFangSC-Medium;
      font-weight: bolder;
      line-height: 67px;
      margin-bottom: 98px;
    }
    /deep/ .el-form-item {
      margin-bottom: 37px;
      .el-form-item__label {
        font-size: 16px;
        font-family: PingFangSC-Medium;
        color: #939393;
        line-height: 22px;
        margin-bottom: 17px;
        &::before {
          content: '';
        }
      }
      .el-input__inner {
        height: 59px;
        background-color: #F5F6FA;
        color: #1C1C1C;
        font-size: 18px;
        font-family: PingFangSC-Medium;
        border: none;
      }
      input::-webkit-input-placeholder {
        color: #888888;
      }
      input::-moz-input-placeholder {
        color: #888888;
      }
      input::-ms-input-placeholder {
        color: #888888;
      }
      .forget-pwd {
        font-size: 16px;
        font-family: PingFangSC-Medium;
        color: #939393;
        line-height: 22px;
        float: right;
        margin-top: 14px;
      }
      &.login-form-btn {
        margin-top: 65px;
        .el-button {
          border-color: #6993FF;
          background-color: #6993FF;
          border-radius: 8px;
          padding: 11px 90px;
          span {
            color: #fff;
            font-size: 28px;
            font-family: PingFangSC-Medium;
          }
        }
      }
    }
  }
}
</style>
