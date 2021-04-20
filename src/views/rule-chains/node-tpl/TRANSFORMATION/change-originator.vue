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
    <el-form-item label="消息源" prop="originatorSource">
      <el-select v-model="form.originatorSource">
        <el-option label="用户" value="CUSTOMER"></el-option>
        <el-option label="设备管理员" value="TENANT"></el-option>
        <el-option label="关联" value="RELATED"></el-option>
        <el-option label="告警源" value="ALARM_ORIGINATOR"></el-option>
      </el-select>
    </el-form-item>
    <template v-if="form.originatorSource === 'RELATED'">
      <el-form-item label="关系查询"></el-form-item>
      <el-checkbox v-model="form.fetchLastLevelOnly">只匹配最后一层关联</el-checkbox>
      <div class="relation-container">
        <el-form-item label="方向" prop="direction" class="direction">
          <el-select v-model="form.direction">
            <el-option label="从" value="FROM"></el-option>
            <el-option label="到" value="TO"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="最大关联级别" prop="maxLevel">
          <el-input type="number" v-model="form.maxLevel" :min="1"></el-input>
        </el-form-item>
      </div>
      <el-form-item label="关系过滤器" prop="filters" class="attrMapping-container">
        <ul class="attrMapping">
          <li>
            <span>类型</span>
            <span>实体类型</span>
            <i class="el-icon-circle-plus-outline" @click="add()"></i>
          </li>
          <li v-for="(item, index) in form.filters" :key="index">
            <el-input v-model="item.relationType" :class="item.relationType ? '' : 'is-error'"></el-input>
            <el-select
              :class="item.entityTypes.length ? '' : 'is-error'"
              v-model="item.entityTypes"
              multiple
              filterable
              default-first-option>
              <el-option
                v-for="item in options"
                :key="item.value"
                :label="item.label"
                :value="item.value">
              </el-option>
            </el-select>
            <i class="el-icon-delete" @click="remove(item)"></i>
          </li>
        </ul>
      </el-form-item>
    </template>
    <el-form-item label="描述" prop="description">
      <el-input type="textarea" autosize v-model="form.description"></el-input>
    </el-form-item>
  </el-form>
</template>

<script>
export default {
  name: 'ChangeOriginator',
  props: ['nodeInfo', 'configurationDescriptor'],
  data () {
    const filters = (rule, value, callback) => {
      const filters = this.form.filters
      if (filters.length) {
        filters.forEach(item => {
          if (item.relationType === '') {
            callback(new Error('类型不能为空'))
          }
        })
        callback()
      } else {
        callback()
      }
    }
    const maxLevel = (rule, value, callback) => {
      if (Number(value) < 1 && value !== '') {
        callback(new Error('最大关联级别必须大于或等于1或为空'))
      } else {
        callback()
      }
    }
    return {
      isTplType: false,
      form: {
        name: '',
        debugMode: '',
        fetchLastLevelOnly: '',
        direction: '',
        maxLevel: '',
        filters: [],
        description: '',
        originatorSource: ''
      },
      rules: {
        name: [{ required: true, message: '名称不能为空', trigger: 'change' }],
        direction: [{ required: true, message: '方向不能为空', trigger: 'change' }],
        filters: [{ required: true, validator: filters, trigger: 'change' }],
        maxLevel: [{ validator: maxLevel, trigger: 'change' }],
        originatorSource: [{ required: true, message: 'Originator源不能为空', trigger: 'change' }]
      },
      options: [
        { label: '设备', value: 'DEVICE' },
        { label: '资产', value: 'ASSET' },
        { label: '实体视图', value: 'ENTITY_VIEW' },
        { label: '设备管理员', value: 'TENANT' },
        { label: '客户', value: 'CUSTOMER' },
        { label: '应用', value: 'DASHBOARD' }
      ]
    }
  },
  methods: {
    add () {
      this.form.filters.push({
        relationType: '',
        entityTypes: []
      })
    },
    remove (item) {
      const index = this.form.filters.indexOf(item)
      if (index !== -1) {
        this.form.filters.splice(index, 1)
      }
    },
    submit () {
      this.$refs.form.validate(valid => {
        if (!valid) return false
        this.$emit('submit', {
          debugMode: this.form.debugMode || false,
          name: this.form.name,
          configuration: {
            originatorSource: this.form.originatorSource,
            relationsQuery: {
              direction: this.form.direction,
              maxLevel: this.form.maxLevel,
              filters: this.form.filters,
              fetchLastLevelOnly: this.form.fetchLastLevelOnly
            }
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
        description,
        ...configuration.relationsQuery
      })
      Object.assign(defaultConfiguration, {
        ...defaultConfiguration.relationsQuery
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
        .el-input, .el-select {
          width: 45% !important;
          margin-right: 10px;
          margin-bottom: 10px;
        }
      }
    }
  }
</style>
