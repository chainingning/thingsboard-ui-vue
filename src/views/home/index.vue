<template>
  <div class="app-container" v-loading="loading">
    <div class="left-container">
      <div class="left-container-top">
        <div class="title">
          <span>资源概览</span>
        </div>
        <ul class="device-container">
          <li v-for="(item, key) in device" :key="item.name">
            <span>
              <i class="iconfont" :class="item.icon"></i>
            </span>
            <span>{{ item.name }}</span>
            <span>{{ apiData[key] | formatDevice(key) }}</span>
          </li>
        </ul>
      </div>
      <div class="left-container-bottom">
        <div class="title">
          <span>数据服务</span>
        </div>
        <div class="bar">
          <echarts :option="barOption"></echarts>
        </div>
        <div class="pie">
          <echarts :option="pieOption"></echarts>
        </div>
        <div class="line">
          <el-select v-model="sysType" size="mini" @change="sysTypeChange">
            <el-option
              v-for="item in apiData.sysList"
              :key="item.id.id"
              :label="item.name"
              :value="item.id.id" />
          </el-select>
          <echarts :option="lineOption"></echarts>
        </div>
        <div class="hollow-pie">
          <echarts :option="hollowPieOption"></echarts>
        </div>
      </div>
    </div>
    <div class="right-container">
      <div class="right-container-top">
        <div class="title">
          <span>设备数量</span>
          <el-select v-model="deviceType" size="mini" @change="changeDeviceType">
            <el-option label="全部" value=""></el-option>
            <el-option v-for="item in apiData.areasList" :key="item.id.id" :label="item.name" :value="item.id.id"></el-option>
          </el-select>
        </div>
        <ul>
          <li>
            <span>设备类型</span>
            <span>数量</span>
          </li>
          <li v-for="item in apiData.deviceTypeList" :key="item.typeName">
            <span>{{ item.typeName }}</span>
            <span>{{ item.count }}</span>
          </li>
        </ul>
      </div>
      <div class="right-container-bottom">
        <div class="title">
          <span>最新告警</span>
          <a href="#" @click="$router.push({ path: '/home/alarm' })">查看所有告警</a>
        </div>
        <ul>
          <li v-for="(item, index) in apiData.alarmList" :key="index">
            <i class="iconfont icon-alarm" :class="item.severity.toLocaleLowerCase()"></i>
            <span>{{ item.type }}</span>
            <span>{{ item.originatorName }}</span>
            <span :class="item.severity.toLocaleLowerCase()">{{ item.severity | formatSeverity }}</span>
            <span>{{ item.createdTime | formatTimestamp }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import Echarts from '@echarts'
import barOption from '@echarts/json/home/bar.json'
import pieOption from '@echarts/json/home/pie.json'
import lineOption from '@echarts/json/home/line.json'
import hollowPieOption from '@echarts/json/home/hollow-pie.json'
import { getDate } from '@/utils'
export default {
  name: 'Home',
  components: { Echarts },
  data () {
    return {
      device: {
        alarm: { name: '当前设备告警数', icon: 'icon-device-alarm' },
        online: { name: '在线设备', icon: 'icon-online-device' },
        total: { name: '设备总量', icon: 'icon-device-model' },
        add: { name: '当月新增设备', icon: 'icon-add-device' },
        throughput: { name: '当月设备吞吐量', icon: 'icon-offline-device' }
      },
      deviceType: '',
      sysType: '',
      apiData: {
        alarm: 0,
        online: 0,
        total: 0,
        add: 0,
        throughput: 0,
        deviceTypeList: [],
        areasList: [],
        devicesAreaList: [],
        sysList: [],
        networkList: [],
        alarmList: []
      },
      barOption,
      pieOption,
      lineOption,
      hollowPieOption,
      loading: true
    }
  },
  methods: {
    async sysTypeChange (value) {
      try {
        const sysName = this.apiData.sysList.filter(item => item.id.id === value)[0].name
        const result = await this.$api.getStateCallSystems({ systemIds: value, days: 30 })
        this.lineOption = {
          ...lineOption,
          title: {
            ...lineOption.title,
            text: sysName
          },
          xAxis: {
            ...lineOption.xAxis
          },
          series: [
            {
              ...lineOption.series[0],
              data: [
                ...result.data.sort((a, b) => a.dayTime - b.dayTime).map(ele => [
                  getDate({ timestamp: ele.dayTime, format: 'MM-dd' }),
                  ele.count
                ])
              ]
            }
          ]
        }
      } catch (error) {
        console.log(error)
      }
    },
    async changeDeviceType (value) {
      try {
        const params = value ? { strAssetId: value } : null
        const result = await this.$api.getStateDeviceType(params)
        this.apiData.deviceTypeList = result.data
      } catch (error) {
        console.log(error)
      }
    },
    getFirstAndLastDay () {
      const date = new Date()
      const year = date.getFullYear()
      let month = date.getMonth() + 1
      if (month >= 1 && month <= 9) {
        month = '0' + month
      }
      const lastDay = this.getLastDay(year, month)
      return {
        startTime: new Date(`${year}-${month}-01 00:00:00`).getTime(),
        endTime: new Date(`${year}-${month}-${lastDay} 23:59:59`).getTime()
      }
    },
    getLastDay (year, month) {
      let newYear = year
      let newMonth = month++
      if (month > 12) {
        newMonth -= 12
        newYear++
      }
      const lastDate = new Date(newYear, newMonth, 0).getDate()
      return lastDate
    },
    loopApi () {
      let timer = setInterval(async () => {
        this.init(false)
      }, 30000)
      let _timer = setInterval(async () => {
        this.getAlarm()
        this.getStateAlarms()
      }, 5000)
      this.$once('hook:beforeDestroy', () => {
        clearInterval(timer)
        clearInterval(_timer)
        timer = null
        _timer = null
      })
    },
    async getAlarm () {
      const result = await this.$api.getAlarm({
        pageSize: 10,
        page: 0,
        sortProperty: 'createdTime',
        sortOrder: 'DESC',
        status1: 'ACTIVE_UNACK',
        status2: 'ACTIVE_ACK'
      })
      this.apiData.alarmList = result.data.data
    },
    async getStateAlarms () {
      const result = await this.$api.getStateAlarms({ status1: 'ACTIVE_UNACK', status2: 'ACTIVE_ACK' })
      this.apiData.alarm = result.data
    },
    async init (loading = true) {
      this.loading = loading
      try {
        const apiData = [
          'online',
          'total',
          'add',
          'throughput',
          'deviceTypeList',
          'areasList',
          'devicesAreaList',
          'sysList',
          'networkList'
        ]
        const result = await Promise.all([
          this.$api.getStateDeviceOnline(),
          this.$api.getStateDeviceTotal(),
          this.$api.getStateDeviceAdded(this.getFirstAndLastDay()),
          this.$api.getStateRate(this.getFirstAndLastDay()),
          this.$api.getStateDeviceType(this.deviceType ? { strAssetId: this.deviceType } : null),
          this.$api.getStateAreas(),
          this.$api.getStateDevicesArea(),
          this.$api.getStateSystems(),
          this.$api.getStateNetwork()
        ])
        apiData.forEach((item, index) => {
          this.apiData[item] = result[index].data || 0
        })
        const systemIds = this.apiData.sysList.map(ele => ele.id.id)
        if (systemIds.length) {
          const sysList = await this.$api.getStateCallSystems({ systemIds: systemIds.join(','), days: 30 })
          const sysNameList = sysList.data.map(item => item.systemName)
          this.apiData.sysList = this.apiData.sysList.filter(item => {
            return sysNameList.includes(item.name)
          })
          if (this.apiData.sysList.length) {
            this.sysType = this.sysType || this.apiData.sysList[0].id.id
            this.sysTypeChange(this.sysType)
          }
          this.barOption = {
            ...barOption,
            xAxis: {
              ...barOption.xAxis,
              data: sysList.data.map(ele => ele.systemName)
            },
            series: [{
              ...barOption.series[0],
              data: sysList.data.map(ele => ele.count)
            }]
          }
        }
        this.pieOption = {
          ...pieOption,
          legend: {
            ...pieOption.legend,
            data: this.apiData.devicesAreaList.map(ele => Object.assign({
              name: ele.assetName,
              textStyle: {
                fontSize: 14
              }
            }))
          },
          series: [{
            ...pieOption.series[0],
            data: this.apiData.devicesAreaList.map(ele => Object.assign({
              name: ele.assetName,
              value: ele.count
            }))
          }]
        }
        this.hollowPieOption = {
          ...hollowPieOption,
          series: [{
            ...hollowPieOption.series[0],
            data: this.apiData.networkList.map(ele => Object.assign({
              value: ele.count,
              name: ele.assetName
            }))
          }]
        }
      } catch {
        this.loading = false
      }
      this.loading = false
    }
  },
  created () {
    this.init()
    this.getAlarm()
    this.getStateAlarms()
    this.loopApi()
  },
  filters: {
    formatTimestamp (value) {
      return value ? getDate({ timestamp: value }) : ''
    },
    formatSeverity (value) {
      const severity = {
        CRITICAL: '危险',
        MAJOR: '重要',
        MINOR: '次要',
        WARNING: '警告',
        INDETERMINATE: '不确定'
      }
      return severity[value]
    },
    formatDevice (value, key) {
      return key === 'throughput' && value >= 10000 ? `${parseInt(value / 10000)}万` : value
    }
  }
}
</script>

<style lang="scss" scoped>
.extend-title {
  position: relative;
  > span {
    &:first-child {
      line-height: 1;
      margin-top: 4px;
      margin-left: 32px;
      float: left;
      font-size: 22px;
      font-weight: bolder;
      font-family: PingFangSC-Medium;
    }
  }
  &:before {
    content: '';
    position: absolute;
    top: 4px;
    left: 0;
    width: 19px;
    height: 19px;
    background-color: #FFCC4F;
  }
}
.app-container {
  min-width: 1700px;
  height: calc(100% - 34px) !important;
  margin: 23px 0 0 20px;
  background-color: transparent;
  border: none !important;
  .left-container, .right-container {
    float: left;
  }
  .left-container {
    width: 1300px;
    .left-container-top, .left-container-bottom {
      .title {
        height: 30px;
        @extend .extend-title;
      }
    }
    .left-container-top {
      .device-container {
        height: 152px;
        margin-top: 15px;
        li {
          float: left;
          width: 240px;
          height: 163px;
          margin-left: 20px;
          background-color: #fff;
          position: relative;
          span {
            &:nth-of-type(1) {
              position: absolute;
              top: 28px;
              right: 15px;
              width: 60px;
              height: 40px;
              background-color: #6993FF;
              border-radius: 3px;
              display: flex;
              justify-content: center;
              align-items: center;
              .iconfont {
                font-size: 22px;
                color: #fff;
              }
            }
            &:nth-of-type(2), &:nth-of-type(3) {
              @include ellipsis();
              float: left;
              width: 100%;
            }
            &:nth-of-type(2) {
              margin: 31px 0 45px 0;
              font-size: 14px;
              font-weight: bold;
              color: #000;
              text-indent: 20px;
            }
            &:nth-of-type(3) {
              text-indent: 20px;
              font-size: 42px;
              font-family: PingFangSC-Medium;
              color: #374979;
            }
          }
          &:first-child {
            margin-left: 0;
          }
          &:nth-of-type(3) {
            margin-left: 23px;
          }
        }
      }
      @include clearfix();
    }
    .left-container-bottom {
      margin-top: 30px;
      .bar, .pie, .line, .hollow-pie {
        float: left;
        background-color: #fff;
        position: relative;
        overflow: hidden;
      }
      .bar, .line {
        width: 880px;
        margin-right: 19px;
      }
      .pie, .hollow-pie {
        width: 381px;
      }
      .bar, .pie {
        height: 357px;
        margin-top: 17px;
        margin-bottom: 17px;
      }
      .line, .hollow-pie {
        height: 304px;
      }
      .line {
        .el-select {
          position: absolute;
          right: 41px;
          top: 17px;
          z-index: 1;
        }
      }
    }
  }
  .right-container {
    width: 383px;
    margin-top: 45px;
    .right-container-top, .right-container-bottom {
      background-color: #fff;
      overflow: hidden;
      .title {
        margin-left: 20px;
        width: calc(100% - 20px - 21px);
        > span {
          &:first-child {
            line-height: 30px;
            float: left;
            font-size: 18px;
            font-weight: bolder;
            font-family: PingFangSC-Medium;
          }
        }
      }
    }
    .right-container-top {
      height: 516px;
      margin-bottom: 16px;
      .title {
        height: 30px;
        margin-top: 23px;
         /deep/ .el-select {
          width: 129px;
          float: right;
          .el-input__inner {
            height: 30px;
            line-height: 1;
            font-size: 14px;
            color: #fff;
            background-color: #6993FF;
            border-color: #6993FF;
          }
          .el-icon-arrow-up {
            font-weight: bolder;
            color: #fff;
          }
        }
      }
      ul {
        margin-top: 18px;
        margin-left: 20px;
        height: calc(100% - 93px);
        width: calc(100% - 20px - 21px);
        background-color: #fff;
        overflow-y: auto;
        border: 1px solid #E1E1E1;
        border-radius: 6px;
        li {
          float: left;
          width: 100%;
          font-size: 14px;
          line-height: 20px;
          padding-bottom: 10px;
          border-bottom: 1px solid #E0E9FF;
          margin-top: 16px;
          span {
            float: left;
            color: #000;
            &:first-child {
              width: calc(100% - 126px);
              text-indent: 19px;
            }
            &:nth-child(2) {
              width: 126px;
              text-align: center;
            }
          }
          &:first-child {
            line-height: 50px;
            background-color: #F6F8FF;
            border-bottom: none;
            margin-top: 0;
            padding-bottom: 0;
            span {
              color: #000000;
            }
          }
        }
      }
    }
    .right-container-bottom {
      height: 386px;
      .title {
        height: 24px;
        margin-top: 20px;
        a {
          float: right;
          margin-top: 7px;
          line-height: 1;
          color: #6993FF;
          font-size: 16px;
          font-weight: bold;
        }
      }
      ul {
        margin-top: 24px;
        margin-left: 20px;
        width: calc(100% - 20px - 19px);
        background-color: #fff;
        height: 316px;
        overflow-y: scroll;
        li {
          float: left;
          width: 100%;
          height: 68px;
          background-color: #F6F8FF;
          margin-bottom: 11px;
          position: relative;
          .icon-alarm {
            position: absolute;
            top: 16px;
            left: 15px;
            // color: #6993FF;
            font-size: 18px;
            &.critical {
              color: red;
            }
            &.major {
              color: orange;
            }
            &.minor {
              color: blue;
            }
            &.warning {
              color: green;
            }
            &.indeterminate {
              color: #000;
            }
          }
          span:nth-of-type(1), span:nth-of-type(2) {
            float: left;
            margin-left: 43px;
            @include ellipsis(calc(100% - 43px - 135px));
          }
          span:nth-of-type(1) {
            line-height: 22px;
            font-size: 16px;
            color: #000;
            margin-top: 16px;
            font-weight: bold;
            margin-bottom: 4px;
          }
          span:nth-of-type(2) {
            line-height: 17px;
            font-size: 12px;
            color: #AEAEAE;
          }
          span:nth-of-type(3) {
            position: absolute;
            top: 19px;
            right: 20px;
            line-height: 17px;
            color: #979797;
            font-size: 12px;
          }
          span:nth-of-type(4) {
            position: absolute;
            top: 41px;
            right: 20px;
            line-height: 17px;
            color: #979797;
            font-size: 12px;
          }
          span {
            &.critical {
              color: red;
            }
            &.major {
              color: orange;
            }
            &.minor {
              color: blue;
            }
            &.warning {
              color: green;
            }
            &.indeterminate {
              color: #000;
            }
          }
        }
      }
    }
  }
}
</style>
