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
    <el-form-item label="纬度键名" prop="latitudeKeyName">
      <el-input v-model="form.latitudeKeyName"></el-input>
    </el-form-item>
    <el-form-item label="经度键名" prop="longitudeKeyName">
      <el-input v-model="form.longitudeKeyName"></el-input>
    </el-form-item>
    <el-form-item prop="fetchPerimeterInfoFromMessageMetadata">
      <el-checkbox v-model="form.fetchPerimeterInfoFromMessageMetadata">从消息元数据获取边界区域信息</el-checkbox>
    </el-form-item>
    <el-form-item label="边框类型" prop="perimeterType" v-if="!form.fetchPerimeterInfoFromMessageMetadata">
      <el-select v-model="form.perimeterType">
        <el-option label="圆" value="CIRCLE"></el-option>
        <el-option label="边" value="POLYGON"></el-option>
      </el-select>
    </el-form-item>
    <el-form-item label="中心点纬度" prop="centerLatitude" v-if="!form.fetchPerimeterInfoFromMessageMetadata && form.perimeterType === 'CIRCLE'">
      <el-input v-model="form.centerLatitude"></el-input>
    </el-form-item>
    <el-form-item label="中心点经度" prop="centerLongitude" v-if="!form.fetchPerimeterInfoFromMessageMetadata && form.perimeterType === 'CIRCLE'">
      <el-input v-model="form.centerLongitude"></el-input>
    </el-form-item>
    <el-form-item label="范围" prop="range" v-if="!form.fetchPerimeterInfoFromMessageMetadata && form.perimeterType === 'CIRCLE'">
      <el-input v-model="form.range"></el-input>
    </el-form-item>
    <el-form-item label="单位" prop="rangeUnit" v-if="!form.fetchPerimeterInfoFromMessageMetadata && form.perimeterType === 'CIRCLE'">
      <el-select v-model="form.rangeUnit">
        <el-option label="米" value="METER"></el-option>
        <el-option label="公里" value="KILOMETER"></el-option>
        <el-option label="英尺" value="FOOT"></el-option>
        <el-option label="英里" value="MILE"></el-option>
        <el-option label="海里" value="NAUTICAL_MILE"></el-option>
      </el-select>
    </el-form-item>
    <el-form-item label="多边形定义" prop="polygonsDefinition" v-if="!form.fetchPerimeterInfoFromMessageMetadata && form.perimeterType === 'POLYGON'">
      <el-input v-model="form.polygonsDefinition"></el-input>
      <span style="color:#808080;fontSize:12px;">请使用以下格式手动定义多边形: [[lat1,lon1],[lat2,lon2], ... ,[latN,lonN]]</span>
    </el-form-item>
    <el-form-item label="描述" prop="description">
      <el-input type="textarea" autosize v-model="form.description"></el-input>
    </el-form-item>
  </el-form>
</template>

<script>
export default {
  name: 'GpsGeofencingFilter',
  props: ['nodeInfo', 'configurationDescriptor'],
  data () {
    return {
      isTplType: false,
      form: {
        name: '',
        debugMode: '',
        latitudeKeyName: '',
        longitudeKeyName: '',
        fetchPerimeterInfoFromMessageMetadata: '',
        perimeterType: '',
        centerLatitude: '',
        centerLongitude: '',
        range: '',
        rangeUnit: '',
        polygonsDefinition: '',
        description: ''
      },
      rules: {
        name: [{ required: true, message: '名称不能为空', trigger: 'change' }],
        latitudeKeyName: [{ required: true, message: '纬度键名不能为空', trigger: 'change' }],
        longitudeKeyName: [{ required: true, message: '经度键名不能为空', trigger: 'change' }],
        perimeterType: [{ required: true, message: '边框类型不能为空', trigger: 'change' }],
        centerLatitude: [{ required: true, message: '中心点纬度不能为空', trigger: 'change' }],
        centerLongitude: [{ required: true, message: '中心点经度不能为空', trigger: 'change' }],
        range: [{ required: true, message: '范围不能为空', trigger: 'change' }],
        rangeUnit: [{ required: true, message: '单位不能为空', trigger: 'change' }],
        polygonsDefinition: [{ required: true, message: '多边形定义不能为空', trigger: 'change' }]
      }
    }
  },
  methods: {
    submit () {
      this.$refs.form.validate(valid => {
        if (!valid) return false
        this.$emit('submit', {
          debugMode: this.form.debugMode,
          name: this.form.name,
          configuration: {
            latitudeKeyName: this.form.latitudeKeyName,
            longitudeKeyName: this.form.longitudeKeyName,
            fetchPerimeterInfoFromMessageMetadata: this.form.fetchPerimeterInfoFromMessageMetadata,
            perimeterType: this.form.perimeterType,
            centerLatitude: this.form.centerLatitude,
            centerLongitude: this.form.centerLongitude,
            range: this.form.range,
            rangeUnit: this.form.rangeUnit,
            polygonsDefinition: this.form.polygonsDefinition
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
