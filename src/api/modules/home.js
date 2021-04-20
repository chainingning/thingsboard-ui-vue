/**
 * 首页
*/
import { request } from '@/utils/request'

export default {
  getStateDeviceOnline: params => request({ url: '/api/state/all/devices/online', params }),
  getOnlineDevice: params => request({ url: '/api/state/devices/online', params }),
  getStateDeviceTotal: params => request({ url: '/api/state/all/devices/total', params }),
  getDeviceTotal: params => request({ url: '/api/state/devices/total', params }),
  getStateDeviceActive: params => request({ url: '/api/state/devices/active', params }),
  getStateDeviceType: params => request({ url: '/api/state/all/devices/type', params }),
  getStateAreas: _ => request({ url: '/api/state/all/areas' }),
  getStateDevicesArea: _ => request({ url: '/api/state/all/devices/area' }),
  getStateSystems: _ => request({ url: '/api/state/all/systems' }),
  getStateCallSystems: params => request({ url: '/api/state/all/call/systems', params, isLoop: true }),
  getStateDeviceAdded: params => request({ url: '/api/state/all/devices/added', params }),
  getStateAlarms: params => request({ url: '/api/state/all/alarms', params }),
  getStateNetwork: _ => request({ url: '/api/state/all/devices/network' }),
  getAlarm: params => request({ url: '/api/alarms', params, isLoop: true }),
  getStateRate: params => request({ url: '/api/state/all/rate', params })
}
