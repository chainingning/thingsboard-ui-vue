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
    <el-form-item label="方向" prop="direction">
      <el-select v-model="form.direction">
        <el-option label="从" value="FROM"></el-option>
        <el-option label="到" value="TO"></el-option>
      </el-select>
    </el-form-item>
    <el-form-item label="类型" prop="entityType">
      <el-select v-model="form.entityType">
        <el-option label="设备" value="DEVICE"></el-option>
        <el-option label="资产" value="ASSET"></el-option>
        <el-option label="实体视图" value="ENTITY_VIEW"></el-option>
        <el-option label="设备管理员" value="TENANT"></el-option>
        <el-option label="用户" value="CUSTOMER"></el-option>
        <el-option label="应用" value="DASHBOARD"></el-option>
      </el-select>
    </el-form-item>
    <el-form-item label="名称模式" prop="entityNamePattern" v-if="form.entityType">
      <el-input v-model="form.entityNamePattern"></el-input>
      <span class="desc">名称模式,使用 ${metaKeyName} 替换元数据中的变量</span>
    </el-form-item>
    <el-form-item label="关系类型模式" prop="relationType">
      <el-input v-model="form.relationType"></el-input>
      <span class="desc">关系类型模式,使用 ${metaKeyName} 替换元数据中的变量</span>
    </el-form-item>
    <el-form-item prop="createEntityIfNotExists">
      <el-checkbox v-model="form.createEntityIfNotExists">如果不存在则创建新实体</el-checkbox>
      <div class="desc">如果不存在,将在上面创建一个新实体集</div>
    </el-form-item>
    <el-form-item label="类型模式" prop="entityTypePattern" v-if="(form.entityType === 'DEVICE' || form.entityType === 'ASSET') && form.createEntityIfNotExists">
      <el-input v-model="form.entityTypePattern"></el-input>
      <span class="desc">类型模式,使用 ${metaKeyName} 替换元数据中的变量</span>
    </el-form-item>
    <el-form-item prop="removeCurrentRelations">
      <el-checkbox v-model="form.removeCurrentRelations">删除当前关系</el-checkbox>
      <div class="desc">基于方向和类型,从传入消息的发起者中删除当前关系</div>
    </el-form-item>
    <el-form-item prop="changeOriginatorToRelatedEntity">
      <el-checkbox v-model="form.changeOriginatorToRelatedEntity">将创建者更改为相关实体</el-checkbox>
      <div class="desc">用于将提交的消息作为来自另一个实体的消息进行处理</div>
    </el-form-item>
    <el-form-item label="实体缓存过期时间(秒)" prop="entityCacheExpiration">
      <el-input type="number" :min="0" v-model="form.entityCacheExpiration"></el-input>
      <span class="desc">指定允许存储找到的实体记录的最大时间间隔0值表示记录永不过期</span>
    </el-form-item>
    <el-form-item label="描述" prop="description">
      <el-input type="textarea" autosize v-model="form.description"></el-input>
    </el-form-item>
  </el-form>
</template>

<script>
export default {
  name: 'CreateRelation',
  props: ['nodeInfo', 'configurationDescriptor'],
  data () {
    const entityCacheExpiration = (rule, value, callback) => {
      if (Number(value) < 0) {
        callback(new Error('实体缓存过期时间应大于或等于0'))
      } else if (value === '' || value === undefined) {
        callback(new Error('实体缓存过期时间不能为空'))
      } else {
        callback()
      }
    }
    return {
      isTplType: false,
      form: {
        name: '',
        debugMode: '',
        direction: '',
        entityType: '',
        entityNamePattern: '',
        entityTypePattern: '',
        relationType: '',
        createEntityIfNotExists: false,
        removeCurrentRelations: false,
        changeOriginatorToRelatedEntity: false,
        entityCacheExpiration: '',
        description: ''
      },
      rules: {
        name: [{ required: true, message: '名称不能为空', trigger: 'change' }],
        direction: [{ required: true, message: '方向不能为空', trigger: 'change' }],
        entityType: [{ required: true, message: '类型不能为空', trigger: 'change' }],
        entityNamePattern: [{ required: true, message: '名称模式不能为空', trigger: 'change' }],
        entityTypePattern: [{ required: true, message: '类型模式不能为空', trigger: 'change' }],
        relationType: [{ required: true, message: '关系模式不能为空', trigger: 'change' }],
        entityCacheExpiration: [{ required: true, validator: entityCacheExpiration, trigger: 'change' }]
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
            direction: this.form.direction,
            entityType: this.form.entityType,
            entityNamePattern: this.form.entityNamePattern,
            entityTypePattern: this.form.entityTypePattern,
            relationType: this.form.relationType,
            createEntityIfNotExists: this.form.createEntityIfNotExists,
            removeCurrentRelations: this.form.removeCurrentRelations,
            changeOriginatorToRelatedEntity: this.form.changeOriginatorToRelatedEntity,
            entityCacheExpiration: this.form.entityCacheExpiration
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
</style>
