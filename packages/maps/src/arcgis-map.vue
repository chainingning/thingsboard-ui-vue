<template>
  <div class="map-box">
    <el-card class="op-box">
      <el-collapse>
        <el-collapse-item>
          <el-button @click="test">test</el-button>
          <br>
          <el-form ref="form" :model="form">
            <el-form-item label="实体名">
              <el-select v-model="form.selectValue" @change="changeSelect"
                         style="width: 200px" multiple filterable clearable>
                <el-option v-for="(item, index) in form.selectOptionsList"
                           :key="index"
                           :label="item.name"
                           :value="item.id">
                </el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="轨迹线">
              <el-switch v-model="form.isShowTrack" @change="changeSwitch"></el-switch>
            </el-form-item>
          </el-form>
        </el-collapse-item>
      </el-collapse>
    </el-card>
    <ArcgisBaseMap @finishLoadMap="finishLoadMap" :init="initMapData"></ArcgisBaseMap>
  </div>
</template>

<script>
export default {
  name: 'ArcgisMap',
  data () {
    return {
      style: '',
      form: {
        selectValue: [],
        selectOptionsList: [],
        isShowTrack: true
      },
      initMapData: {
        centerLongitude: 116.60789,
        centerLatitude: 40.049022,
        zoom: 15
      },
      map: null,
      layer1: null,
      layer2: null,
      layerFlag: true,
      settings: {
        defaultCenterPosition: '116.60789,40.049022',
        markerImages: [
          'data:image/png;base64,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'
        ]
      },
      timewindow: {}, // 时间窗口
      paths: [],
      pathsList: {}, // 每个设备的轨迹
      loading: true,
      isRendering: false,
      timer: null,
      cmdIdList: [],
      cmdIds: [],
      functionIdList: [], // 要执行的函数列表
      cmdIdToEntityId: [], // cmdId对应实体id
      aliasToEntity: {}, // 实体别名对应实体id
      entityIdToFunction: {}, // 实体id对应属性函数
      aliasToFunction: {}, // 实体别名对应属性函数
      isTsData: true // 是否实时数据
    }
  },
  computed: {
    getWsData () {
      return this.$store.state.websocket.websocketData.filter(item => this.cmdIdList.includes(item.subscriptionId))
    },
    selectEntityList () { // 选中显示的实体列表
      const list = []
      this.form.selectValue.forEach(item => {
        list.push(...this.aliasToEntity[item])
      })
      return list
    }
  },
  inject: ['widgetInfo', 'config', 'id'],
  methods: {
    initMap () {
      const { settings } = this.config
        ? this.config.configuration.widgets[this.id].config
        : JSON.parse(this.widgetInfo.descriptor.defaultConfig)
      this.settings = Object.assign({}, settings)
      this.initMapData = {
        centerLongitude: this.settings.defaultCenterPosition.split(',')[0],
        centerLatitude: this.settings.defaultCenterPosition.split(',')[1],
        zoom: 15
      }
    },
    renderMap ([Map, MapView, GraphicsLayer, Graphic, Polyline, PictureMarkerSymbol]) {
      if (this.loading || this.isRendering) return
      this.$nextTick(() => {
        this.isRendering = true
        if (JSON.stringify(this.pathsList) === '{}') {
          this.isRendering = false
          return
        }
        const graphicList = []
        for (const key in this.pathsList) {
          const paths = this.pathsList[key]
          const polyline = {
            type: 'polyline',
            paths
          }
          const lineSymbol = {
            type: 'simple-line',
            color: [226, 119, 40],
            width: 4
          }
          const polylineGraphic = new Graphic({
            geometry: polyline,
            symbol: lineSymbol
          })
          const lastPos = paths.slice(-1)[0]
          const longitude = lastPos[0]
          const latitude = lastPos[1]
          const point = {
            type: 'point',
            longitude,
            latitude
          }
          const attributes = {
            deviceId: key,
            longitude,
            latitude
          }
          const markerSymbol = {
            type: 'picture-marker',
            height: '50px',
            width: '45px',
            yoffset: '25px',
            url: this.settings.markerImages[0]
          }
          const pointGraphic = new Graphic({
            geometry: point,
            symbol: markerSymbol,
            attributes,
            popupTemplate: {
              title: '{name}',
              content: [{
                type: 'fields',
                fieldInfos: [{
                  fieldName: 'deviceId'
                }, {
                  fieldName: 'longitude'
                }, {
                  fieldName: 'latitude'
                }]
              }]
            }
          })
          if (this.selectEntityList.includes(key)) {
            if (this.form.isShowTrack) {
              graphicList.push(polylineGraphic)
            }
            graphicList.push(pointGraphic)
          }
        }
        if (this.layerFlag) {
          this.layer1 = new GraphicsLayer({
            graphics: graphicList
          })
          this.map.map.remove(this.layer2)
          this.map.map.add(this.layer1)
          this.layerFlag = false
        } else {
          this.layer2 = new GraphicsLayer({
            graphics: graphicList
          })
          this.map.map.remove(this.layer1)
          this.map.map.add(this.layer2)
          this.layerFlag = true
        }
        this.isRendering = false
      })
    },
    startRenderMap () {
      if (!this.map) return
      if (!this.map.argList) return
      this.renderMap(this.map.argList)
    },
    finishLoadMap (val) {
      this.map = val
      this.loading = false
      this.startRenderMap()
    },
    changeSelect () {
      this.startRenderMap()
    },
    changeSwitch () {
      this.startRenderMap()
    },
    test () {
      console.log(this.pathsList)
    },
    // getCurrentCmdId () {
    //   return this.$store.state.websocket.cmdId
    // },
    async sendWsData () {
      this.cmdIdToEntityId = {}
      const data = {
        attrSubCmds: [],
        historyCmds: [],
        tsSubCmds: []
      }
      const { datasources } = this.config
        ? this.config.configuration.widgets[this.id].config
        : JSON.parse(this.widgetInfo.descriptor.defaultConfig)
      this.setSelectOptionsList(datasources)
      this.functionIdList = []
      this.entityIdToFunction = {}
      this.aliasToFunction = {}
      datasources.forEach(item => {
        if (item.type === 'entity') { // 实体类型
          const entityInfo = this.config.configuration.entityAliases[item.entityAliasId]
          const isMultiEntity = entityInfo.filter[entityInfo.filter.type] instanceof Array
          if (isMultiEntity) {
            item.entityList = entityInfo.filter[entityInfo.filter.type].map(id => {
              return {
                entityType: entityInfo.filter.entityType,
                id
              }
            })
          } else {
            item.entityList = [{
              entityType: entityInfo.filter[entityInfo.filter.type].entityType,
              id: entityInfo.filter[entityInfo.filter.type].id
            }]
          }
          const obj = {}
          item.dataKeys.forEach(keyItem => {
            const fnBody = keyItem.postFuncBody ? keyItem.postFuncBody : 'return value'
            obj[keyItem.name] = Function.call(this, 'time', 'value', fnBody)
          })
          item.entityList.forEach(entityItem => {
            this.entityIdToFunction[entityItem.id] = obj
          })
        } else { // 函数类型
          this.functionIdList.push(item.name)
          this.aliasToEntity[item.name] = [item.name]
          item.entityList = [{
            id: item.name
          }]
          const obj = {}
          item.dataKeys.forEach(keyItem => {
            const fnBody = keyItem.funcBody ? keyItem.funcBody : 'return value'
            obj[keyItem.label] = Function.call(this, 'time', 'value', fnBody)
          })
          item.entityList.forEach(entityItem => {
            this.entityIdToFunction[entityItem.id] = obj
          })
        }
      })
      const tsSubCmds = []
      const historyCmds = []
      // let cmdId = this.getCurrentCmdId()
      let cmdIndex = 0
      if (this.isTsData) { // 发送的实时数据
        datasources.forEach(item => {
          if (item.type === 'function') return
          const keysList = []
          item.dataKeys.forEach(keyItem => {
            keysList.push(keyItem.name)
          })
          const interval = this.timewindow.realtime ? this.timewindow.realtime.interval : 1000
          const timewindowMs = this.timewindow.realtime ? this.timewindow.realtime.timewindowMs : 60000
          const agg = this.timewindow.aggregation ? this.timewindow.aggregation.type : 'NONE'
          const limit = this.timewindow.aggregation ? this.timewindow.aggregation.limit : 50
          const startTs = new Date().getTime() - (timewindowMs + interval)
          item.entityList.forEach(entityItem => {
            const obj = {
              // cmdId,
              entityId: entityItem.id,
              entityType: entityItem.entityType,
              keys: keysList.join(','),
              agg,
              interval,
              timeWindow: timewindowMs + interval,
              limit: agg === 'NONE' ? limit : timewindowMs / interval + 1,
              startTs
            }
            // this.cmdIds.push(cmdId)
            tsSubCmds.push(obj)
            this.cmdIdToEntityId[cmdIndex] = entityItem.id
            cmdIndex++
          })
        })
      } else { // 发送的历史数据
        const interval = this.timewindow.history ? this.timewindow.history.interval : 1000
        const timewindowMs = this.timewindow.history ? this.timewindow.history.timewindowMs : 60000
        const agg = this.timewindow.aggregation ? this.timewindow.aggregation.type : 'NONE'
        const limit = this.timewindow.aggregation ? this.timewindow.aggregation.limit : 50
        const historyType = this.timewindow.history ? this.timewindow.history.historyType : 0
        const nowTime = new Date().getTime()
        const startTs = historyType ? this.timewindow.history.fixedTimewindow.startTimeMs : nowTime - timewindowMs
        const endTs = historyType ? this.timewindow.history.fixedTimewindow.endTimeMs : nowTime
        datasources.forEach(item => {
          if (item.type === 'function') return
          const keysList = []
          item.dataKeys.forEach(keyItem => {
            keysList.push(keyItem.name)
          })
          item.entityList.forEach(entityItem => {
            const obj = {
              // cmdId,
              entityId: entityItem.id,
              entityType: entityItem.entityType,
              keys: keysList.join(','),
              agg,
              startTs,
              endTs,
              interval,
              limit: agg === 'NONE' ? limit : (endTs - startTs) / interval
            }
            historyCmds.push(obj)
            this.cmdIdToEntityId[cmdIndex] = entityItem.id
            cmdIndex++
          })
        })
      }
      data.tsSubCmds = tsSubCmds
      data.historyCmds = historyCmds
      this.cmdIdList = await this.$store.dispatch('websocketsend', data)
      console.log(this.cmdIdList)
    },
    setPos () {
      const limit = this.timewindow.aggregation ? this.timewindow.aggregation.limit : 50
      if (this.isTsData) { // 实时数据
        this.getWsData.forEach(item => {
          const index = this.cmdIdList.indexOf(item.subscriptionId)
          const deviceId = this.cmdIdToEntityId[index]
          const longFn = this.entityIdToFunction[deviceId].longitude
          const latFn = this.entityIdToFunction[deviceId].latitude
          if (!this.pathsList[deviceId]) {
            const { longitude, latitude } = item.data
            if (longitude && longitude.length > 0) {
              this.pathsList[deviceId] = []
              for (let i = item.data.longitude.length - 1; i > 0; i--) {
                const lon = longFn(longitude[i][0], longitude[i][1])
                const lat = latFn(latitude[i][0], latitude[i][1])
                this.pathsList[deviceId].push([lon, lat])
              }
              this.startRenderMap()
            }
          } else {
            const longitude = longFn(item.data.longitude[0][0], item.data.longitude[0][1])
            const latitude = latFn(item.data.latitude[0][0], item.data.latitude[0][1])
            const newPos = [longitude, latitude]
            const len = this.pathsList[deviceId].length
            const oldLon = this.pathsList[deviceId][len - 1][0]
            const oldLat = this.pathsList[deviceId][len - 1][1]
            if ((longitude !== oldLon) || (latitude !== oldLat)) {
              if (len >= limit) {
                this.pathsList[deviceId].shift()
              }
              this.pathsList[deviceId].push(newPos)
              this.startRenderMap()
            }
          }
        })
        this.functionIdList.forEach(id => {
          const longFn = this.entityIdToFunction[id].longitude
          const latFn = this.entityIdToFunction[id].latitude
          const longitude = longFn(new Date().getTime())
          const latitude = latFn(new Date().getTime())
          const newPos = [longitude, latitude]
          if (!this.pathsList[id]) {
            this.pathsList[id] = []
            this.pathsList[id].push(newPos)
            this.startRenderMap()
          } else {
            const len = this.pathsList[id].length
            if (len >= limit) {
              this.pathsList[id].shift()
            }
            const oldLon = this.pathsList[id][len - 1][0]
            const oldLat = this.pathsList[id][len - 1][1]
            if ((longitude !== oldLon) || (latitude !== oldLat)) {
              this.pathsList[id].push(newPos)
              this.startRenderMap()
            }
          }
        })
      } else { // 历史数据
        this.getWsData.forEach(item => {
          const index = this.cmdIdList.indexOf(item.subscriptionId)
          const deviceId = this.cmdIdToEntityId[index]
          const longFn = this.entityIdToFunction[deviceId].longitude
          const latFn = this.entityIdToFunction[deviceId].latitude
          const { longitude, latitude } = item.data
          if (longitude && longitude.length > 0) {
            this.pathsList[deviceId] = []
            for (let i = item.data.longitude.length - 1; i > 0; i--) {
              const lon = longFn(longitude[i][0], longitude[i][1])
              const lat = latFn(latitude[i][0], latitude[i][1])
              this.pathsList[deviceId].push([lon, lat])
            }
          }
        })
        if (JSON.stringify(this.pathsList) !== '{}') {
          this.startRenderMap()
        }
      }
    },
    setSelectOptionsList (datasources) {
      this.form.selectOptionsList = []
      for (const data of datasources) {
        this.form.selectOptionsList.push({ // 函数不存在entityAliasId
          name: data.entityAliasId ? this.config.configuration.entityAliases[data.entityAliasId].alias : data.name,
          id: data.entityAliasId ? data.entityAliasId : data.name
        })
      }
    },
    setAliasToEntity () {
      this.aliasToEntity = {}
      if (!this.config) return
      for (const key in this.config.configuration.entityAliases) {
        const item = this.config.configuration.entityAliases[key]
        const isMultiEntity = item.filter[item.filter.type] instanceof Array
        if (isMultiEntity) {
          this.aliasToEntity[item.id] = item.filter[item.filter.type]
        } else {
          this.aliasToEntity[item.id] = [item.filter[item.filter.type].id]
        }
      }
    },
    loop () {
      this.timer = setInterval(() => {
        this.setPos()
      }, 1000)
    }
  },
  async created () {
    this.timewindow = this.config ? this.config.configuration.timewindow : {}
    console.log(this.timewindow)
    this.isTsData = (!this.timewindow) || (JSON.stringify(this.timewindow) === '{}') || (this.timewindow.selectedTab === 0)
    this.setAliasToEntity()
    await this.sendWsData()
  },
  mounted () {
    // const pWidth = this.$el.parentNode.clientWidth
    // const pHeight = this.$el.parentNode.clientHeight
    // this.style = `width:${pWidth}px;height:${pHeight}px`
    this.initMap()
    this.setPos()
    this.loop()
  },
  beforeDestroy () {
    clearInterval(this.timer)
    this.timer = null
    this.$store.dispatch('websocketUnsubscribe', this.cmdIdList)
  }
}
</script>

<style lang="scss" scoped>
  .map-box {
    position: relative;
    width: 100%;
    height: 100%;
    .op-box {
      position: absolute;
      z-index: 99;
      margin-top: 90px;
    }
  }
</style>
