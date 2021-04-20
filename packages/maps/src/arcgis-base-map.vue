<template>
  <div class="map-box" v-loading="loading">
    <div :id="mapId" class="web-map"></div>
  </div>
</template>

<script>
import { getUuid } from '@/utils/index'
import { loadModules } from 'esri-loader'
export default {
  name: 'ArcgisBaseMap',
  props: {
    init: {
      type: Object,
      default: () => {
        return {
          centerLongitude: 116.60789,
          centerLatitude: 40.049022,
          zoom: 15
        }
      }
    }
  },
  data () {
    return {
      mapId: 'web-map',
      loading: false,
      options: {
        url: 'https://js.arcgis.com/4.18/',
        css: 'https://js.arcgis.com/4.18/esri/css/main.css'
      },
      map: {
        argList: [],
        map: null,
        mapView: null
      }
    }
  },
  watch: {
    init: {
      deep: true,
      handler () {
        this.loadMap()
      }
    }
  },
  methods: {
    loadMap () {
      this.loading = true
      loadModules([
        'esri/Map',
        'esri/views/MapView',
        'esri/layers/GraphicsLayer',
        'esri/Graphic',
        'esri/geometry/Polyline'
      ], this.options).then(([Map, MapView, GraphicsLayer, Graphic, Polyline, PictureMarkerSymbol]) => {
        this.map.argList = [Map, MapView, GraphicsLayer, Graphic, Polyline, PictureMarkerSymbol]
        this.loading = false
        this.map.map = new Map({
          basemap: 'hybrid'
        })
        this.map.mapView = new MapView({
          container: this.mapId,
          map: this.map.map,
          center: [this.init.centerLongitude, this.init.centerLatitude],
          zoom: this.init.zoom
        })
        this.$emit('finishLoadMap', this.map)
      })
    }
  },
  created () {
    // this.loadMap()
    this.mapId = `web-map${getUuid()}`
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
