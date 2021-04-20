<template>
  <div class="app-container">
    <el-form class="filter-container-form" ref="form" :inline="true" :model="form" :rules="rules" size="medium" label-position="top">
      <div class="title">一般政策</div>
      <el-form-item label="在账户被锁定之前，失败的最大登录尝试次数" prop="maxFailedLoginAttempts">
        <el-input placeholder="请输入失败的最大登录尝试次数" v-model="form.maxFailedLoginAttempts"></el-input>
      </el-form-item>
      <el-form-item label="如果用户账户被锁定，请用电子邮件发送通知" prop="userLockoutNotificationEmail">
        <el-input placeholder="请输入电子邮件" v-model="form.userLockoutNotificationEmail"></el-input>
      </el-form-item>
      <div class="title">密码规则</div>
      <el-form-item label="最小密码长度" prop="passwordPolicy.minimumLength">
        <el-input type="number" placeholder="请输入最小密码长度" v-model="form.passwordPolicy.minimumLength"></el-input>
      </el-form-item>
      <el-form-item label="最小大写字母数" prop="passwordPolicy.minimumUppercaseLetters">
        <el-input placeholder="请输入最小大写字母数" v-model="form.passwordPolicy.minimumUppercaseLetters"></el-input>
      </el-form-item>
      <el-form-item label="最小小写字母数" prop="passwordPolicy.minimumLowercaseLetters">
        <el-input placeholder="请输入最小小写字母数" v-model="form.passwordPolicy.minimumLowercaseLetters"></el-input>
      </el-form-item>
      <el-form-item label="最小数字数" prop="passwordPolicy.minimumDigits">
        <el-input type="number" placeholder="请输入最小数字数" v-model="form.passwordPolicy.minimumDigits"></el-input>
      </el-form-item>
      <el-form-item label="最小特殊字符数" prop="passwordPolicy.minimumSpecialCharacters">
        <el-input placeholder="请输入最小特殊字符数" v-model="form.passwordPolicy.minimumSpecialCharacters"></el-input>
      </el-form-item>
      <el-form-item label="密码有效天数" prop="passwordPolicy.passwordExpirationPeriodDays">
        <el-input type="number" placeholder="请输入密码有效天数" v-model="form.passwordPolicy.passwordExpirationPeriodDays"></el-input>
      </el-form-item>
      <el-form-item label="密码重用频率(天)" prop="passwordPolicy.passwordReuseFrequencyDays">
        <el-input type="number" placeholder="请输入密码重用频率" v-model="form.passwordPolicy.passwordReuseFrequencyDays"></el-input>
      </el-form-item>
      <br>
      <el-form-item>
        <el-button type="primary" @click="save">保存</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
export default {
  data () {
    return {
      form: {
        maxFailedLoginAttempts: '',
        passwordPolicy: {
          minimumDigits: '',
          minimumLength: '',
          minimumLowercaseLetters: '',
          minimumSpecialCharacters: '',
          minimumUppercaseLetters: '',
          passwordExpirationPeriodDays: '',
          passwordReuseFrequencyDays: ''
        },
        userLockoutNotificationEmail: ''
      },
      rules: {
        userLockoutNotificationEmail: [{ type: 'email', message: '邮箱格式不正确' }],
        'passwordPolicy.minimumLength': [{ required: true, message: '最小密码长度不能为空', trigger: 'change' }]
      }
    }
  },
  methods: {
    save () {
      this.$refs.form.validate(async valid => {
        if (!valid) return false
        await this.$api.postAdminSecuritySettings(this.form)
        this.$message.success('保存成功')
      })
    },
    async init () {
      const result = await this.$api.getAdminSecuritySettings()
      for (const key in this.form) {
        if (typeof key === 'object') {
          for (const _key in this.form[key]) {
            this.form[key][_key] = result.data[key][_key]
          }
        } else {
          this.form[key] = result.data[key]
        }
      }
    }
  },
  created () {
    this.init()
  }
}
</script>

<style lang="scss" scoped>
.app-container {
  overflow: scroll;
  /deep/ .filter-container-form {
    padding: 32px 30px;
    .title {
      font-size: 20px;
      color: #000;
      font-family: PingFangSC-Medium;
      line-height: 28px;
      margin-bottom: 34px;
    }
    .el-form-item {
      margin-bottom: 31px;
      margin-right: 77px;
      .el-form-item__label {
        font-size: 14px;
        color: #000;
        line-height: 20px;
        padding: 0;
        margin-bottom: 13px;
      }
      .el-input__inner {
        width: 252px;
        background-color:#F5F6FA;
        color: #1C1C1C;
        font-family: PingFangSC-Medium;
        border: none;
      }
      &:nth-child(2), &:nth-child(3) {
        margin-bottom: 41px;
        margin-right: 112px;
        .el-input__inner {
          width: 280px;
        }
      }
      input::-webkit-input-placeholder {
        color: #A6A6A6;
      }
      input::-moz-input-placeholder {
        color: #A6A6A6;
      }
      input::-ms-input-placeholder {
        color:#A6A6A6;
      }
    }
  }
}
</style>
