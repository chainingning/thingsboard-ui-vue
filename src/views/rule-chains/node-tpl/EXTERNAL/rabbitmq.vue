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
    <el-form-item label="名称变换格式" prop="exchangeNamePattern">
      <el-input v-model="form.exchangeNamePattern"></el-input>
    </el-form-item>
    <el-form-item label="路由键值格式" prop="routingKeyPattern">
      <el-input v-model="form.routingKeyPattern"></el-input>
    </el-form-item>
    <el-form-item label="消息属性" prop="messageProperties">
      <el-select v-model="form.messageProperties" clearable>
        <el-option label="BASIC" value="BASIC"></el-option>
        <el-option label="TEXT_PLAIN" value="TEXT_PLAIN"></el-option>
        <el-option label="MINIMAL_BASIC" value="MINIMAL_BASIC"></el-option>
        <el-option label="MINIMAL_PERSISTENT_BASIC" value="MINIMAL_PERSISTENT_BASIC"></el-option>
        <el-option label="PERSISTENT_BASIC" value="PERSISTENT_BASIC"></el-option>
        <el-option label="PERSISTENT_TEXT_PLAIN" value="PERSISTENT_TEXT_PLAIN"></el-option>
      </el-select>
    </el-form-item>
    <div class="time-container">
      <el-form-item label="Host" prop="host">
        <el-input v-model="form.host"></el-input>
      </el-form-item>
      <el-form-item label="Port" prop="port">
        <el-input type="number" :min="1" v-model="form.port"></el-input>
      </el-form-item>
    </div>
    <el-form-item label="虚拟主机" prop="virtualHost">
      <el-input v-model="form.virtualHost"></el-input>
    </el-form-item>
    <el-form-item label="用户名" prop="username">
      <el-input v-model="form.username"></el-input>
    </el-form-item>
    <el-form-item label="密码" prop="password">
      <el-input v-model="form.password"></el-input>
    </el-form-item>
    <el-form-item prop="automaticRecoveryEnabled">
      <el-checkbox v-model="form.automaticRecoveryEnabled">自动恢复</el-checkbox>
    </el-form-item>
    <el-form-item label="连接超时(毫秒)" prop="connectionTimeout">
      <el-input type="number" :min="0" v-model="form.connectionTimeout"></el-input>
    </el-form-item>
    <el-form-item label="握手超时(毫秒)" prop="handshakeTimeout">
      <el-input type="number" :min="0" v-model="form.handshakeTimeout"></el-input>
    </el-form-item>
    <el-form-item label="客户端属性" prop="clientProperties" class="attrMapping-container">
      <ul class="attrMapping">
        <li>
          <span>Key</span>
          <span>Value</span>
          <i class="el-icon-circle-plus-outline" @click="add"></i>
        </li>
        <li v-for="(item, index) in form.clientProperties" :key="index">
          <el-input v-model="item.source" :class="item.source ? '' : 'is-error'"></el-input>
          <el-input v-model="item.target" :class="item.target ? '' : 'is-error'"></el-input>
          <i class="el-icon-delete" @click="remove(item)"></i>
        </li>
      </ul>
    </el-form-item>
    <el-form-item label="描述" prop="description">
      <el-input type="textarea" autosize v-model="form.description"></el-input>
    </el-form-item>
  </el-form>
</template>

<script>
export default {
  name: 'Rabbitmq',
  props: ['nodeInfo', 'configurationDescriptor'],
  data () {
    const host = (rule, value, callback) => {
      if (value === '' || value === undefined) {
        callback(new Error('端口不能为空'))
      } else if (Number(value) < 1 || Number(value) > 65535) {
        callback(new Error('端口应在1到65535之间'))
      } else {
        callback()
      }
    }
    const connectionTimeout = (rule, value, callback) => {
      if (value === '' || value === undefined) {
        callback(new Error('连接超时不能为空'))
      } else if (Number(value) < 0) {
        callback(new Error('连接超时最小值为0'))
      } else {
        callback()
      }
    }
    const handshakeTimeout = (rule, value, callback) => {
      if (value === '' || value === undefined) {
        callback(new Error('握手超时不能为空'))
      } else if (Number(value) < 0) {
        callback(new Error('握手超时不能为空'))
      } else {
        callback()
      }
    }
    const clientProperties = (rule, value, callback) => {
      const clientProperties = this.form.clientProperties
      clientProperties.forEach(item => {
        if (item.source === '') {
          callback(new Error('Key不能为空'))
        }
        if (item.target === '') {
          callback(new Error('Value不能为空'))
        }
      })
      callback()
    }
    return {
      isTplType: false,
      form: {
        name: '',
        debugMode: '',
        eNamePattern: '',
        routingKeyPattern: '',
        messageProperties: '',
        host: '',
        port: '',
        virtualHost: '',
        username: '',
        password: '',
        automaticRecoveryEnabled: '',
        connectionTimeout: '',
        handshakeTimeout: '',
        clientProperties: {},
        description: ''
      },
      rules: {
        name: [{ required: true, message: '名称不能为空', trigger: 'change' }],
        host: [{ required: true, validator: host, trigger: 'change' }],
        port: [{ required: true, message: 'port不能为空', trigger: 'change' }],
        connectionTimeout: [{ required: true, validator: connectionTimeout, trigger: 'change' }],
        handshakeTimeout: [{ required: true, validator: handshakeTimeout, trigger: 'change' }],
        clientProperties: [{ required: true, validator: clientProperties, trigger: 'change' }]
      }
    }
  },
  methods: {
    add () {
      this.form.clientProperties.push({
        source: '',
        target: ''
      })
    },
    remove (item) {
      const index = this.form.clientProperties.indexOf(item)
      if (index !== -1) {
        this.form.clientProperties.splice(index, 1)
      }
    },
    submit () {
      this.$refs.form.validate(valid => {
        if (!valid) return false
        const clientProperties = {}
        this.form.clientProperties.forEach(item => {
          clientProperties[item.source] = item.target
        })
        this.$emit('submit', {
          debugMode: this.form.debugMode || false,
          name: this.form.name,
          configuration: {
            exchangeNamePattern: this.form.exchangeNamePattern,
            routingKeyPattern: this.form.routingKeyPattern,
            messageProperties: this.form.messageProperties,
            host: this.form.host,
            port: this.form.port,
            virtualHost: this.form.virtualHost,
            username: this.form.username,
            password: this.form.password,
            automaticRecoveryEnabled: this.form.automaticRecoveryEnabled,
            connectionTimeout: this.form.connectionTimeout,
            handshakeTimeout: this.form.handshakeTimeout,
            clientProperties
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
      const clientProperties = []
      const forConfiguration = this.isTplType ? defaultConfiguration : configuration
      for (const key in forConfiguration.clientProperties) {
        clientProperties.push({
          source: key,
          target: forConfiguration.clientProperties[key]
        })
      }
      forConfiguration.clientProperties = clientProperties
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
  .attrMapping-container {
    /deep/ .el-form-item__label {
      width: 100%;
      text-align: left;
      margin-bottom: 10px;
    }
    &.is-error {
      /deep/ .attrMapping {
        .el-input {
          .el-input__inner {
            border-color: #DCDFE6;
            &:focus {
              border-color: #2DA7E0;
            }
            &:hover {
              border-color: #C0C4CC;
            }
          }
          &.is-error {
            .el-input__inner {
              border-color: #F56C6C;
            }
          }
        }
      }
    }
    .attrMapping {
      width: 100%;
      li {
        float: left;
        width: 100%;
        > span {
          float: left;
          width: 45%;
          text-align: center;
          font-size: 12px;
          color: rgba(0, 0, 0, .54);
          margin-bottom: 10px;
          margin-right: 10px;
        }
        .el-icon-circle-plus-outline {
          color: #67c23a;
          cursor: pointer;
        }
        .el-icon-delete {
          color: #f56c6c;
          cursor: pointer;
        }
        .el-input {
          width: 45%;
          margin-right: 10px;
          margin-bottom: 10px;
        }
      }
    }
  }
</style>
