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
    <el-form-item label="消息计数(0-无限)" prop="msgCount">
      <el-input type="number" :min="0" v-model="form.msgCount"></el-input>
    </el-form-item>
    <el-form-item label="以秒为单位的时间" prop="periodInSeconds">
      <el-input type="number" :min="1" v-model="form.periodInSeconds"></el-input>
    </el-form-item>
    <div class="type-container">
      <el-form-item label="类型" prop="originatorType">
        <el-select v-model="form.originatorType" @change="form.originatorId = ''">
          <el-option
            v-for="item in originatorTypeList"
            :key="item.value"
            :label="item.label"
            :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item
        :label="originatorTypeList.filter(item => item.value === form.originatorType)[0].label"
        prop="originatorId">
        <el-select
          v-model="form.originatorId"
          filterable
          remote
          clearable
          :remote-method="remoteMethod"
          @focus="remoteMethod(form.originatorId)">
          <el-option v-for="item in types" :key="item.id.id" :label="item.name" :value="item.id.id"></el-option>
        </el-select>
      </el-form-item>
    </div>
    <el-form-item label="生成" prop="jsScript" class="js-container">
      <span>function Generate (prevMsg, prevMetadata, prevMsgType) {</span>
      <Editor language="javascript"
        :codes="form.jsScript"
        @onCodeChange="$value => form.jsScript = $value" />
      <span>}</span>
    </el-form-item>
    <el-button type="primary" size="mini" @click="openTestScript()">测试发生器功能</el-button>
    <el-form-item label="描述" prop="description">
      <el-input type="textarea" autosize v-model="form.description"></el-input>
    </el-form-item>
    <test-script ref="testScript" title="测试发生器功能"></test-script>
  </el-form>
</template>

<script>
import Editor from '@/components/Editor'
import TestScript from '../test-script'
export default {
  name: 'Generator',
  props: ['nodeInfo', 'configurationDescriptor'],
  components: { Editor, TestScript },
  data () {
    const msgCount = (rule, value, callback) => {
      if (Number(value) < 0) {
        callback(new Error('消息计数应大于或等于0'))
      } else if (value === '' || value === undefined) {
        callback(new Error('消息计数不能为空'))
      } else {
        callback()
      }
    }
    const periodInSeconds = (rule, value, callback) => {
      if (Number(value) < 0) {
        callback(new Error('以秒为单位的时间间隔应大于或等于1'))
      } else if (value === '' || value === undefined) {
        callback(new Error('以秒为单位的时间不能为空'))
      } else {
        callback()
      }
    }
    return {
      isTplType: false,
      originatorTypeList: [
        { label: '设备', value: 'DEVICE' },
        { label: '资产', value: 'ASSET' },
        { label: '实体视图', value: 'ENTITY_VIEW' },
        { label: '租户', value: 'TENANT' },
        { label: '客户', value: 'CUSTOMER' },
        { label: '应用库', value: 'DASHBOARD' }
      ],
      form: {
        name: '',
        msgCount: '',
        periodInSeconds: '',
        jsScript: '',
        originatorType: '',
        originatorId: '',
        debugMode: '',
        description: ''
      },
      rules: {
        name: [{ required: true, message: '名称不能为空', trigger: 'change' }],
        msgCount: [{ required: true, validator: msgCount, trigger: 'change' }],
        originatorId: [{ required: true, message: '该项不能为空', trigger: 'change' }],
        periodInSeconds: [{ required: true, validator: periodInSeconds, trigger: 'change' }]
      },
      types: []
    }
  },
  methods: {
    openTestScript () {
      this.$refs.testScript.openDialog({
        msg: JSON.stringify({
          temperature: 22.4,
          humidity: 78
        }, null, 2),
        script: this.form.jsScript,
        metaData: [
          { key: 'deviceType', value: 'default' },
          { key: 'deviceName', value: 'Test Device' },
          { key: 'ts', value: new Date().getTime() }
        ],
        scriptType: 'generate',
        funName: 'Generate'
      })
    },
    async remoteMethod (query, init) {
      if (!this.form.originatorType) return false
      this.types.forEach(item => {
        if (item.id.id === query) {
          query = item.name
        }
      })
      const params = {
        page: 0,
        pageSize: 50,
        sortOrder: 'ASC',
        textSearch: query
      }
      let result = null
      switch (this.form.originatorType) {
        case 'DEVICE':
          result = init ? await this.$api.getOneDeviceInfo(query) : await this.$api.getDeviceInfo(Object.assign({
            sortProperty: 'name'
          }, params))
          break
        case 'ASSET':
          result = init ? await this.$api.getOneAssetInfo(query) : await this.$api.getAssetInfos(Object.assign({
            sortProperty: 'name'
          }, params))
          break
        case 'ENTITY_VIEW':
          result = init ? await this.$api.getEntityView(query) : await this.$api.getEntityViewList(Object.assign({
            sortProperty: 'name'
          }, params))
          break
        case 'TENANT':
          result = init ? await this.$api.getTenantInfos(query) : await this.$api.getTenantInfos(this.$store.getters.userInfo.tenantId.id)
          break
        case 'CUSTOMER':
          result = init ? await this.$api.getCustomersInfo(query) : await this.$api.getCustomersList(Object.assign({
            sortProperty: 'title'
          }, params))
          break
        case 'DASHBOARD':
          result = init ? await this.$api.getDashboardInfo(query) : await this.$api.getDashboardsList(Object.assign({
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
            msgCount: this.form.msgCount,
            periodInSeconds: this.form.periodInSeconds,
            originatorType: this.form.originatorType,
            originatorId: this.form.originatorId,
            jsScript: this.form.jsScript
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
      if (this.form.originatorId) {
        this.remoteMethod(this.form.originatorId, true)
      }
      if (!this.form.originatorType) {
        this.form.originatorType = 'DEVICE'
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
  /deep/ .js-container {
    margin-bottom: 0 !important;
    .el-form-item__content {
      height: 300px;
      > span {
        float: left;
        width: 100%;
        line-height: 40px;
        font-size: 13px;
        color: #666;
      }
      .editor-container {
        margin-top: 60px;
        height: 270px;
        .overflow-guard {
          border-radius: 4px;
          border: 1px solid #DCDFE6;
        }
      }
    }
  }
</style>
