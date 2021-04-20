<template>
  <icloud-dialog width="1000px" title="编辑时间窗口" :visible.sync="isShowDialog">
    <el-tabs v-model="selectedTab">
      <el-tab-pane label="实时" name="0">
        <el-form ref="realtimeForm" v-model="realtimeForm">
          <el-form-item label="最后">
            <el-select v-model="realtimeForm.timewindowMs" @change="changeRealtimeTimewindowMs">
              <el-option v-for="(item, key) in timeOptions" :key="key"
                         :label="timeToLabel(key)" :value="Number(key)"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="数据聚合功能">
            <el-select v-model="aggregation">
              <el-option v-for="(item, index) in aggregationOptionList" :key="index"
                         :label="item.label" :value="item.value"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="最大值" v-if="aggregation==='NONE'">
            <el-input v-model="limit"></el-input>
          </el-form-item>
          <el-form-item label="分组间隔" v-else>
            <el-select v-model="realtimeForm.interval">
              <el-option v-for="(item, index) in intervalOptionList" :key="index"
                         :label="timeToLabel(item)" :value="item"></el-option>
            </el-select>
          </el-form-item>
        </el-form>
      </el-tab-pane>
      <el-tab-pane label="历史" name="1">
        <el-form ref="historyForm" v-model="historyForm">
          <el-form-item>
            <el-radio-group v-model="historyForm.historyType" @change="changeHistoryType">
              <el-radio :label="0">最后</el-radio>
              <el-radio :label="1">时间段</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item v-if="historyForm.historyType===0" label="最后">
            <el-select v-model="historyForm.timewindowMs" @change="changeHistoryTimewindowMs">
              <el-option v-for="(item, key) in timeOptions" :key="key"
                         :label="timeToLabel(key)" :value="Number(key)"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item v-else label="时间段">
            <el-date-picker v-model="historyForm.time" type="datetimerange" style="width: 880px" @change="changeTime"></el-date-picker>
          </el-form-item>
          <el-form-item label="数据聚合功能">
            <el-select v-model="aggregation">
              <el-option v-for="(item, index) in aggregationOptionList" :key="index"
                         :label="item.label" :value="item.value"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="最大值" v-if="aggregation==='NONE'">
            <el-input v-model="limit"></el-input>
          </el-form-item>
          <el-form-item label="分组间隔" v-else>
            <el-select v-model="historyForm.interval">
              <el-option v-for="(item, index) in historyOptionList" :key="index"
                         :label="timeToLabel(item)" :value="item"></el-option>
            </el-select>
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>
    <div class="icloud-dialog-footer" slot="footer">
      <wx-button type="primary" @click="submit">确定</wx-button>
      <wx-button @click="isShowDialog = false">取消</wx-button>
    </div>
  </icloud-dialog>
</template>

<script>
import { Message } from 'element-ui'
export default {
  name: 'timeWindowDialog',
  data () {
    return {
      timewindow: {},
      isShowDialog: false,
      selectedTab: 0,
      realtimeForm: {
        timewindowMs: 60000,
        interval: 1000
      },
      historyForm: {
        historyType: 0,
        time: [new Date(), new Date()],
        timewindowMs: 60000,
        interval: 1000
      },
      aggregation: 'NONE',
      limit: 10,
      timeOptions: {
        1000: [1000],
        5000: [1000],
        10000: [1000],
        15000: [1000],
        30000: [1000],
        60000: [1000, 5000],
        120000: [1000, 5000, 10000],
        300000: [1000, 5000, 10000, 15000, 30000],
        600000: [5000, 10000, 15000, 30000, 60000],
        900000: [5000, 10000, 15000, 30000, 60000],
        1800000: [5000, 10000, 15000, 30000, 60000, 120000],
        3600000: [10000, 15000, 30000, 60000, 120000, 300000],
        7200000: [15000, 30000, 60000, 120000, 300000, 600000],
        18000000: [60000, 120000, 300000, 600000, 900000, 1800000],
        36000000: [120000, 300000, 600000, 900000, 1800000, 3600000],
        43200000: [120000, 300000, 600000, 900000, 1800000, 3600000],
        86400000: [300000, 600000, 900000, 1800000, 3600000, 7200000],
        604800000: [1800000, 3600000, 7200000, 18000000, 43200000],
        2592000000: [7200000, 18000000, 36000000, 43200000, 86400000]
      },
      intervalOptionList: [],
      historyOptionList: [],
      timeOptionList: [
        {
          value: 1000,
          label: '1秒'
        }, {
          value: 5000,
          label: '5秒'
        }, {
          value: 10000,
          label: '10秒'
        }, {
          value: 15000,
          label: '15秒'
        }, {
          value: 30000,
          label: '30秒'
        }, {
          value: 60000,
          label: '1分'
        }, {
          value: 120000,
          label: '2分'
        }, {
          value: 300000,
          label: '5分'
        }, {
          value: 600000,
          label: '10分'
        }, {
          value: 900000,
          label: '15分'
        }, {
          value: 1800000,
          label: '30分'
        }, {
          value: 3600000,
          label: '1小时'
        }, {
          value: 7200000,
          label: '2小时'
        }, {
          value: 18000000,
          label: '5小时'
        }, {
          value: 36000000,
          label: '10小时'
        }, {
          value: 43200000,
          label: '12小时'
        }, {
          value: 86400000,
          label: '1天'
        }, {
          value: 604800000,
          label: '7天'
        }, {
          value: 2592000000,
          label: '30天'
        }
      ],
      aggregationOptionList: [
        {
          value: 'MIN',
          label: '最小值'
        },
        {
          value: 'MAX',
          label: '最大值'
        },
        {
          value: 'AVG',
          label: '平均值'
        },
        {
          value: 'SUM',
          label: '求和'
        },
        {
          value: 'COUNT',
          label: '计数'
        },
        {
          value: 'NONE',
          label: '空'
        }
      ]
    }
  },
  methods: {
    async openDialog (timewindow) {
      if (timewindow && (JSON.stringify(timewindow) !== '{}')) {
        this.timewindow = Object.assign({}, timewindow)
        const { selectedTab, aggregation, realtime, history } = this.timewindow
        this.selectedTab = `${selectedTab || 0}`
        if (realtime) {
          this.realtimeForm = {
            timewindowMs: realtime.timewindowMs,
            interval: realtime.interval
          }
        }
        if (history) {
          const startTime = history.fixedTimewindow.startTimeMs
          const endTime = history.fixedTimewindow.endTimeMs
          this.historyForm = {
            historyType: history.historyType,
            time: [new Date(startTime), new Date(endTime)],
            timewindowMs: history.timewindowMs,
            interval: history.interval
          }
          // 计算历史时间段
          if ((this.selectedTab === '1') && (history.historyType === 1)) {
            this.changeHistoryType(1)
          }
        }
        if (aggregation) {
          this.aggregation = aggregation.type
          this.limit = aggregation.limit
        }
      }
      this.intervalOptionList = this.timeOptions[this.realtimeForm.timewindowMs]
      this.historyOptionList = this.timeOptions[this.historyForm.timewindowMs]
      this.isShowDialog = true
    },
    changeRealtimeTimewindowMs () {
      this.intervalOptionList = this.timeOptions[this.realtimeForm.timewindowMs]
      const interval = this.intervalOptionList[0]
      this.realtimeForm.interval = interval
    },
    changeHistoryType (val) {
      console.log(this.historyForm)
      if (val === 0) { // 最后
        this.changeHistoryTimewindowMs()
      } else if (val === 1) { // 时间段
        if (this.historyForm.time) {
          const [start, end] = this.historyForm.time
          const timeRange = new Date(end).getTime() - new Date(start).getTime()
          this.setHistoryOptionList(timeRange)
        }
      }
    },
    changeHistoryTimewindowMs () {
      this.historyOptionList = this.timeOptions[this.historyForm.timewindowMs]
      const interval = this.historyOptionList[0]
      this.historyForm.interval = interval
    },
    changeTime (val) {
      if (val) {
        const [start, end] = val
        const timeRange = new Date(end).getTime() - new Date(start).getTime()
        this.setHistoryOptionList(timeRange)
      }
    },
    setHistoryOptionList (timeRange) {
      let time = 1000
      if ((timeRange > 30000) && (timeRange <= 60000)) {
        time = 60000
      } else if (timeRange <= 120000) {
        time = 120000
      } else if (timeRange <= 300000) {
        time = 300000
      } else if (timeRange <= 600000) {
        time = 600000
      } else if (timeRange <= 900000) {
        time = 900000
      } else if (timeRange <= 1800000) {
        time = 1800000
      } else if (timeRange <= 3600000) {
        time = 3600000
      } else if (timeRange <= 7200000) {
        time = 7200000
      } else if (timeRange <= 18000000) {
        time = 18000000
      } else if (timeRange <= 36000000) {
        time = 36000000
      } else if (timeRange <= 43200000) {
        time = 43200000
      } else if (timeRange <= 86400000) {
        time = 86400000
      } else if (timeRange <= 604800000) {
        time = 604800000
      } else {
        time = 2592000000
      }
      this.historyForm.timewindowMs = time
      this.historyOptionList = this.timeOptions[time]
      const interval = this.historyOptionList[0]
      this.historyForm.interval = interval
    },
    submit () {
      const limit = Number(this.limit)
      if ((limit < 10) || (limit > 25000)) return Message.error('最大值在10到25000之间')
      if ((this.selectedTab === '1') && (this.historyForm.historyType === 1)) {
        if (!this.historyForm.time) {
          return Message.error('请选择时间段！')
        }
        const [start, end] = this.historyForm.time
        const startTime = new Date(start).getTime()
        const endTime = new Date(end).getTime()
        if (endTime - startTime > 31 * 24 * 3600 * 1000) {
          return Message.error('时间段请小于一个月！')
        }
      }
      this.timewindow = {
        aggregation: {
          limit,
          type: this.aggregation
        },
        displayValue: '',
        hideAggInterval: false,
        hideAggregation: false,
        hideInterval: false,
        history: {
          fixedTimewindow: {
            startTimeMs: this.historyForm.time ? this.historyForm.time[0].getTime() : new Date().getTime(),
            endTimeMs: this.historyForm.time ? this.historyForm.time[1].getTime() : new Date().getTime()
          },
          historyType: this.historyForm.historyType,
          interval: this.historyForm.interval,
          timewindowMs: Number(this.historyForm.timewindowMs)
        },
        realtime: {
          interval: this.realtimeForm.interval,
          timewindowMs: Number(this.realtimeForm.timewindowMs)
        },
        selectedTab: Number(this.selectedTab)
      }
      this.$emit('submit', this.timewindow)
      this.isShowDialog = false
    },
    timeToLabel (time) {
      const s = time / 1000
      if (s < 60) {
        return `${s}秒`
      } else if (s < 3600) {
        return `${s / 60}分`
      } else if (s < 86400) {
        return `${s / 3600}小时`
      } else {
        return `${s / 86400}天`
      }
    }
  }
}
</script>

<style scoped lang="scss">

</style>
