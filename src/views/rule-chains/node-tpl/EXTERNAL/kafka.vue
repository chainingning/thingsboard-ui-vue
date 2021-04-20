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
    <el-form-item label="Topic 格式" prop="topicPattern">
      <el-input v-model="form.topicPattern"></el-input>
    </el-form-item>
    <el-form-item label="Bootstrap服务器" prop="bootstrapServers">
      <el-input v-model="form.bootstrapServers"></el-input>
    </el-form-item>
    <el-form-item label="如果失败后自动重试次数" prop="retries">
      <el-input type="number" :min="0" v-model="form.retries"></el-input>
    </el-form-item>
    <el-form-item label="产生的批处理文件大小(字节)" prop="batchSize">
      <el-input type="number" :min="0" v-model="form.batchSize"></el-input>
    </el-form-item>
    <el-form-item label="本地缓冲时间(毫秒)" prop="linger">
      <el-input type="number" :min="0" v-model="form.linger"></el-input>
    </el-form-item>
    <el-form-item label="客户端缓冲区的最大大小(字节)" prop="bufferMemory">
      <el-input type="number" :min="0" v-model="form.bufferMemory"></el-input>
    </el-form-item>
    <el-form-item label="确认数" prop="acks">
      <el-select v-model="form.acks">
        <el-option label="all" value="all"></el-option>
        <el-option label="-1" value="-1"></el-option>
        <el-option label="0" value="0"></el-option>
        <el-option label="1" value="1"></el-option>
      </el-select>
    </el-form-item>
    <el-form-item label="键序列化器" prop="keySerializer">
      <el-input v-model="form.keySerializer"></el-input>
    </el-form-item>
    <el-form-item label="值序列化器" prop="valueSerializer">
      <el-input v-model="form.valueSerializer"></el-input>
    </el-form-item>
    <el-form-item label="消息属性" prop="otherProperties" class="attrMapping-container">
      <ul class="attrMapping">
        <li>
          <span>Key</span>
          <span>Value</span>
          <i class="el-icon-circle-plus-outline" @click="add"></i>
        </li>
        <li v-for="(item, index) in form.otherProperties" :key="index">
          <el-input v-model="item.source" :class="item.source ? '' : 'is-error'"></el-input>
          <el-input v-model="item.target" :class="item.target ? '' : 'is-error'"></el-input>
          <i class="el-icon-delete" @click="remove(item)"></i>
        </li>
      </ul>
    </el-form-item>
    <el-form-item prop="addMetadataKeyValuesAsKafkaHeaders">
      <el-checkbox v-model="form.addMetadataKeyValuesAsKafkaHeaders">将消息元数据键值对添加到Kafka记录头</el-checkbox>
      <div class="desc">如果选中,则来自消息元数据的键值对将使用默认的字符集编码后以字节数组添加到传出记录头中</div>
    </el-form-item>
    <el-form-item label="字符集" prop="kafkaHeadersCharset" v-if="form.addMetadataKeyValuesAsKafkaHeaders">
      <el-select v-model="form.kafkaHeadersCharset">
        <el-option label="US-ASCII" value="US-ASCII"></el-option>
        <el-option label="ISO-8859-1" value="ISO-8859-1"></el-option>
        <el-option label="UTF-8" value="UTF-8"></el-option>
        <el-option label="UTF-16BE" value="UTF-16BE"></el-option>
        <el-option label="UTF-16LE" value="UTF-16LE"></el-option>
        <el-option label="UTF-16" value="UTF-16"></el-option>
      </el-select>
    </el-form-item>
    <el-form-item label="描述" prop="description">
      <el-input type="textarea" autosize v-model="form.description"></el-input>
    </el-form-item>
  </el-form>
</template>

<script>
export default {
  name: 'Kafka',
  props: ['nodeInfo', 'configurationDescriptor'],
  data () {
    const otherProperties = (rule, value, callback) => {
      const otherProperties = this.form.otherProperties
      otherProperties.forEach(item => {
        if (item.source === '') {
          callback(new Error('消息域不能为空'))
        }
        if (item.target === '') {
          callback(new Error('列不能为空'))
        }
      })
      callback()
    }
    const retries = (rule, value, callback) => {
      if (Number(value) < 0) {
        callback(new Error('失败后自动重试次数最小值为0'))
      } else {
        callback()
      }
    }
    const batchSize = (rule, value, callback) => {
      if (Number(value) < 0) {
        callback(new Error('产生的批处理文件大小最小值为0'))
      } else {
        callback()
      }
    }
    const linger = (rule, value, callback) => {
      if (Number(value) < 0) {
        callback(new Error('本地缓冲时间最小值为0'))
      } else {
        callback()
      }
    }
    const bufferMemory = (rule, value, callback) => {
      if (Number(value) < 0) {
        callback(new Error('客户端缓冲区的最小值为0'))
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
        bootstrapServers: '',
        retries: '',
        batchSize: '',
        linger: '',
        bufferMemory: '',
        acks: '',
        keySerializer: '',
        valueSerializer: '',
        otherProperties: [],
        kafkaHeadersCharset: '',
        addMetadataKeyValuesAsKafkaHeaders: '',
        description: ''
      },
      rules: {
        name: [{ required: true, message: '名称不能为空', trigger: 'change' }],
        topicPattern: [{ required: true, message: 'Topic格式不能为空', trigger: 'change' }],
        bootstrapServers: [{ required: true, message: 'Bootstrap服务器不能为空', trigger: 'change' }],
        keySerializer: [{ required: true, message: '键序列化器不能为空', trigger: 'change' }],
        valueSerializer: [{ required: true, message: '值序列化器不能为空', trigger: 'change' }],
        kafkaHeadersCharset: [{ required: true, message: '字符集不能为空', trigger: 'change' }],
        otherProperties: [{ required: true, validator: otherProperties, trigger: 'change' }],
        retries: [{ validator: retries, trigger: 'change' }],
        batchSize: [{ validator: batchSize, trigger: 'change' }],
        linger: [{ validator: linger, trigger: 'change' }],
        bufferMemory: [{ validator: bufferMemory, trigger: 'change' }]
      }
    }
  },
  methods: {
    add () {
      this.form.otherProperties.push({
        source: '',
        target: ''
      })
    },
    remove (item) {
      const index = this.form.otherProperties.indexOf(item)
      if (index !== -1) {
        this.form.otherProperties.splice(index, 1)
      }
    },
    submit () {
      this.$refs.form.validate(valid => {
        if (!valid) return false
        const otherProperties = {}
        this.form.otherProperties.forEach(item => {
          otherProperties[item.source] = item.target
        })
        this.$emit('submit', {
          debugMode: this.form.debugMode || false,
          name: this.form.name,
          configuration: {
            otherProperties,
            topicPattern: this.form.topicPattern,
            bootstrapServers: this.form.bootstrapServers,
            retries: this.form.retries,
            batchSize: this.form.batchSize,
            linger: this.form.linger,
            bufferMemory: this.form.bufferMemory,
            acks: this.form.acks,
            keySerializer: this.form.keySerializer,
            valueSerializer: this.form.valueSerializer,
            kafkaHeadersCharset: this.form.kafkaHeadersCharset,
            addMetadataKeyValuesAsKafkaHeaders: this.form.addMetadataKeyValuesAsKafkaHeaders
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
      const otherProperties = []
      const forConfiguration = this.isTplType ? defaultConfiguration : configuration
      for (const key in forConfiguration.otherProperties) {
        otherProperties.push({
          source: key,
          target: forConfiguration.otherProperties[key]
        })
      }
      forConfiguration.otherProperties = otherProperties
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
