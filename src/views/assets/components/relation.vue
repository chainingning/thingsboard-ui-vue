<template>
  <div class="relation-container">
    <el-form :model="listQuery" size="medium" :inline="true">
      <el-form-item :label="listQuery.id === 'from' ? '向外的关联' : '向内的关联'">
        <el-select v-model="listQuery.id" @change="getList">
          <el-option label="从" value="from"></el-option>
          <el-option label="到" value="to"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="getList()">查询</el-button>
        <el-button v-if="!isCustomer" type="primary" @click="openDialog('add')">添加</el-button>
      </el-form-item>
      <el-form-item v-if="selection.length && !isCustomer" class="fr">
        <wx-button type="primary" icon="icon-remove" circle @click="deleteMore"></wx-button>
      </el-form-item>
    </el-form>
    <el-table
      :data="list"
      ref="table"
      size="mini"
      height="calc(100% - 126px)"
      :default-sort="{prop: 'type', order: 'descending'}"
      @selection-change="handleSelectionChange">
      <el-table-column
        type="selection"
        width="90">
      </el-table-column>
      <el-table-column
        v-for="item in listTitle[listQuery.id]"
        :key="item.label"
        :min-width="item.width"
        :label="item.label"
        :sortable="item.sortable"
        :prop="item.property"
        :sort-orders="['ascending', 'descending']"
        show-overflow-tooltip>
        <template slot-scope="scope">
          <div v-if="item.property === 'btn' && !isCustomer" >
            <i class="el-icon-edit" @click="openDialog('edit', scope.row)"></i>
          </div>
          <span v-else>{{ formatter(item.property, scope.row) }}</span>
        </template>
      </el-table-column>
    </el-table>
    <icloud-dialog
      :title="title"
      :visible.sync="visible">
      <el-form ref="form" :model="form" :rules="rules">
        <el-form-item label="关联类型" prop="type">
          <el-select
            v-model="form.type"
            allow-create
            filterable
            :disabled="type === 'edit'">
            <el-option label="Contains" value="Contains"></el-option>
            <el-option label="Manages" value="Manages"></el-option>
          </el-select>
        </el-form-item>
        <div class="type-container">
          <el-form-item label="类型" prop="entityType">
            <el-select
              v-model="form.entityType"
              @change="entityTypeChange"
              :disabled="type === 'edit'">
              <el-option
                v-for="item in entityTypeList"
                :key="item.key"
                :label="item.label"
                :value="item.value" />
            </el-select>
          </el-form-item>
          <el-form-item v-if="form.entityType" label="实体列表" prop="id">
            <el-select
              v-model="form.id"
              multiple
              filterable
              :disabled="type === 'edit'"
              remote
              reserve-keyword
              :remote-method="remoteMethod"
              @focus="remoteMethod()">
              <el-option v-for="item in types" :key="item.id.id" :label="item.name" :value="item.id.id"></el-option>
            </el-select>
          </el-form-item>
        </div>
        <el-form-item label="附加信息(JSON)" prop="additionalInfo" class="json-container">
          <Editor language="json"
            :codes="form.additionalInfo"
            @onCodeChange="$value => form.additionalInfo = $value" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="icloud-dialog-footer">
        <wx-button type="primary" @click="submit">确定</wx-button>
        <wx-button @click="visible = false">取消</wx-button>
      </div>
    </icloud-dialog>
  </div>
</template>

<script>
import Editor from '@/components/Editor'
export default {
  props: ['assetId'],
  components: { Editor },
  data () {
    return {
      listQuery: {
        id: 'to'
      },
      list: [],
      listTitle: {
        from: [
          { property: 'type', label: '类型', width: 180, sortable: true },
          { property: 'to.entityType', label: '到实体类型', width: 150 },
          { property: 'toName', label: '到实体名称', width: 150 },
          { property: 'btn', label: '详情', width: 100 }
        ],
        to: [
          { property: 'type', label: '类型', width: 180, sortable: true },
          { property: 'from.entityType', label: '从实体类型', width: 150 },
          { property: 'fromName', label: '从实体名称', width: 150 },
          { property: 'btn', label: '操作', width: 100 }
        ]
      },
      title: '',
      type: 'add',
      visible: false,
      form: {
        type: '',
        entityType: '',
        id: [],
        additionalInfo: ''
      },
      rules: {
        type: [{ required: true, message: '关联类型不能为空', trigger: 'change' }],
        entityType: [{ required: true, message: '类型不能为空', trigger: 'change' }],
        id: [{ required: true, message: '实体列表不能为空', trigger: 'change' }]
      },
      types: [],
      info: {},
      entityTypeList: [
        { label: '设备', value: 'DEVICE' },
        { label: '资产', value: 'ASSET' },
        { label: '实体视图', value: 'ENTITY_VIEW' },
        { label: '客户', value: 'CUSTOMER' }
      ],
      selection: [],
      isCustomer: this.$store.getters.userInfo.authority === 'CUSTOMER_USER'
    }
  },
  methods: {
    async deleteMore () {
      this.$confirm('注意,确认后所有选中的关联都会被删除', `确定要删除${this.selection.length}关联吗?`, {
        confirmButtonText: '是',
        cancelButtonText: '否'
      }).then(async _ => {
        await Promise.all(
          this.selection.map(ele => this.$api.deleteRelation({
            fromId: ele.from.id,
            fromType: ele.from.entityType,
            relationType: ele.type,
            toId: ele.to.id,
            toType: ele.to.entityType
          }))
        )
        this.$message.success('操作成功')
        this.getList()
        this.$refs.table.clearSelection()
      }).catch(() => {})
    },
    handleSelectionChange (val) {
      this.selection = val
    },
    formatter (property, row) {
      const pro = property.split('.')
      const value = pro.length > 1 ? row[pro[0]][pro[1]] : row[property]
      return value
    },
    submit () {
      this.$refs.form.validate(async valid => {
        if (!valid) return false
        const { type, entityType, id, additionalInfo } = this.form
        const isTo = this.listQuery.id === 'to'
        let params = []
        if (this.type === 'add') {
          params = id.map(ele => {
            return {
              ...this.info,
              type,
              additionalInfo: additionalInfo ? JSON.parse(additionalInfo) : '',
              typeGroup: 'COMMON',
              from: {
                entityType: !isTo ? 'ASSET' : entityType,
                id: !isTo ? this.assetId : ele
              },
              to: {
                entityType: isTo ? 'ASSET' : entityType,
                id: isTo ? this.assetId : ele
              }
            }
          })
        } else {
          params = [{
            ...this.info,
            additionalInfo: additionalInfo ? JSON.parse(additionalInfo) : ''
          }]
        }
        await Promise.all([
          ...params.map(item => this.$api.postRelation(item))
        ])
        this.visible = false
        this.getList()
      })
    },
    async openDialog (type, params = {}) {
      this.visible = true
      this.info = params
      this.type = type
      const title = this.listQuery.id === 'from' ? params.toName : params.fromName
      this.title = type === 'add' ? '添加关联' : `修改关联(${title})`
      const isNull = typeof params.additionalInfo === 'object'
      const isFrom = this.listQuery.id === 'from'
      if (JSON.stringify(params) !== '{}') {
        this.form = {
          type: params.type,
          entityType: isFrom ? params.to.entityType : params.from.entityType,
          id: [isFrom ? params.toName : params.fromName],
          additionalInfo: isNull ? JSON.stringify(params.additionalInfo, null, 4) : ''
        }
      } else {
        this.form = {
          type: '',
          entityType: '',
          id: [],
          additionalInfo: ''
        }
      }
    },
    entityTypeChange () {
      this.form.id = []
    },
    async remoteMethod (query) {
      const params = {
        page: 0,
        pageSize: 50,
        sortOrder: 'ASC',
        textSearch: query
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
    async getList () {
      const result = await this.$api.getRelationsInfo({
        [`${this.listQuery.id}Id`]: this.assetId,
        [`${this.listQuery.id}Type`]: 'ASSET'
      })
      this.list = result.data
    }
  },
  created () {
    this.getList()
  }
}
</script>

<style lang="scss" scoped>
  .type-container {
    @include clearfix();
    .el-form-item {
      float: left;
      &:nth-of-type(1) {
        width: 150px;
      }
      &:nth-of-type(2) {
        margin-left: 20px;
        width: calc(100% - 170px);
      }
    }
  }
  .json-container {
    margin-top: 18px;
    .el-form-item__content {
      height: 300px;
      .editor-container {
        margin-top: 30px;
        height: 270px;
        .overflow-guard {
          border-radius: 4px;
          border: 1px solid #DCDFE6;
        }
      }
    }
  }
</style>
