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
    <el-form-item label="属性映射" prop="attrMapping" class="attrMapping-container">
      <el-checkbox v-model="form.telemetry">最新遥测</el-checkbox>
      <ul class="attrMapping">
        <li>
          <span>{{ form.telemetry ? '源遥测' :  '源属性'}}</span>
          <span>目标属性</span>
          <i class="el-icon-circle-plus-outline" @click="add"></i>
        </li>
        <li v-for="(item, index) in form.attrMapping" :key="index">
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
  name: 'CustomerAttributes',
  props: ['nodeInfo', 'configurationDescriptor'],
  data () {
    const attrMapping = (rule, value, callback) => {
      const attrMapping = this.form.attrMapping
      const isTelemetry = this.form.telemetry
      if (attrMapping.length) {
        attrMapping.forEach(item => {
          if (item.source === '') {
            callback(new Error(`${isTelemetry ? '源遥测' : '源属性'}不能为空`))
          }
          if (item.target === '') {
            callback(new Error('目标属性不能为空'))
          }
        })
        callback()
      } else {
        callback(new Error('应至少指定一个属性映射'))
      }
    }
    return {
      isTplType: false,
      form: {
        name: '',
        debugMode: '',
        telemetry: false,
        attrMapping: [],
        description: ''
      },
      rules: {
        name: [{ required: true, message: '名称不能为空', trigger: 'change' }],
        attrMapping: [{ required: true, validator: attrMapping, trigger: 'change' }]
      }
    }
  },
  methods: {
    add () {
      this.form.attrMapping.push({
        source: '',
        target: ''
      })
    },
    remove (item) {
      const index = this.form.attrMapping.indexOf(item)
      if (index !== -1) {
        this.form.attrMapping.splice(index, 1)
      }
    },
    submit () {
      this.$refs.form.validate(valid => {
        if (!valid) return false
        const attrMapping = {}
        this.form.attrMapping.forEach(item => {
          attrMapping[item.source] = item.target
        })
        this.$emit('submit', {
          debugMode: this.form.debugMode || false,
          name: this.form.name,
          configuration: {
            telemetry: this.form.telemetry,
            attrMapping
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
      const attrMapping = []
      const forConfiguration = this.isTplType ? defaultConfiguration : configuration
      for (const key in forConfiguration.attrMapping) {
        attrMapping.push({
          source: key,
          target: forConfiguration.attrMapping[key]
        })
      }
      forConfiguration.attrMapping = attrMapping
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
