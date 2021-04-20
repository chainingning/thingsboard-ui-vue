<template>
  <el-form ref="form" :model="form" :rules="rules" :disabled="isCustomer">
    <el-form-item label="名称" prop="name">
      <el-input v-model="form.name"></el-input>
    </el-form-item>
    <el-form-item label="实体视图类型" prop="type">
      <el-select
        filterable
        allow-create
        default-first-option
        v-model="form.type">
        <el-option v-for="item in entityViewTypes" :key="item.type" :label="item.type" :value="item.type"></el-option>
      </el-select>
    </el-form-item>
    <el-form-item class="targer-entity" label="目标实体"></el-form-item>
    <div class="entity-container">
      <el-form-item label="类型" prop="entityType">
        <el-select v-model="form.entityType" @change="form.id = ''">
          <el-option label="设备" value="DEVICE"></el-option>
          <el-option label="资产" value="ASSET"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item v-if="form.entityType" :label="form.entityType === 'DEVICE' ? '设备' : '资产'" prop="id">
        <el-select
          v-model="form.id"
          filterable
          remote
          reserve-keyword
          :remote-method="handlerEntityType"
          @focus="handlerEntityType()">
          <el-option v-for="item in typeList" :key="item.id.id" :label="item.name" :value="item.id.id"></el-option>
        </el-select>
      </el-form-item>
    </div>
    <el-collapse v-model="activeName">
      <el-collapse-item title="属性传播" name="1">
        <div class="desc">每次保存或更新这个实体视图时，实体视图将自动从目标实体复制指定的属性。由于性能原因，目标实体属性不会在每次属性更改时传播到实体视图。您可以通过配置"copy to view"规则链中的规则节点，并将"Post attributes"和"attributes Updated"消息链接到新规则节点，从而启用自动传播。</div>
        <el-form-item label="客户端属性" prop="cs">
          <el-select
            multiple
            filterable
            allow-create
            default-first-option
            v-model="form.cs"
            @focus="getAttribute(form.entityType, form.id, 'CLIENT_SCOPE')">
            <el-option v-for="item in attrList['CLIENT_SCOPE']" :key="item.key" :label="item.key" :value="item.key"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="共享属性" prop="sh">
          <el-select
            multiple
            filterable
            allow-create
            default-first-option
            v-model="form.sh"
            @focus="getAttribute(form.entityType, form.id, 'SHARED_SCOPE')">
            <el-option v-for="item in attrList['SHARED_SCOPE']" :key="item.key" :label="item.key" :value="item.key"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="服务端属性" prop="ss">
          <el-select
            multiple
            filterable
            allow-create
            default-first-option
            v-model="form.ss"
            @focus="getAttribute(form.entityType, form.id, 'SERVER_SCOPE')">
            <el-option v-for="item in attrList['SERVER_SCOPE']" :key="item.key" :label="item.key" :value="item.key"></el-option>
          </el-select>
        </el-form-item>
      </el-collapse-item>
      <el-collapse-item title="时间序列数据" name="2">
        <div class="desc">配置目标实体的时间序列数据键,以便实体视图可以访问这些键。这个时间序列数据是只读的。</div>
        <el-form-item label="时间序列" prop="timeseries">
          <el-select
            multiple
            filterable
            allow-create
            default-first-option
            v-model="form.timeseries"
            @focus="getAttribute(form.entityType, form.id, 'timeseries')">
            <el-option v-for="item in attrList['timeseries']" :key="item" :label="item" :value="item"></el-option>
          </el-select>
        </el-form-item>
      </el-collapse-item>
    </el-collapse>
    <div class="time-container">
      <el-form-item label="开始时间" prop="startTimeMs">
        <el-date-picker
          v-model="form.startTimeMs"
          type="datetime"
          placeholder="开始时间"
          value-format="timestamp"
          align="right">
        </el-date-picker>
      </el-form-item>
      <el-form-item label="结束时间" prop="endTimeMs">
        <el-date-picker
          v-model="form.endTimeMs"
          type="datetime"
          placeholder="结束时间"
          value-format="timestamp"
          align="right">
        </el-date-picker>
      </el-form-item>
    </div>
    <el-form-item label="描述" prop="description">
      <el-input type="textarea" autosize v-model="form.description"></el-input>
    </el-form-item>
  </el-form>
</template>

<script>
export default {
  props: {
    info: {
      type: Object,
      default: () => ({})
    }
  },
  data () {
    const id = (rule, value, callback) => {
      if (value === '' || value === undefined) {
        callback(new Error(`${this.form.entityType === 'DEVICE' ? '设备' : '资产'}不能为空`))
      } else {
        callback()
      }
    }
    return {
      isCustomer: this.$store.getters.userInfo.authority === 'CUSTOMER_USER',
      activeName: ['1', '2'],
      form: {
        name: '',
        type: '',
        entityType: '',
        id: '',
        startTimeMs: '',
        endTimeMs: '',
        cs: [],
        sh: [],
        ss: [],
        timeseries: [],
        description: ''
      },
      rules: {
        name: [{ required: true, message: '名称不能为空', trigget: 'change' }],
        type: [{ required: true, message: '实体视图类型不能为空', trigget: 'change' }],
        entityType: [{ required: true, message: '类型不能为空', trigget: 'change' }],
        id: [{ required: true, validator: id, trigget: 'change' }]
      },
      entityViewTypes: [],
      typeList: [],
      attrList: {
        CLIENT_SCOPE: [],
        SERVER_SCOPE: [],
        SHARED_SCOPE: [],
        timeseries: []
      }
    }
  },
  methods: {
    submit () {
      this.$refs.form.validate(async valid => {
        if (!valid) return false
        const { ..._params } = this.form
        let params = {
          name: _params.name,
          type: _params.type,
          entityId: {
            entityType: _params.entityType,
            id: _params.id
          },
          startTimeMs: _params.startTimeMs,
          endTimeMs: _params.endTimeMs,
          keys: {
            attributes: {
              cs: _params.cs,
              sh: _params.sh,
              ss: _params.ss
            },
            timeseries: _params.timeseries
          },
          additionalInfo: {
            description: _params.description
          }
        }
        let msg = '添加'
        if (JSON.stringify(this.info) !== '{}') {
          params = {
            ...this.info,
            ...params
          }
          delete params.icon
          msg = '修改'
        }
        const res = await this.$api.postEntityView(params)
        if (res.status === 200) {
          this.$message.success(`${msg}成功`)
          this.$emit('submit')
          if (JSON.stringify(this.info) !== '{}') {
            this.$router.push({ path: `/entity-views/${this.$route.params.entityId}`, query: { title: this.form.name } })
          }
        }
      })
    },
    async handlerEntityType (value) {
      const params = {
        page: 0,
        pageSize: 50,
        sortOrder: 'ASC',
        sortProperty: 'name',
        textSearch: value
      }
      const apiName = {
        DEVICE: this.isCustomer ? 'getCustomerDeviceList' : 'getDeviceInfo',
        ASSET: this.isCustomer ? 'getCustomerAssetList' : 'getTenantAssets'
      }
      const result = await this.$api[apiName[this.form.entityType]](params, this.$store.getters.userInfo.customerId.id)
      this.typeList = result.data.data
    },
    async getEntityViewTypes () {
      const res = await this.$api.getEntityViewTypes()
      this.entityViewTypes = res.data
    },
    async getAttribute (entityType, id, scope) {
      if (!id) return
      const result = await this.$api[
        scope === 'timeseries' ? 'getPluginsTelemetryKeys' : 'getAttribute'
      ](entityType, id, scope)
      this.attrList[scope] = result.data
    },
    async getEntityTypeInfo () {
      const result = await this.$api[this.form.entityType === 'DEVICE' ? 'getOneDeviceInfo'
        : 'getOneAssetInfo'
      ](this.form.id)
      this.handlerEntityType(result.data.name)
    },
    async init () {
      await this.getEntityViewTypes()
      if (JSON.stringify(this.info) !== '{}') {
        this.form = {
          name: this.info.name,
          type: this.info.type,
          entityType: this.info.entityId.entityType,
          id: this.info.entityId.id,
          startTimeMs: this.info.startTimeMs,
          endTimeMs: this.info.endTimeMs,
          cs: this.info.keys.attributes.cs,
          sh: this.info.keys.attributes.sh,
          ss: this.info.keys.attributes.ss,
          timeseries: this.info.keys.timeseries,
          description: this.info.additionalInfo.description
        }
        this.getEntityTypeInfo()
      }
    }
  },
  created () {
    this.init()
  }
}
</script>

<style lang="scss" scoped>
.desc {
  font-size: 12px;
  color: #808080;
}
.targer-entity {
  margin-bottom: 0 !important;
}
.entity-container {
  height: 74px;
  .el-form-item {
    float: left;
    margin-bottom: 19px !important;
    &:nth-of-type(1) {
      width: 100px;
    }
    &:nth-of-type(2) {
      margin-left: 20px;
      width: calc(100% - 120px);
    }
  }
}
.time-container {
  @include clearfix();
  .el-form-item {
    float: left;
    width: calc(100% / 2);
  }
}
/deep/ .el-collapse {
  border: none;
  .el-collapse-item {
    border: none;
    .el-collapse-item__header {
      border: none;
    }
    .el-collapse-item__wrap {
      border: 1px solid #D5D5D5;
      border-top: none;
      border-radius: 0 0 4px 4px;
      margin-bottom: 18px;
    }

    > div {
      padding: 0 20px;
      &:nth-of-type(1) {
        border: 1px solid #D5D5D5;
      }
    }
    &:first-child {
      > div {
        &:nth-of-type(1) {
          border-bottom: none;
        }
      }
      .el-collapse-item__wrap {
        margin-bottom: 18px;
      }
    }
    &:last-child {
      margin-bottom: 18px;
    }
    &.is-active {
      > div {
        &:nth-of-type(1) {
          border-bottom: none;
        }
      }
    }
  }
}
</style>
