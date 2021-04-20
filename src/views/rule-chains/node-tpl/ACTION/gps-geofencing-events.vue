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
    <template v-if="!form.fetchPerimeterInfoFromMessageMetadata">
      <el-form-item label="边框类型" prop="perimeterType">
        <el-select v-model="form.perimeterType">
          <el-option label="圆" value="CIRCLE"></el-option>
          <el-option label="边" value="POLYGON"></el-option>
        </el-select>
      </el-form-item>
      <div class="circle-container">
        <el-form-item label="中心点纬度" prop="centerLatitude" v-if="form.perimeterType === 'CIRCLE'">
          <el-input v-model="form.centerLatitude"></el-input>
        </el-form-item>
        <el-form-item label="中心点经度" prop="centerLongitude" v-if="form.perimeterType === 'CIRCLE'">
          <el-input v-model="form.centerLongitude"></el-input>
        </el-form-item>
        <el-form-item label="范围" prop="range" v-if="form.perimeterType === 'CIRCLE'">
          <el-input v-model="form.range"></el-input>
        </el-form-item>
        <el-form-item label="单位" prop="rangeUnit" v-if="form.perimeterType === 'CIRCLE'">
          <el-select v-model="form.rangeUnit">
            <el-option label="米" value="METER"></el-option>
            <el-option label="公里" value="KILOMETER"></el-option>
            <el-option label="英尺" value="FOOT"></el-option>
            <el-option label="英里" value="MILE"></el-option>
            <el-option label="海里" value="NAUTICAL_MILE"></el-option>
          </el-select>
        </el-form-item>
      </div>
      <el-form-item label="多边形定义" prop="polygonsDefinition" v-if="form.perimeterType === 'POLYGON'">
        <el-input v-model="form.polygonsDefinition"></el-input>
        <span style="color:#808080;fontSize:12px;">请使用以下格式手动定义多边形: [[lat1,lon1],[lat2,lon2], ... ,[latN,lonN]]</span>
      </el-form-item>
    </template>
    <div class="time-container">
      <el-form-item label="最小内部持续时间" prop="minInsideDuration">
        <el-input type="number" :min="1" v-model="form.minInsideDuration"></el-input>
      </el-form-item>
      <el-form-item label="最小内部持续时间单位" prop="minInsideDurationTimeUnit">
        <el-select v-model="form.minInsideDurationTimeUnit">
          <el-option label="毫秒" value="MILLISECONDS"></el-option>
          <el-option label="秒" value="SECONDS"></el-option>
          <el-option label="分钟" value="MINUTES"></el-option>
          <el-option label="小时" value="HOURS"></el-option>
          <el-option label="天" value="DAYS"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="最小外部持续时间" prop="minOutsideDuration">
        <el-input type="number" :min="1" v-model="form.minOutsideDuration"></el-input>
      </el-form-item>
      <el-form-item label="最小外部持续时间单位" prop="minOutsideDurationTimeUnit">
        <el-select v-model="form.minOutsideDurationTimeUnit">
          <el-option label="毫秒" value="MILLISECONDS"></el-option>
          <el-option label="秒" value="SECONDS"></el-option>
          <el-option label="分钟" value="MINUTES"></el-option>
          <el-option label="小时" value="HOURS"></el-option>
          <el-option label="天" value="DAYS"></el-option>
        </el-select>
      </el-form-item>
    </div>
    <el-form-item label="描述" prop="description">
      <el-input type="textarea" autosize v-model="form.description"></el-input>
    </el-form-item>
  </el-form>
</template>

<script>
export default {
  name: 'GpsGeofencingEvents',
  props: ['nodeInfo', 'configurationDescriptor'],
  data () {
    const minInsideDuration = (rule, value, callback) => {
      if (Number(value) < 0) {
        callback(new Error('最小内部持续时间应大于1或等于1'))
      } else if (value === '' || value === undefined) {
        callback(new Error('最小内部持续时间不能为空'))
      } else {
        callback()
      }
    }
    const minOutsideDuration = (rule, value, callback) => {
      if (Number(value) < 0) {
        callback(new Error('最小外部持续时间应大于1或等于1'))
      } else if (value === '' || value === undefined) {
        callback(new Error('最小外部持续时间不能为空'))
      } else {
        callback()
      }
    }
    return {
      isTplType: false,
      form: {
        name: '',
        debugMode: false,
        latitudeKeyName: '',
        longitudeKeyName: '',
        fetchPerimeterInfoFromMessageMetadata: true,
        perimeterType: '',
        centerLatitude: '',
        centerLongitude: '',
        range: '',
        rangeUnit: '',
        polygonsDefinition: '',
        minInsideDuration: '',
        minOutsideDuration: '',
        minInsideDurationTimeUnit: '',
        minOutsideDurationTimeUnit: '',
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
        polygonsDefinition: [{ required: true, message: '多边形定义不能为空', trigger: 'change' }],
        minInsideDuration: [{ required: true, validator: minInsideDuration, trigger: 'change' }],
        minOutsideDuration: [{ required: true, validator: minOutsideDuration, trigger: 'change' }],
        minInsideDurationTimeUnit: [{ required: true, message: '最小内部持续时间单位不能为空', trigger: 'change' }],
        minOutsideDurationTimeUnit: [{ required: true, message: '最小外部持续时间单位不能为空', trigger: 'change' }]
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
            polygonsDefinition: this.form.polygonsDefinition,
            minInsideDuration: this.form.minInsideDuration,
            minOutsideDuration: this.form.minOutsideDuration,
            minInsideDurationTimeUnit: this.form.minInsideDurationTimeUnit,
            minOutsideDurationTimeUnit: this.form.minOutsideDurationTimeUnit
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
