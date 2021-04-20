<template>
  <el-form ref="form" :model="form" :rules="rules">
    <div class="name-container">
      <el-form-item
        label="名称"
        prop="name"
        :rules="[{ required: true, message: '名称不能为空', trigger: 'change' }]">
        <el-input multiple v-model="form.name"></el-input>
      </el-form-item>
      <el-form-item prop="debugMode">
        <el-checkbox v-model="form.debugMode">调试模式</el-checkbox>
      </el-form-item>
    </div>
    <el-form-item label="鉴权服务的地址" prop="urlAuthentication">
      <el-input v-model="form.urlAuthentication"></el-input>
    </el-form-item>
    <el-form-item label="ESB管理平台的地址" prop="urlManagementPlatform">
      <el-input v-model="form.urlManagementPlatform"></el-input>
    </el-form-item>
    <el-form-item label="appKey" prop="appKey">
      <el-input v-model="form.appKey"></el-input>
      <span class="desc">32位长度的字符串，业务系统的应用的唯一标识，以及作为生成鉴权签名的参数</span>
    </el-form-item>
    <el-form-item label="appSecret" prop="appSecret">
      <el-input v-model="form.appSecret"></el-input>
      <span class="desc">32位长度的字符串，生成鉴权签名的参数</span>
    </el-form-item>
    <el-form-item label="kafka的地址" prop="bootstrapServers">
      <el-input v-model="form.bootstrapServers"></el-input>
    </el-form-item>
    <el-form-item label="业务系统要发布或订阅的主题" prop="topicPattern">
      <el-input v-model="form.topicPattern"></el-input>
      <el-checkbox v-model="form.security">是否启用安全认证</el-checkbox>
    </el-form-item>
    <template v-if="form.security">
      <el-form-item label="安全认证需要的用户名" prop="security">
        <el-input v-model="form.securityUsername"></el-input>
      </el-form-item>
      <el-form-item label="安全认证需要的密码" prop="security">
        <el-input v-model="form.securityPassword"></el-input>
      </el-form-item>
    </template>
    <el-form-item label="描述" prop="description">
      <el-input type="textarea" autosize v-model="form.description"></el-input>
    </el-form-item>
  </el-form>
</template>

<script>
export default {
  name: 'BonengKfaka',
  props: ['nodeInfo', 'configurationDescriptor'],
  data () {
    return {
      isTplType: false,
      form: {
        name: '',
        debugMode: '',
        urlAuthentication: '',
        urlManagementPlatform: '',
        appKey: '',
        appSecret: '',
        bootstrapServers: '',
        topicPattern: '',
        security: false,
        securityUsername: '',
        securityPassword: '',
        description: ''
      },
      rules: {
        name: [{ required: true, message: '名称不能为空', trigger: 'change' }],
        urlAuthentication: [{ required: true, message: '鉴权服务的地址不能为空', trigger: 'change' }],
        urlManagementPlatform: [{ required: true, message: 'ESB管理平台的地址不能为空', trigger: 'change' }],
        appKey: [{ required: true, message: 'appKey不能为空', trigger: 'change' }],
        appSecret: [{ required: true, message: 'appSecret不能为空', trigger: 'change' }],
        bootstrapServers: [{ required: true, message: 'kafka的地址不能为空', trigger: 'change' }],
        topicPattern: [{ required: true, message: '名称不能为空', trigger: 'change' }]
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
            urlAuthentication: this.form.urlAuthentication,
            urlManagementPlatform: this.form.urlManagementPlatform,
            appKey: this.form.appKey,
            appSecret: this.form.appSecret,
            bootstrapServers: this.form.bootstrapServers,
            topicPattern: this.form.topicPattern,
            security: this.form.security,
            securityUsername: this.form.securityUsername,
            securityPassword: this.form.securityPassword
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
