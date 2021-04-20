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
    <el-form-item label="目标URL格式" prop="restEndpointUrlPattern">
      <el-input v-model="form.restEndpointUrlPattern"></el-input>
      <span class="desc">HTTP URL地址格式,使用 ${metaKeyName} 替换元数据中的变量</span>
    </el-form-item>
    <el-form-item label="请求方法" prop="requestMethod">
      <el-select v-model="form.requestMethod">
        <el-option label="GET" value="GET"></el-option>
        <el-option label="POST" value="POST"></el-option>
        <el-option label="PUT" value="PUT"></el-option>
        <el-option label="DELETE" value="DELETE"></el-option>
      </el-select>
    </el-form-item>
    <el-form-item prop="useSimpleClientHttpFactory">
      <el-checkbox v-model="form.useSimpleClientHttpFactory">使用简单那客户端HTTP工厂</el-checkbox>
    </el-form-item>
    <el-form-item v-if="!form.useSimpleClientHttpFactory" label="读取超时(以毫秒为单位)" prop="readTimeoutMs">
      <el-input type="number" :num="0" v-model="form.readTimeoutMs"></el-input>
      <span class="desc">值为0表示无限超时</span>
    </el-form-item>
    <el-form-item label="最大并行请求数" prop="maxParallelRequestsCount">
      <el-input type="number" :num="0" v-model="form.maxParallelRequestsCount"></el-input>
      <span class="desc">值为0表示在并行处理中没有限制</span>
    </el-form-item>
    <el-form-item label="请求头" prop="headers" class="attrMapping-container">
      <div class="desc">使用 ${metaKeyName} 替换元数据中header/value的值</div>
      <ul class="attrMapping">
        <li>
          <span>键</span>
          <span>键值</span>
          <i class="el-icon-circle-plus-outline" @click="add"></i>
        </li>
        <li v-for="(item, index) in form.headers" :key="index">
          <el-input v-model="item.source" :class="item.source ? '' : 'is-error'"></el-input>
          <el-input v-model="item.target" :class="item.target ? '' : 'is-error'"></el-input>
          <i class="el-icon-delete" @click="remove(item)"></i>
        </li>
      </ul>
    </el-form-item>
    <el-form-item prop="useRedisQueueForMsgPersistence">
      <el-checkbox v-model="form.useRedisQueueForMsgPersistence">将redis队列用于消息持久性</el-checkbox>
    </el-form-item>
    <template v-if="form.useRedisQueueForMsgPersistence">
      <el-form-item prop="trimQueue">
        <el-checkbox v-model="form.trimQueue">整理redis队列</el-checkbox>
      </el-form-item>
      <el-form-item label="Redis队列最大大小" prop="maxQueueSize">
        <el-input type="number" :min="0" v-model="form.maxQueueSize"></el-input>
      </el-form-item>
    </template>
    <el-form-item label="描述" prop="description">
      <el-input type="textarea" autosize v-model="form.description"></el-input>
    </el-form-item>
  </el-form>
</template>

<script>
export default {
  name: 'RestApiCall',
  props: ['nodeInfo', 'configurationDescriptor'],
  data () {
    const headers = (rule, value, callback) => {
      const headers = this.form.headers
      headers.forEach(item => {
        if (item.source === '') {
          callback(new Error('Header不能为空'))
        }
        if (item.target === '') {
          callback(new Error('Value不能为空'))
        }
      })
      callback()
    }
    const readTimeoutMs = (rule, value, callback) => {
      if (value === '' || value === undefined) {
        callback(new Error('以毫秒为单位的读取超时不能为空'))
      } else if (Number(value) < 0) {
        callback(new Error('以毫秒为单位的读取超时最小值为0'))
      } else {
        callback()
      }
    }
    const maxParallelRequestsCount = (rule, value, callback) => {
      if (value === '' || value === undefined) {
        callback(new Error('最大并行请求数不能为空'))
      } else if (Number(value) < 0) {
        callback(new Error('最大并行请求数最小值为0'))
      } else {
        callback()
      }
    }
    const maxQueueSize = (rule, value, callback) => {
      if (value === '' || value === undefined) {
        callback(new Error('Redis队列最大大小不能为空'))
      } else if (Number(value) < 0) {
        callback(new Error('Redis队列最大大小最小值为0'))
      } else {
        callback()
      }
    }
    return {
      isTplType: false,
      form: {
        name: '',
        debugMode: '',
        headers: {},
        restEndpointUrlPattern: '',
        requestMethod: '',
        useSimpleClientHttpFactory: '',
        useRedisQueueForMsgPersistence: '',
        trimQueue: '',
        maxQueueSize: '',
        maxParallelRequestsCount: '',
        readTimeoutMs: '',
        description: ''
      },
      rules: {
        name: [{ required: true, message: '名称不能为空', trigger: 'change' }],
        headers: [{ required: true, validator: headers, trigger: 'change' }],
        restEndpointUrlPattern: [{ required: true, message: '目标URL格式不能为空', trigger: 'change' }],
        readTimeoutMs: [{ required: true, validator: readTimeoutMs, trigger: 'change' }],
        maxParallelRequestsCount: [{ required: true, validator: maxParallelRequestsCount, trigger: 'change' }],
        maxQueueSize: [{ required: true, validator: maxQueueSize, trigger: 'change' }]
      }
    }
  },
  methods: {
    add () {
      this.form.headers.push({
        source: '',
        target: ''
      })
    },
    remove (item) {
      const index = this.form.headers.indexOf(item)
      if (index !== -1) {
        this.form.headers.splice(index, 1)
      }
    },
    submit () {
      this.$refs.form.validate(valid => {
        if (!valid) return false
        const headers = {}
        this.form.headers.forEach(item => {
          headers[item.source] = item.target
        })
        this.$emit('submit', {
          debugMode: this.form.debugMode || false,
          name: this.form.name,
          configuration: {
            headers,
            restEndpointUrlPattern: this.form.restEndpointUrlPattern,
            requestMethod: this.form.requestMethod,
            useSimpleClientHttpFactory: this.form.useSimpleClientHttpFactory,
            useRedisQueueForMsgPersistence: this.form.useRedisQueueForMsgPersistence,
            trimQueue: this.form.trimQueue,
            maxQueueSize: this.form.maxQueueSize,
            maxParallelRequestsCount: this.form.maxParallelRequestsCount,
            readTimeoutMs: this.form.readTimeoutMs
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
      const headers = []
      const forConfiguration = this.isTplType ? defaultConfiguration : configuration
      for (const key in forConfiguration.headers) {
        headers.push({
          source: key,
          target: forConfiguration.headers[key]
        })
      }
      forConfiguration.headers = headers
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
