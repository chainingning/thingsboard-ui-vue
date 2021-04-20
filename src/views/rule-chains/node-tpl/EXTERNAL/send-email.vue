<template>
  <el-form ref="form" :model="form" :rules="rules">
    <div class="name-container">
      <el-form-item label="名称" prop="name">
        <el-input multiple v-model="form.name"></el-input>
      </el-form-item>
      <el-form-item prop="debugMode">
        <el-checkbox v-model="form.debugMode">调试模式</el-checkbox>
      </el-form-item>
    </div>
    <el-form-item prop="useSystemSmtpSettings">
      <el-checkbox v-model="form.useSystemSmtpSettings">使用系统SMTP设置</el-checkbox>
    </el-form-item>
    <template v-if="!form.useSystemSmtpSettings">
      <el-form-item label="协议" prop="smtpProtocol">
        <el-select v-model="form.smtpProtocol">
          <el-option label="SMTP" value="smtp"></el-option>
          <el-option label="SMTPS" value="smtps"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="SMTP主机" prop="smtpHost">
        <el-input v-model="form.smtpHost"></el-input>
      </el-form-item>
      <el-form-item label="SMTP端口" prop="smtpPort">
        <el-input type="number" :min="1" v-model="form.smtpPort"></el-input>
      </el-form-item>
      <el-form-item label="超时时间(毫秒)" prop="timeout">
        <el-input type="number" :min="0" v-model="form.timeout"></el-input>
      </el-form-item>
      <el-form-item prop="enableTls">
        <el-checkbox v-model="form.enableTls">启用TLS</el-checkbox>
      </el-form-item>
      <el-form-item v-if="form.enableTls" label="TLS版本" prop="tlsVersion">
        <el-select v-model="form.tlsVersion">
          <el-option label="TLSv1" value="TLSv1"></el-option>
          <el-option label="TLSv1.1" value="TLSv1.1"></el-option>
          <el-option label="TLSv1.2" value="TLSv1.2"></el-option>
          <el-option label="TLSv1.3" value="TLSv1.3"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="用户名" prop="username">
        <el-input v-model="form.username"></el-input>
      </el-form-item>
      <el-form-item label="密码" prop="password">
        <el-input type="password" v-model="form.password"></el-input>
      </el-form-item>
    </template>
    <el-form-item label="描述" prop="description">
      <el-input type="textarea" autosize v-model="form.description"></el-input>
    </el-form-item>
  </el-form>
</template>

<script>
export default {
  name: 'SendEmail',
  props: ['nodeInfo', 'configurationDescriptor'],
  data () {
    const smtpPort = (rule, value, callback) => {
      if (value === '' || value === undefined) {
        callback(new Error('SMTP端口不能为空'))
      } else if (Number(value) < 1 || Number(value) > 65535) {
        callback(new Error('SMTP端口应在1到65535之间'))
      } else {
        callback()
      }
    }
    const smtpPtimeoutort = (rule, value, callback) => {
      if (value === '' || value === undefined) {
        callback(new Error('超时时间最小为0'))
      } else if (Number(value) < 0) {
        callback(new Error('超时时间不能为空'))
      } else {
        callback()
      }
    }
    return {
      isTplType: false,
      form: {
        name: '',
        debugMode: '',
        useSystemSmtpSettings: '',
        smtpHost: '',
        smtpPort: '',
        username: '',
        password: '',
        smtpProtocol: '',
        timeout: '',
        enableTls: '',
        tlsVersion: '',
        description: ''
      },
      rules: {
        name: [{ required: true, message: '名称不能为空', trigger: 'change' }],
        smtpProtocol: [{ required: true, message: 'SMTP主机不能为空', trigger: 'change' }],
        smtpPort: [{ required: true, validator: smtpPort, trigger: 'change' }],
        smtpPtimeoutort: [{ required: true, validator: smtpPtimeoutort, trigger: 'change' }]
      }
    }
  },
  methods: {
    submit () {
      this.$refs.form.validate(valid => {
        if (!valid) return false
        this.$emit('submit', {
          debugMode: this.form.debugMode || false,
          name: this.form.name,
          configuration: {
            useSystemSmtpSettings: this.form.useSystemSmtpSettings,
            smtpHost: this.form.smtpHost,
            smtpPort: this.form.smtpPort,
            username: this.form.username,
            password: this.form.password,
            smtpProtocol: this.form.smtpProtocol,
            timeout: this.form.timeout,
            enableTls: this.form.enableTls,
            tlsVersion: this.form.tlsVersion
          },
          additionalInfo: {
            description: this.form.description
          },
          tplType: this.isTplType ? 'add' : 'edit'
        })
      })
    },
    init () {
      const { ...defaultConfiguration } = this.configurationDescriptor.nodeDefinition.defaultConfiguration
      const { ...configuration } = this.nodeInfo.configuration || {}
      const { name, debugMode } = this.nodeInfo
      const { description } = this.nodeInfo.additionalInfo || {}
      Object.assign(configuration, {
        name,
        debugMode,
        description
      })
      for (const key in this.form) {
        this.form[key] = this.isTplType ? defaultConfiguration[key] : configuration[key]
      }
    }
  },
  created () {
    this.isTplType = Object.is(JSON.stringify(this.nodeInfo), '{}')
    this.init()
  }
}
</script>
