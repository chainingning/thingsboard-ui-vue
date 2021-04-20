<template>
  <icloud-dialog
    :title="widgetInfo.name"
    :visible.sync="visible"
    width="1000px">
    <el-tabs type="border-card">
      <el-tab-pane label="数据">
        <el-form ref="form" :model="form" :rules="rules">
          <el-form-item label="目标设备" :prop="config?'targetDeviceAliasId':''">
            <el-select v-model="form.targetDeviceAliasId">
              <el-option v-for="item in deviceEntityList"
                :key="item.id"
                :label="item.label"
                :value="item.id" />
            </el-select>
          </el-form-item>
        </el-form>
      </el-tab-pane>
      <el-tab-pane label="设置">
        <el-form ref="settings" :model="settings" :rules="settingsRules">
          <el-form-item label="标题" :prop="type === 'edit' && config?'':'title'" class="margin-bottom">
            <el-input v-model="settings.title"></el-input>
          </el-form-item>
          <el-form-item>
            <el-checkbox v-model="settings.showTitle" >显示标题</el-checkbox>
          </el-form-item>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="单位符号" class="margin-bottom">
                <el-input v-model="settings.units"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="小数位数" class="margin-bottom">
                <div class="full-row">
                  <el-input-number v-model="settings.decimals" :min="0" :max="15"></el-input-number>
                </div>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </el-tab-pane>
      <el-tab-pane label="高级">
        <el-form ref="settings" :model="highSettings" :rules="highSettingsRules">
          <el-form-item class="margin-bottom">
            <el-checkbox v-model="highSettings.initialValue" >初始值</el-checkbox>
          </el-form-item>
          <el-form-item label="标题" class="margin-bottom">
            <el-input v-model="highSettings.title"></el-input>
          </el-form-item>
          <el-form-item class="margin-bottom">
            <el-checkbox v-model="highSettings.showOnOffLabels" >显示开/关文字</el-checkbox>
          </el-form-item>
          <!-- <el-form-item label="使用方法检索开/关值" :prop="'valueKey'" class="margin-bottom">
            <el-select v-model="highSettings.retrieveValueMethod">
              <el-option label="不检索" value="none"></el-option>
              <el-option label="调用RPC获取值方法" value="rpc"></el-option>
              <el-option label="订阅属性" value="attribute"></el-option>
              <el-option label="订阅遥测" value="timeseries"></el-option>
            </el-select>
          </el-form-item> -->
          <!-- <el-form-item label="属性/遥测值键(仅当订阅属性/遥测方法时)" :prop="'valueKey'" class="margin-bottom">
            <el-input v-model="highSettings.valueKey"></el-input>
          </el-form-item> -->
          <el-form-item label="RPC获取数据方法" :prop="'getValueMethod'" class="margin-bottom">
            <el-input v-model="highSettings.getValueMethod"></el-input>
          </el-form-item>
          <el-form-item label="RPC设置数据方法" :prop="'setValueMethod'" class="margin-bottom">
            <el-input v-model="highSettings.setValueMethod"></el-input>
          </el-form-item>
          <!-- <el-form-item label="解析值函数f(data)，返回布尔值" style="margin-bottom:0;">
          </el-form-item>
          <div style="height:200px">
            <Editor language="javascript"
              :codes="highSettings.parseValueFunction"
              @onCodeChange="$value => highSettings.parseValueFunction = $value"/>
          </div>
          <el-form-item label="转换值函数f(value)，返回RPC设置值方法使用的有效负载" style="margin-bottom:0;">
          </el-form-item>
          <div style="height:200px">
            <Editor language="javascript"
            :codes="highSettings.convertValueFunction"
            @onCodeChange="$value => highSettings.convertValueFunction = $value"/>
          </div> -->
          <el-form-item label="RPC响应时间" :prop="'requestTimeout'" class="margin-bottom">
            <el-input v-model="highSettings.requestTimeout"></el-input>
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>
    <div class="icloud-dialog-footer" slot="footer">
      <wx-button type="primary" @click="submit">确定</wx-button>
      <wx-button @click="visible = false">取消</wx-button>
    </div>
  </icloud-dialog>
</template>

<script>
var checkFloat = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('不能为空'))
  } else {
    if (Number.isNaN(parseFloat(value))) {
      callback(new Error('请输入数字'))
    } else {
      callback()
    }
  }
}
export default {
  name: 'Switches',
  data () {
    return {
      visible: false,
      form: {
        targetDeviceAliasId: ''
      },
      rules: {
        targetDeviceAliasId: [{ required: true, message: '实体别名不能为空', trigger: 'change' }]
      },
      widgetInfo: {},
      config: null,
      type: '',
      id: '',
      deviceEntityList: [],
      settings: {
        title: '',
        showTitle: true,
        units: '',
        decimals: ''
      },
      settingsRules: {
        title: [{ required: true, message: '标题不能为空', trigger: 'blur' }]
      },
      highSettings: {
        initialValue: false,
        title: '',
        showOnOffLabels: true,
        retrieveValueMethod: 'rpc',
        valueKey: 'value',
        getValueMethod: 'getValue',
        setValueMethod: 'setValue',
        parseValueFunction: 'return data ? true : false',
        convertValueFunction: 'return value',
        requestTimeout: 500
      },
      highSettingsRules: {
        requestTimeout: [{ required: true, validator: checkFloat, trigger: 'blur' }]
      }
    }
  },
  methods: {
    getDeviceEntityList () {
      this.deviceEntityList = []
      for (const key in this.config.configuration.entityAliases) {
        const entityInfo = this.config.configuration.entityAliases[key]
        const entityType = entityInfo.filter.type
        const isEntityType = entityInfo.filter.entityType === 'DEVICE' || entityInfo.filter[entityType].entityType === 'DEVICE'
        if (isEntityType) {
          this.deviceEntityList.push({
            label: entityInfo.alias,
            id: entityInfo.id
          })
        }
      }
    },
    openDialog ({ widgetInfo, config, type, id }) {
      this.widgetInfo = widgetInfo
      this.config = config
      this.type = type
      this.id = id
      const defaultConfig = (this.type === 'edit' && config)
        ? config.configuration.widgets[id].config
        : JSON.parse(widgetInfo.descriptor.defaultConfig)
      if (this.config) {
        if (defaultConfig.targetDeviceAliasIds) {
          this.form.targetDeviceAliasId = defaultConfig.targetDeviceAliasIds[0]
        }
        this.getDeviceEntityList()
      }
      this.settings = {
        title: defaultConfig.title,
        showTitle: defaultConfig.showTitle,
        units: defaultConfig.units,
        decimals: defaultConfig.decimals
      }
      this.highSettings = {
        initialValue: false,
        title: '',
        showOnOffLabels: true,
        retrieveValueMethod: 'rpc',
        valueKey: 'value',
        getValueMethod: 'getValue',
        setValueMethod: 'setValue',
        parseValueFunction: 'return data ? true : false',
        convertValueFunction: 'return value',
        requestTimeout: 500,
        ...defaultConfig.settings
      }
      this.visible = true
    },
    submit () {
      this.$refs.form.validate(valid => {
        if (!valid) return false
        // 应用库
        if (this.config && this.type === 'edit') {
          const widgetInfo = this.config.configuration.widgets[this.id]
          this.$emit('submit', {
            ...widgetInfo,
            config: {
              ...widgetInfo.config,
              targetDeviceAliasIds: [this.form.targetDeviceAliasId],
              ...this.settings,
              settings: { ...this.highSettings }
            }
          })
        // 部件库
        } else {
          const defaultConfig = JSON.parse(this.widgetInfo.descriptor.defaultConfig)
          this.$emit('submit', Object.assign(this.widgetInfo, {
            name: this.settings.title,
            descriptor: {
              ...this.widgetInfo.descriptor,
              defaultConfig: JSON.stringify({
                ...defaultConfig,
                targetDeviceAliasIds: [this.form.targetDeviceAliasId],
                ...this.settings,
                settings: { ...this.highSettings }
              })
            }
          }))
        }
        this.visible = false
      })
    }
  }
}
</script>

<style lang="scss" scoped>
  .margin-bottom{
    margin-bottom: 10px;
  }
  .full-row{
    display: inline-block;
    width: 100%;
  }
</style>
