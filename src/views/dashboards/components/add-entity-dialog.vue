<template>
  <icloud-dialog width="800px" title="实体别名" :visible.sync="isShowDialog">
    <div>
      <el-row style="margin-left: 20px">
        <el-col :span="9">别名</el-col>
        <el-col :span="9">实体过滤</el-col>
      </el-row>
      <template v-for="(item, index) in entityAliasesList">
        <el-card :key="index" style="margin-top: 10px">
          <el-row :gutter="10">
            <el-col :span="9">
              <p style="line-height: 34px">{{item.alias}}</p>
            </el-col>
            <el-col :span="9">
              <p style="line-height: 34px">{{item.entityTypeLabel}}</p>
            </el-col>
            <el-col :span="6">
              <wx-button icon="el-icon-edit" circle @click="editEntityAliases(index)"></wx-button>
              <wx-button icon="el-icon-close" circle @click="deleteEntityAliases(index)" style="margin-left: 10px"></wx-button>
            </el-col>
          </el-row>
        </el-card>
      </template>
      <el-button type="primary" size="mini" @click="addData" style="margin-top: 10px">添加别名</el-button>
    </div>
    <div class="icloud-dialog-footer" slot="footer">
      <wx-button type="primary" @click="submit">确定</wx-button>
      <wx-button @click="isShowDialog = false">取消</wx-button>
    </div>
    <icloud-dialog width="700px" title="添加别名" :visible.sync="isShowSelectEntityDialog">
      <el-form ref="selectEntityForm" :model="selectEntityForm" :rules="entityRules">
        <el-form-item label="别名" prop="name">
          <el-input v-model="selectEntityForm.name" placeholder="请输入别名"></el-input>
        </el-form-item>
        <el-form-item label="过滤类型" prop="filterType">
          <el-select v-model="selectEntityForm.filterType" value-key="value" @change="changeFilterType">
            <el-option v-for="item in filterTypeOptions" :key="item.value"
                       :label="item.label" :value="item.value"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item v-if="selectEntityForm.filterType" label="类型" prop="type">
          <el-select v-model="selectEntityForm.type" @change="changeType">
            <el-option v-for="item in entityTypeOptions" :key="item.value"
                       :label="item.label" :value="item.value"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item v-if="selectEntityForm.type" :label="itemLabel" prop="itemId">
          <template v-if="!selectEntityForm.multiple">
            <el-select v-model="selectEntityForm.itemId" filterable remote :placeholder="`请输入${itemLabel}`" :loading="selectLoading"
                       :remote-method="remoteMethod" @focus="focusSingleType" value-key="id">
              <el-option v-for="(item, index) in itemOptions" :key="index"
                         :label="item.name" :value="item.id.id"></el-option>
            </el-select>
          </template>
          <template v-else>
            <div class="entity-list">
              <div v-for="(item, index) in entityItemList" :key="index" class="entity-item">
                <span>{{item.name}}</span>
                <i class="iconfont icon-cuo" @click="deleteEntityItem(index)"></i>
              </div>
            </div>
            <el-select v-model="selectValue" filterable remote :placeholder="`请输入${itemLabel}`" :loading="selectLoading"
                       :remote-method="remoteMethod" @focus="remoteMethod('')" @change="changeItem" value-key="id.id">
              <el-option v-for="(item, index) in itemOptions" :key="index"
                         :label="item.name" :value="item"></el-option>
            </el-select>
          </template>
        </el-form-item>
      </el-form>
      <div class="icloud-dialog-footer" slot="footer">
        <wx-button type="primary" @click="submitSelectEntity">确定</wx-button>
        <wx-button @click="isShowSelectEntityDialog = false">取消</wx-button>
      </div>
    </icloud-dialog>
  </icloud-dialog>
</template>

<script>
import { getUuid } from '@/utils/index'
export default {
  name: 'addEntityDialog',
  data () {
    return {
      tenantId: {},
      entityAliasesList: [],
      isShowDialog: false,
      isShowSelectEntityDialog: false,
      queryText: '', // 查询文本
      entityItemList: [], // 多实体显示列表
      selectValue: '',
      selectEntityForm: {
        index: 0,
        name: '', // 别名
        id: '', // 别名id
        type: '', // 类型
        itemId: '', // 设备id
        filterType: '', // 过滤类型
        multiple: false // 是否多选
      },
      entityRules: {
        name: [{ required: true, message: '别名不能为空', trigger: 'change' }],
        filterType: [{ required: true, message: '过滤类型不能为空', trigger: 'change' }],
        type: [{ required: true, message: '类型不能为空', trigger: 'change' }],
        itemId: [{ required: true, message: '不能为空', trigger: 'change' }]
      },
      filterTypeOptions: [{
        value: 'singleEntity',
        label: '单个实体'
      }, {
        value: 'entityList',
        label: '实体列表'
      }],
      entityTypeOptions: [{
        value: 'DEVICE',
        label: '设备'
      }, {
        value: 'ASSET',
        label: '资产'
      }, {
        value: 'ENTITY_VIEW',
        label: '实体视图'
      }, {
        value: 'TENANT',
        label: '设备管理员'
      }],
      itemOptions: [],
      allItemOptions: [],
      selectLoading: false
    }
  },
  computed: {
    itemLabel () {
      return this.getEntityTypeLabel(this.selectEntityForm.type)
    }
  },
  methods: {
    async openDialog (list = {}, tenantId) {
      this.tenantId = tenantId
      this.entityAliasesList = Object.values(list).map(item => {
        const entityType = item.filter.entityType ? item.filter.entityType : item.filter[item.filter.type].entityType
        item.entityType = entityType
        item.entityTypeLabel = this.getEntityTypeLabel(entityType)
        return item
      })
      this.isShowDialog = true
    },
    getEntityTypeLabel (entityType) {
      const item = this.entityTypeOptions.find(item => {
        return item.value === entityType
      })
      return item ? item.label : ''
    },
    submit () {
      const entityAliases = {}
      for (const item of this.entityAliasesList) {
        const { alias, id, filter } = item
        entityAliases[id] = {
          alias,
          id,
          filter
        }
      }
      this.$emit('submit', entityAliases)
      this.isShowDialog = false
    },
    async editEntityAliases (index) {
      const { alias, id, filter } = this.entityAliasesList[index]
      const filterType = filter.type // 过滤类型
      const type = filter.entityType ? filter.entityType : filter[filterType].entityType // 实体类型
      const multiple = this.isMultiple(filterType) // 是否多实体
      const itemId = multiple ? filter[filterType] : filter[filterType].id // 实体id
      await this.setItemOptions(type, itemId, multiple)
      this.selectEntityForm = {
        index,
        name: alias,
        filterType,
        type,
        id,
        multiple,
        itemId
      }
      this.isShowSelectEntityDialog = true
    },
    async setItemOptions (type, itemId, multiple) {
      let res = null
      let list = []
      switch (type) {
        case 'DEVICE':
          if (multiple) {
            res = await this.$api.getDevices({
              deviceIds: itemId.join()
            })
            const itemList = []
            for (const item of res.data) {
              itemList.push({
                id: item.id.id,
                name: item.name
              })
            }
            this.entityItemList = itemList
          } else {
            res = await this.$api.getOneDeviceInfo(itemId)
            list = [res.data]
            this.queryText = res.data.name
          }
          break
        case 'ASSET':
          if (multiple) {
            res = await this.$api.getAssets({
              assetIds: itemId.join()
            })
            const itemList = []
            for (const item of res.data) {
              itemList.push({
                id: item.id.id,
                name: item.name
              })
            }
            this.entityItemList = itemList
          } else {
            res = await this.$api.getOneAssetInfo(itemId)
            list = [res.data]
            this.queryText = res.data.name
          }
          break
        case 'ENTITY_VIEW':
          if (multiple) {
            const itemList = []
            for (const id of itemId) {
              const res = await this.$api.getEntityView(id)
              itemList.push({
                id: res.data.id.id,
                name: res.data.name
              })
            }
            this.entityItemList = itemList
          } else {
            res = await this.$api.getEntityView(itemId)
            list = [res.data]
            this.queryText = res.data.name
          }
          break
        case 'TENANT':
          if (multiple) {
            const itemList = []
            for (const id of itemId) {
              const res = await this.$api.getTenantsInfo(id)
              itemList.push({
                id: res.data.id.id,
                name: res.data.name
              })
            }
            this.entityItemList = itemList
          } else {
            res = await this.$api.getTenantsInfo(itemId)
            list = [res.data]
            this.queryText = res.data.name
          }
          break
        default: break
      }
      this.itemOptions = list
    },
    deleteEntityAliases (index) {
      this.entityAliasesList.splice(index, 1)
    },
    addData () {
      this.selectEntityForm = {
        index: this.entityAliasesList.length,
        name: '',
        filterType: '',
        type: '',
        itemId: '',
        id: getUuid(),
        multiple: false
      }
      this.entityItemList = []
      this.isShowSelectEntityDialog = true
    },
    isMultiple (filterType) {
      return filterType === 'entityList'
    },
    changeFilterType (val) {
      this.selectEntityForm.multiple = this.isMultiple(val)
      this.selectEntityForm.type = ''
      this.selectEntityForm.itemId = ''
    },
    changeType (val) {
      this.selectEntityForm.itemId = ''
      this.entityItemList = []
    },
    focusSingleType () {
      this.remoteMethod(this.queryText)
    },
    async remoteMethod (query) {
      this.queryText = query
      this.selectLoading = true
      try {
        let res = null
        let list = []
        const param = {
          pageSize: 50,
          page: 0,
          textSearch: query
        }
        switch (this.selectEntityForm.type) {
          case 'DEVICE':
            res = await this.$api.getDeviceInfo(param)
            list = res.data.data
            break
          case 'ASSET':
            res = await this.$api.getTenantAssets(param)
            list = res.data.data
            break
          case 'ENTITY_VIEW':
            res = await this.$api.getTenantEntityViews(param)
            list = res.data.data
            break
          case 'TENANT':
            res = await this.$api.getTenantsInfo(this.tenantId.id)
            list.push(res.data)
            break
          default: break
        }
        this.itemOptions = list
        if (!query) {
          this.allItemOptions = list
        }
        this.selectLoading = false
      } catch (e) {
        this.itemOptions = []
        this.selectLoading = false
      }
    },
    changeItem (item) {
      const obj = {
        id: item.id.id,
        name: item.name
      }
      this.entityItemList.push(obj)
      this.selectValue = ''
    },
    deleteEntityItem (index) {
      this.entityItemList.splice(index, 1)
    },
    async submitSelectEntity () {
      const list = []
      if (this.selectEntityForm.multiple) {
        for (const item of this.entityItemList) {
          if (!list.includes(item.id)) {
            list.push(item.id)
          }
        }
        this.selectEntityForm.itemId = list
      }
      try {
        this.$refs.selectEntityForm.validate(async valid => {
          if (!valid) return false
          this.isShowSelectEntityDialog = false
          const filterType = this.selectEntityForm.filterType
          const entityType = this.selectEntityForm.type
          const filter = {
            type: filterType,
            resolveMultiple: this.selectEntityForm.multiple
          }
          filter[filterType] = this.selectEntityForm.multiple ? this.selectEntityForm.itemId : {
            id: this.selectEntityForm.itemId,
            entityType: this.selectEntityForm.type
          }
          if (this.selectEntityForm.multiple) {
            filter.entityType = entityType
          }
          const item = {
            alias: this.selectEntityForm.name,
            id: this.selectEntityForm.id,
            filter,
            entityType: entityType,
            entityTypeLabel: this.getEntityTypeLabel(entityType)
          }
          const index = this.selectEntityForm.index
          this.entityAliasesList[index] = item
        })
      } catch (e) {
        this.$message.error(e.response.data.message)
        this.isShowSelectEntityDialog = false
      }
    }
  }
}
</script>

<style scoped lang="scss">
  .body {
    position: absolute;
    top: 0;
    left: 0;
  }
  .entity-list {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    .entity-item {
      display: flex;
      align-items: center;
      padding: 4px 8px;
      height: 24px;
      border-radius: 12px;
      background-color: #e0e0e0;
      margin-right: 10px;
      margin-bottom: 8px;
      span {
        line-height: 24px;
        margin-right: 4px;
      }
      i {
        cursor: pointer;
        width: 16px;
        height: 16px;
      }
    }
  }
</style>
