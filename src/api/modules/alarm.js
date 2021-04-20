/**
 * 告警
 */

import { request } from '@/utils/request'

export default {
  getAlarmInfo: alarmId => request({ url: `/api/alarm/info/${alarmId}` }),
  postAlarmAck: alarmId => request({ url: `/api/alarm/${alarmId}/ack`, method: 'post', isLoop: true }),
  postAlarmClear: alarmId => request({ url: `/api/alarm/${alarmId}/clear`, method: 'post', isLoop: true })
}
