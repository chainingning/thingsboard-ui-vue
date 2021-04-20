<template>
  <div ref="chart" class="chart"></div>
</template>

<script>
export default {
  props: {
    option: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      echarts: null
    }
  },
  methods: {
    init () {
      if (!this.echarts) {
        this.echarts = this.$echarts.init(this.$refs.chart)
      }
      this.echarts.on('datazoom', params => {
        this.option.dataZoom.forEach(item => {
          item.start = params.start
          item.end = params.end
        })
      })
      this.echarts.setOption(this.option)
    }
  },
  mounted () {
    this.init()
  },
  beforeUpdate () {
    this.echarts = null
  },
  watch: {
    option: {
      deep: true,
      handler () {
        this.init()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.chart {
  width: 100%;
  height: 100%;
}
</style>
