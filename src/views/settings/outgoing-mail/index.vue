<template>
  <div class="app-container">
    <el-form class="filter-container-form" ref="form" :inline="true" :model="form" :rules="rules" size="medium" label-position="top">
      <el-form-item label="邮件来自" prop="mailFrom">
        <el-input placeholder="请输入邮件" v-model="form.mailFrom"></el-input>
      </el-form-item>
      <el-form-item label="SMTP协议" prop="smtpProtocol">
        <el-select v-model="form.smtpProtocol" placeholder="请选择SMTP协议">
          <el-option label="SMTP" value="smtp"></el-option>
          <el-option label="SMTPS" value="smtps"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="SMTP主机" prop="smtpHost">
        <el-input placeholder="请输入SMTP主机" v-model="form.smtpHost"></el-input>
      </el-form-item>
      <el-form-item label="SMTP端口" prop="smtpPort">
        <el-input placeholder="请输入SMTP端口" type="number" v-model="form.smtpPort"></el-input>
      </el-form-item>
      <el-form-item label="超时(ms)" prop="timeout">
        <el-input placeholder="请输入超时时间" type="number" v-model="form.timeout"></el-input>
      </el-form-item>
      <el-form-item label="用户名" prop="username">
        <el-input placeholder="请输入用户名" v-model="form.username"></el-input>
      </el-form-item>
      <el-form-item label="密码" prop="password">
        <el-input placeholder="请输入密码" type="password" v-model="form.password"></el-input>
      </el-form-item>
      <br>
      <el-form-item prop="enableTls">
        <el-checkbox v-model="form.enableTls">启用TLS</el-checkbox>
      </el-form-item>
      <br>
      <template v-if="form.enableTls">
        <el-form-item label="TLS版本" prop="tlsVersion">
          <el-select placeholder="请选择TLS版本" v-model="form.tlsVersion">
            <el-option label="TLSv1" value="TLSv1"></el-option>
            <el-option label="TLSv1.1" value="TLSv1.1"></el-option>
            <el-option label="TLSv1.2" value="TLSv1.2"></el-option>
            <el-option label="TLSv1.3" value="TLSv1.3"></el-option>
          </el-select>
        </el-form-item>
        <br>
      </template>
      <el-form-item prop="enableProxy">
        <el-checkbox v-model="form.enableProxy">启用代理</el-checkbox>
      </el-form-item>
      <br>
      <template v-if="form.enableProxy">
        <el-form-item label="代理主机" prop="proxyHost">
          <el-input placeholder="请输入代理主机" v-model="form.proxyHost"></el-input>
        </el-form-item>
        <el-form-item label="代理端口" prop="proxyPost">
          <el-input placeholder="请输入代理端口" v-model="form.proxyPost"></el-input>
        </el-form-item>
        <el-form-item label="代理用户" prop="proxyUser">
          <el-input placeholder="请输入代理用户" v-model="form.proxyUser"></el-input>
        </el-form-item>
        <el-form-item label="代理密码" prop="proxyPassword">
          <el-input placeholder="请输入代理密码" type="password" v-model="form.proxyPassword"></el-input>
        </el-form-item>
        <br>
      </template>
      <el-form-item>
        <el-button type="primary" @click="submit('email')">发送测试邮件</el-button>
        <el-button type="primary" @click="submit('save')">保存</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
export default {
  data () {
    return {
      form: {
        mailFrom: '',
        smtpProtocol: '',
        smtpHost: '',
        smtpPort: '',
        timeout: '',
        enableTls: false,
        tlsVersion: '',
        enableProxy: false,
        proxyHost: '',
        proxyUser: '',
        proxyPassword: '',
        username: '',
        password: ''
      },
      rules: {
        mailFrom: [
          { required: true, message: '邮件来自不能为空', trigger: 'change' }
        ],
        smtpProtocol: [{ message: 'SMTP协议不能为空', trigger: 'change' }],
        smtpHost: [{ required: true, message: 'SMTP主机不能为空', trigger: 'change' }],
        smtpPort: [{ required: true, message: 'SMTP端口不能为空', trigger: 'change' }],
        smtpPtimeoutort: [{ required: true, message: '超时不能为空', trigger: 'change' }],
        tlsVersion: [{ message: 'TLS版本不能为空', trigger: 'change' }],
        proxyHost: [{ required: true, message: 'Proxy host不能为空', trigger: 'change' }],
        proxyPost: [{ required: true, message: 'Proxy post不能为空', trigger: 'change' }],
        proxyUser: [{ required: true, message: 'Proxy user不能为空', trigger: 'change' }],
        proxyPassword: [{ required: true, message: 'Proxy password不能为空', trigger: 'change' }],
        username: [{ required: true, message: '用户名不能为空', trigger: 'change' }],
        password: [{ required: true, message: '密码不能为空', trigger: 'change' }]
      },
      info: {}
    }
  },
  methods: {
    submit (type) {
      this.$refs.form.validate(async valid => {
        if (!valid) return false
        const params = {
          ...this.info,
          jsonValue: {
            ...this.info.jsonValue,
            ...this.form
          }
        }
        const apiName = type === 'email' ? 'postAdminSettingsTestMail' : 'postAdminSettings'
        const msg = type === 'email' ? '测试邮件发送成功' : '保存成功'
        await this.$api[apiName](params)
        this.$message.success(msg)
      })
    },
    async init () {
      const result = await this.$api.getAdminSettingsMail()
      this.info = result.data
      for (const key in this.form) {
        const value = result.data.jsonValue[key]
        const isNull = value === null || value === undefined
        this.form[key] = isNull ? '' : value
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
