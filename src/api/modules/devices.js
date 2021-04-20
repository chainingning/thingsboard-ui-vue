/**
 * 设备
 */

import { request } from '@/utils/request'

export default {
  getDeviceInfo: params => request({ url: '/api/tenant/devices', params, isLoop: true }),
  getDeviceInfos: params => request({ url: '/api/tenant/deviceInfos', params }),
  getDeviceTypes: _ => request({ url: '/api/device/types' }),
  getDevices: params => request({ url: '/api/devices', params, isLoop: true }),
  getDeviceCredentials: deviceId => request({ url: `/api/device/${deviceId}/credentials` }),
  getItemDeviceInfo: deviceId => request({ url: `/api/device/info/${deviceId}` }),
  getOneDeviceInfo: deviceId => request({ url: `/api/device/${deviceId}` }),
  getTenantDevices: params => request({ url: '/api/tenant/devices', params }),
  postDeviceCredentials: params => request({ url: '/api/device/credentials', method: 'post', params }),
  postDevice: params => request({ url: '/api/device', method: 'post', params }),
  postDeviceAsset: id => request({ url: `/api/customer/public/device/${id}`, method: 'post' }),
  postAlarmType: (id, alarmType) => request({ url: `/api/alarm/${id}/${alarmType}`, method: 'post' }),
  deleteDevice: id => request({ url: `/api/device/${id}`, method: 'delete' })
}
