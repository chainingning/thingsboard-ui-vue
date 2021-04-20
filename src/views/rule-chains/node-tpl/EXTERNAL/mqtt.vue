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
    <el-form-item label="Topic格式" prop="topicPattern">
      <el-input v-model="form.topicPattern"></el-input>
      <span class="desc">MQTT Topic 格式,使用 ${metaKeyName} 替换元数据中的变量</span>
    </el-form-item>
    <div class="host-container">
      <el-form-item label="Host" prop="host">
        <el-input v-model="form.host"></el-input>
      </el-form-item>
      <el-form-item label="Port" prop="port">
        <el-input type="number" :num="1" v-model="form.port"></el-input>
      </el-form-item>
      <el-form-item label="连接超时(秒)" prop="connectTimeoutSec">
        <el-input type="number" :num="1" v-model="form.connectTimeoutSec"></el-input>
      </el-form-item>
    </div>
    <el-form-item label="客户端ID" prop="clientId">
      <el-input v-model="form.clientId"></el-input>
    </el-form-item>
    <el-form-item prop="cleanSession">
      <el-checkbox v-model="form.cleanSession">清除会话</el-checkbox>
    </el-form-item>
    <el-form-item prop="ssl">
      <el-checkbox v-model="form.ssl">启用SSL</el-checkbox>
    </el-form-item>
    <el-form-item>
      <el-collapse>
        <el-collapse-item>
          <template slot="title">
            <span>凭证</span>
            <span>基本</span>
          </template>
          <el-form-item label="凭证类型" prop="type">
            <el-select v-model="form.type">
              <el-option label="匿名" value="anonymous"></el-option>
              <el-option label="基本" value="basic"></el-option>
              <el-option label="PEM" value="cert.PEM"></el-option>
            </el-select>
          </el-form-item>
          <template v-if="form.type === 'basic'">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="form.username"></el-input>
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input type="password" v-model="form.password"></el-input>
            </el-form-item>
          </template>
          <template v-if="form.type === 'cert.PEM'">
            <el-form-item label="CA证书文件" prop="caCert">
              <el-upload
                ref="caCertUpload"
                drag
                action="#"
                :show-file-list="false"
                :http-request="caCertHttpRequest">
                <i class="el-icon-upload"></i>
                <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
              </el-upload>
              <div class="desc">{{ form.caCertFileName }}</div>
            </el-form-item>
            <el-form-item label="证书文件" prop="cert">
              <el-upload
                ref="certUpload"
                drag
                action="#"
                :show-file-list="false"
                :http-request="certHttpRequest">
                <i class="el-icon-upload"></i>
                <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
              </el-upload>
              <div class="desc">{{ form.certFileName }}</div>
            </el-form-item>
            <el-form-item label="私人密钥文件" prop="privateKey">
              <el-upload
                ref="privateKeyUpload"
                drag
                action="#"
                :show-file-list="false"
                :http-request="privateKeyHttpRequest">
                <i class="el-icon-upload"></i>
                <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
              </el-upload>
              <div class="desc">{{ form.privateKeyFileName }}</div>
            </el-form-item>
            <el-form-item label="私人密钥密码" prop="privatePassword">
              <el-input type="password" v-model="form.privatePassword"></el-input>
            </el-form-item>
          </template>
        </el-collapse-item>
      </el-collapse>
    </el-form-item>
    <el-form-item label="描述" prop="description">
      <el-input type="textarea" autosize v-model="form.description"></el-input>
    </el-form-item>
  </el-form>
</template>

<script>
import { getBase64 } from '@/utils'
export default {
  name: 'Mqtt',
  props: ['nodeInfo', 'configurationDescriptor'],
  data () {
    const port = (rule, value, callback) => {
      if (value === '' || value === undefined) {
        callback(new Error('port不能为空'))
      } else if (Number(value) <= 1 || Number(value) >= 65535) {
        callback(new Error('port取值应在1到65535之间'))
      } else {
        callback()
      }
    }
    const connectTimeoutSec = (rule, value, callback) => {
      if (value === '' || value === undefined) {
        callback(new Error('连接超时不能为空'))
      } else if (Number(value) <= 1 || Number(value) >= 200) {
        callback(new Error('连接超时取值应在1到200之间'))
      } else {
        callback()
      }
    }
    return {
      isTplType: false,
      form: {
        name: '',
        debugMode: '',
        topicPattern: '',
        host: '',
        port: '',
        connectTimeoutSec: '',
        type: '',
        username: '',
        password: '',
        caCertFileName: '',
        caCert: '',
        certFileName: '',
        cert: '',
        privateKeyFileName: '',
        privateKey: '',
        privatePassword: '',
        description: '',
        cleanSession: '',
        clientId: ''
      },
      rules: {
        name: [{ required: true, message: '名称不能为空', trigger: 'change' }],
        topicPattern: [{ required: true, message: 'Topic格式不能为空', trigger: 'change' }],
        host: [{ required: true, message: 'host不能为空', trigger: 'change' }],
        port: [{ required: true, validator: port, trigger: 'change' }],
        connectTimeoutSec: [{ required: true, validator: connectTimeoutSec, trigger: 'change' }],
        type: [{ required: true, message: '凭证类型不能为空', trigger: 'change' }],
        username: [{ required: true, message: '用户名不能为空', trigger: 'change' }],
        caCert: [{ required: true, message: 'CA证书文件不能为空', trigger: 'change' }],
        cert: [{ required: true, message: '证书文件不能为空', trigger: 'change' }],
        privateKey: [{ required: true, message: '私人密钥文件不能为空', trigger: 'change' }],
        privatePassword: [{ required: true, message: '私人密钥密码不能为空', trigger: 'change' }]
      }
    }
  },
  methods: {
    caCertHttpRequest (data) {
      this.form.caCertFileName = data.file.name
      getBase64(data.file).then(resBase64 => {
        this.form.caCert = resBase64.split(',')[1]
      })
    },
    certHttpRequest (data) {
      this.form.certFileName = data.file.name
      getBase64(data.file).then(resBase64 => {
        this.form.cert = resBase64.split(',')[1]
      })
    },
    privateKeyHttpRequest (data) {
      this.form.privateKeyFileName = data.file.name
      getBase64(data.file).then(resBase64 => {
        this.form.privateKey = resBase64.split(',')[1]
      })
    },
    submit () {
      this.$refs.form.validate(valid => {
        if (!valid) return false
        const params = {
          debugMode: this.form.debugMode,
          name: this.form.name,
          configuration: {
            topicPattern: this.form.topicPattern,
            host: this.form.host,
            port: this.form.port,
            connectTimeoutSec: this.form.connectTimeoutSec,
            clientId: this.form.clientId,
            cleanSession: this.form.cleanSession,
            ssl: this.form.ssl
          },
          additionalInfo: {
            description: this.form.description
          },
          tplType: this.isTplType ? 'add' : 'edit'
        }
        if (this.form.type === 'anonymous') {
          params.configuration.credentials = {
            type: this.form.type
          }
        } else if (this.form.type === 'basic') {
          params.configuration.credentials = {
            type: this.form.type,
            username: this.form.username,
            password: this.form.password
          }
        } else if (this.form.type === 'cert.PEM') {
          params.configuration.credentials = {
            type: this.form.type,
            caCertFileName: this.form.caCertFileName,
            caCert: this.form.caCert,
            certFileName: this.form.certFileName,
            cert: this.form.cert,
            privateKeyFileName: this.form.privateKeyFileName,
            privateKey: this.form.privateKey,
            password: this.form.privatePassword
          }
        }
        this.$emit('submit', params)
      })
    },
    init () {
      const { ...defaultConfiguration } = this.configurationDescriptor.nodeDefinition.defaultConfiguration
      const { ...configuration } = this.nodeInfo.configuration || {}
      const { name, debugMode } = this.nodeInfo
      const { description } = this.nodeInfo.additionalInfo || {}
      const { ...credentials } = (this.nodeInfo.configuration && this.nodeInfo.configuration.credentials) || {}
      Object.assign(configuration, {
        name,
        debugMode,
        description,
        ...credentials
      })
      Object.assign(defaultConfiguration, {
        ...defaultConfiguration.credentials
      })
      console.log(this.nodeInfo)
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

<style lang="scss" scoped>
  .host-container {
    @include clearfix();
    .el-form-item {
      float: left;
      width: calc((100% - 20px) / 3);
      margin-right: 10px;
      &:last-child {
        margin-right: 0;
      }
    }
  }
</style>
