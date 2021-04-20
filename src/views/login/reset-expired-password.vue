<template>
  <div class="psd-container">
    <el-form :model="form" :rules="rules" ref="form" class="login-form" label-position="left">
      <img :src="require('@img/psd-form.png')">
      <div class="project-title">重置密码</div>
      <el-form-item class="login-form-pwd" label="密码" prop="password">
        <el-input type="password" auto-complete="new-password" v-model="form.password" @keyup.enter.native="resetPassword"></el-input>
      </el-form-item>
      <el-form-item class="login-form-check-pwd" label="确认密码" prop="checkPassword">
        <el-input type="password" auto-complete="new-password" v-model="form.checkPassword" @keyup.enter.native="resetPassword"></el-input>
      </el-form-item>
      <el-form-item class="login-form-btn">
        <el-button type="primary" size="medium" :loading="loading" @click="resetPassword">重置密码</el-button>
        <el-button size="medium" @click="$router.push({ path: '/login' })">取消</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import { setToken } from '@/utils/token'
export default {
  data () {
    const validatePassword = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('请输入密码'))
      } else {
        if (this.form.checkPassword !== '') {
          this.$refs.form.validateField('checkPassword')
        }
        callback()
      }
    }
    const validateCheckPassword = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('请再次输入密码'))
      } else if (value !== this.form.password) {
        callback(new Error('两次输入密码不一致!'))
      } else {
        callback()
      }
    }
    return {
      form: {
        password: '',
        checkPassword: ''
      },
      rules: {
        password: { required: true, validator: validatePassword, trigger: 'change' },
        checkPassword: { required: true, validator: validateCheckPassword, trigger: 'change' }
      },
      loading: false
    }
  },
  methods: {
    resetPassword () {
      this.$refs.form.validate(async valid => {
        if (!valid) return false
        this.loading = true
        try {
          const result = await this.$api.postResetPassword({
            resetToken: this.$route.query.resetToken,
            password: this.form.password
          })
          setToken(result.data.token, result.data.refreshToken)
          const userInfo = await this.$api.getUser()
          this.$store.commit('SET_USER_INFO', userInfo.data)
          this.$store.commit('SET_PERMISSION_ROUTER', userInfo.data.authority)
          this.$router.push({ path: this.$store.getters.permissionRouter[0].path })
        } catch (error) {
          console.log(error)
        }
        this.loading = false
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.psd-container {
  width: 100%;
  height: 100%;
  min-height: 969px;
  background: url('~@img/psd-bg.png') no-repeat;
  display: flex;
  justify-content: center;
  align-items: center;
  .login-form {
    width: 580px;
    height: 597px;
    border-radius: 18px;
    box-shadow: 0px 13px 61px 0px rgba(169, 169, 169, 0.37);
    background-color: #fff;
    > img {
      width: 100%;
      height: 113px;
    }
    .project-title {
      color: #000;
      font-size: 28px;
      font-family: PingFangSC-Medium;
      font-weight: bolder;
      height: 84px;
      line-height: 66px;
      text-align: center;
    }
    /deep/ .el-form-item {
      padding-left: 38px;
      padding-right: 33px;
      .el-form-item__label {
        font-size: 16px;
        font-family: PingFangSC-Medium;
        color: #939393;
        line-height: 22px;
        margin-bottom: 13px;
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
        color: #CACACA;
      }
      input::-moz-input-placeholder {
        color:#CACACA;
      }
      input::-ms-input-placeholder {
        color:#CACACA;
      }
      &.login-form-pwd {
        margin: 51px 0 31px 0;
        position: relative;
        &::before {
          content: '';
          position: absolute;
          height: 1px;
          width: 100%;
          left: 0;
          top: -51px;
          background-color: #979797;
          opacity: 0.3;
        }
      }
      &.login-form-check-pwd {
        margin-bottom: 47px;
        position: relative;
        &::after {
          content: '';
          position: absolute;
          height: 1px;
          width: 100%;
          left: 0;
          bottom: -47px;
          background-color: #979797;
          opacity: 0.3;
        }
      }
      &.login-form-btn {
        margin-top: 21px;
        float: right;
        .el-button {
          border-radius: 6px;
          span {
            font-size: 14px;
            font-family: PingFangSC-Medium;
          }
        }
      }
    }
  }
}
</style>
