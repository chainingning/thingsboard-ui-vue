<template>
  <div class="map-box" v-loading="loading">
    <div :id="mapId" class="web-map"></div>
  </div>
</template>

<script>
import { getUuid } from '@/utils/index'
import { loadModules } from 'esri-loader'
export default {
  name: 'BnBaseMap',
  props: {
    init: {
      type: Object,
      default: () => {
        return {
          centerLongitude: 116.41005240556589,
          centerLatitude: 39.50980350216803,
          zoom: 15
        }
      }
    }
  },
  data () {
    return {
      mapId: 'web-map',
      loading: false,
      map: {
        argList: [],
        map: null
      }
    }
  },
  watch: {
    init: {
      deep: true,
      handler () {
        console.log('change init')
        this.initMap()
      }
    }
  },
  methods: {
    initMap () {
      this.loading = true
      this.loadMap().then(async ([util, BNSymbol, BNFactory, BNDirectorys]) => {
        console.log('arglist', this.map.argList)
        const BNGeometry = new BNFactory('BNGeometry')
        const BNmapUtil = new BNFactory('BNmapUtil', this.map.map)
        const centerXY = await this.doLatLngTransformMapXY(BNmapUtil, [[this.init.centerLongitude, this.init.centerLatitude]])
        // console.log(centerXY)
        const pt = BNGeometry.createPoint(centerXY[0].x, centerXY[0].y, this.map.map.spatialReference)
        // const pt = BNGeometry.createPoint(502796.67360732506, 505115.9443376776, this.map.map.spatialReference)
        this.map.map.setCenter(pt)
        this.loading = false
        this.$emit('finishLoadMap', this.map)
      })
    },
    loadMap () {
      console.log('loadMap')
      return new Promise((resolve, reject) => {
        try {
          loadModules([
            'js/BNUtil',
            'js/BNSymbol',
            'js/BNFactory',
            'js/BNDirectorys',
            'js/jquery-3.2.1.min'
          ]).then(([util, BNSymbol, BNFactory, BNDirectorys]) => {
            this.map.argList = [util, BNSymbol, BNFactory, BNDirectorys]
            this.map.map = new BNFactory(
              '335',
              {
                id: this.mapId,
                options: {
                  logo: false,
                  slider: false,
                  minZoom: 0,
                  maxZoom: 8
                }
              }
            )
            this.map.map.setProxy(false)
            // console.log('spatialReference', this.map.map.spatialReference)
            // this.map.map.createSpatialReference(4326)
            // console.log('spatialReference', this.map.map.spatialReference)
            resolve(this.map.argList)
          }).catch(e => {
            throw e
          })
        } catch (e) {
          reject(e)
        }
      })
    },
    doLatLngTransformMapXY (util, coordinateArray) { // 经纬度转地图坐标
      return new Promise((resolve, reject) => {
        util.doLatLngTransformMapXY(coordinateArray, 4326, this.map.map.spatialReference, data => {
          resolve(data)
        })
      })
    },
    toLatLngTransformMapXY (util, coordinateArray) { // 地图坐标转经纬度
      return new Promise((resolve, reject) => {
        util.toLatLngTransformMapXY(coordinateArray, this.map.map.spatialReference, 4326, data => {
          resolve(data)
        })
      })
    }
  },
  created () {
    this.mapId = `web-map${getUuid()}`
    // this.initMap()
  }
}
</script>

<style lang="scss" scoped>
  .map-box {
    position: relative;
    width: 100%;
    height: 100%;
    .web-map {
      position: absolute;
      width: 100%;
      height: 100%;
    }
  }
</style>
