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
    <el-form-item prop="checkForSingleEntity">
      <el-checkbox v-model="form.checkForSingleEntity">检查与特定实体的关系</el-checkbox>
    </el-form-item>
    <el-form-item label="方向" prop="direction">
      <el-select v-model="form.direction">
        <el-option label="从" value="FROM"></el-option>
        <el-option label="到" value="TO"></el-option>
      </el-select>
    </el-form-item>
    <el-form-item label="类型" prop="entityType" v-if="form.checkForSingleEntity">
      <el-select v-model="form.entityType" @change="form.entityId = ''">
        <el-option
          v-for="item in entityTypeList"
          :key="item.value"
          :label="item.label"
          :value="item.value" />
      </el-select>
    </el-form-item>
    <el-form-item
      v-if="form.checkForSingleEntity"
      :label="entityTypeList.filter(item => item.value === form.entityType)[0].label"
      prop="entityId">
      <el-select
        v-model="form.entityId"
        filterable
        remote
        :remote-method="remoteMethod"
        @focus="remoteMethod()">
        <el-option v-for="item in types" :key="item.id.id" :label="item.name" :value="item.id.id"></el-option>
      </el-select>
    </el-form-item>
    <el-form-item label="关联类型" prop="relationType">
      <el-select allow-create filterable v-model="form.relationType">
        <el-option label="Contains" value="Contains"></el-option>
        <el-option label="Manages" value="Manages"></el-option>
      </el-select>
    </el-form-item>
    <el-form-item label="描述" prop="description">
      <el-input type="textarea" autosize v-model="form.description"></el-input>
    </el-form-item>
  </el-form>
</template>

<script>
export default {
  name: 'CheckRelation',
  props: ['nodeInfo', 'configurationDescriptor'],
  data () {
    return {
      isTplType: false,
      entityTypeList: [
        { label: '设备', value: 'DEVICE' },
        { label: '资产', value: 'ASSET' },
        { label: '实体视图', value: 'ENTITY_VIEW' },
        { label: '租户', value: 'TENANT' },
        { label: '客户', value: 'CUSTOMER' },
        { label: '应用库', value: 'DASHBOARD' }
      ],
      form: {
        name: '',
        debugMode: false,
        checkForSingleEntity: false,
        direction: '',
        entityType: '',
        entityId: '',
        relationType: '',
        description: ''
      },
      rules: {
        name: [{ required: true, message: '名称不能为空', trigger: 'change' }],
        direction: [{ required: true, message: '方向不能为空', trigger: 'change' }],
        entityType: [{ required: true, message: '类型不能为空', trigger: 'change' }],
        entityId: [{ required: true, message: '该项不能为空', trigger: 'change' }],
        relationType: [{ required: true, message: '关联类型', trigger: 'change' }]
      },
      types: []
    }
  },
  methods: {
    async remoteMethod (query, init) {
      if (!this.form.entityType) return false
      const params = {
        page: 0,
        pageSize: 50,
        sortOrder: 'ASC',
        textSearch: init ? '' : query
      }
      let result = null
      switch (this.form.entityType) {
        case 'DEVICE':
          result = await this.$api.getDeviceInfo(Object.assign({
            sortProperty: 'name'
          }, params))
          break
        case 'ASSET':
          result = await this.$api.getAssetInfos(Object.assign({
            sortProperty: 'name'
          }, params))
          break
        case 'ENTITY_VIEW':
          result = await this.$api.getEntityViewList(Object.assign({
            sortProperty: 'name'
          }, params))
          break
        case 'TENANT':
          result = await this.$api.getTenantInfos(this.$store.getters.userInfo.tenantId.id)
          break
        case 'CUSTOMER':
          result = await this.$api.getCustomersList(Object.assign({
            sortProperty: 'title'
          }, params))
          break
        case 'DASHBOARD':
          result = await this.$api.getDashboardsList(Object.assign({
            sortProperty: 'title'
          }, params))
          break
        default:
          break
      }
      this.types = result.data.data || [result.data]
    },
    submit () {
      this.$refs.form.validate(valid => {
        if (!valid) return false
        this.$emit('submit', {
          debugMode: this.form.debugMode || false,
          name: this.form.name,
          configuration: {
            checkForSingleEntity: this.form.checkForSingleEntity,
            direction: this.form.direction,
            entityType: this.form.entityType,
            entityId: this.form.entityId,
            relationType: this.form.relationType
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
      if (this.form.entityId) {
        this.remoteMethod(this.form.entityId, 'init')
      }
      if (!this.form.entityType) {
        this.form.entityType = 'DEVICE'
      }
    }
  },
  created () {
    this.isTplType = Object.is(JSON.stringify(this.nodeInfo), '{}')
    this.init()
  }
}
</script>
