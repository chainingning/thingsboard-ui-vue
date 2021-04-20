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
    <el-form-item label="字段映射" prop="fieldsMapping" class="fieldsMapping-container">
      <ul class="fieldsMapping">
        <li>
          <span>源字段</span>
          <span>目标属性</span>
          <i class="el-icon-circle-plus-outline" @click="add"></i>
        </li>
        <li v-for="(item, index) in form.fieldsMapping" :key="index">
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
  name: 'OriginatorFields',
  props: ['nodeInfo', 'configurationDescriptor'],
  data () {
    const fieldsMapping = (rule, value, callback) => {
      const fieldsMapping = this.form.fieldsMapping
      if (fieldsMapping.length) {
        fieldsMapping.forEach(item => {
          if (item.source === '') {
            callback(new Error('源字段不能为空'))
          }
          if (item.target === '') {
            callback(new Error('目标属性不能为空'))
          }
        })
        callback()
      } else {
        callback(new Error('应至少指定一个字段映射'))
      }
    }
    return {
      isTplType: false,
      form: {
        name: '',
        debugMode: '',
        fieldsMapping: [],
        description: ''
      },
      rules: {
        name: [{ required: true, message: '名称不能为空', trigger: 'change' }],
        fieldsMapping: [{ required: true, validator: fieldsMapping, trigger: 'change' }]
      }
    }
  },
  methods: {
    add () {
      this.form.fieldsMapping.push({
        source: '',
        target: ''
      })
    },
    remove (item) {
      const index = this.form.fieldsMapping.indexOf(item)
      if (index !== -1) {
        this.form.fieldsMapping.splice(index, 1)
      }
    },
    submit () {
      this.$refs.form.validate(valid => {
        if (!valid) return false
        const fieldsMapping = {}
        this.form.fieldsMapping.forEach(item => {
          fieldsMapping[item.source] = item.target
        })
        this.$emit('submit', {
          debugMode: this.form.debugMode || false,
          name: this.form.name,
          configuration: {
            fieldsMapping
          },
          additionalInfo: {
            description: this.form.description
          },
          tplType: Object.is(JSON.stringify(this.nodeInfo), '{}') || 'edit'
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
      const fieldsMapping = []
      const forConfiguration = this.isTplType ? defaultConfiguration : configuration
      for (const key in forConfiguration.fieldsMapping) {
        fieldsMapping.push({
          source: key,
          target: forConfiguration.fieldsMapping[key]
        })
      }
      forConfiguration.fieldsMapping = fieldsMapping
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
  .fieldsMapping-container {
    /deep/ .el-form-item__label {
      width: 100%;
      text-align: left;
      margin-bottom: 10px;
    }
    &.is-error {
      /deep/ .fieldsMapping {
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
    .fieldsMapping {
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
