<template>
  <div class="psd-container">
    <el-form :model="form" :rules="rules" ref="form" class="login-form" label-position="left" @submit.native.prevent>
      <img :src="require('@img/psd-form.png')">
      <div class="project-title">重置证书Key</div>
      <el-form-item class="login-form-cert-key" label="证书Key" prop="certKey">
        <el-input type="password" auto-complete="new-password" v-model="form.certKey" @keyup.enter.native="submit"></el-input>
      </el-form-item>
      <el-form-item class="login-form-btn">
        <el-button type="primary" size="medium" :loading="loading" @click="submit">确定</el-button>
        <el-button size="medium" @click="$router.push({ path: '/login' })">取消</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
export default {
  data () {
    return {
      form: {
        certKey: ''
      },
      rules: {
        certKey: { required: true, message: '证书Key不能为空', trigger: 'change' }
      },
      loading: false
    }
  },
  methods: {
    submit () {
      this.$refs.form.validate(async valid => {
        if (!valid) return false
        this.loading = true
        try {
          await this.$api.postResetCertKey({
            ...this.form,
            resetToken: this.$route.query.resetToken
          })
          this.$message.success('重置证书Key成功')
          this.$router.push({ path: '/login' })
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
      &.login-form-cert-key {
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
      &.login-form-btn {
        margin-top: 21px;
        float: right;
        .el-button {
          span {
            font-size: 14px;
          }
        }
      }
    }
  }
}
</style>
