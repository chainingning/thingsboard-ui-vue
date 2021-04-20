/**
 * 应用库
 */

import { request } from '@/utils/request'

export default {
  getDashboardsList: params => request({ url: '/api/tenant/dashboards', params }),
  getDashboardInfos: id => request({ url: `/api/dashboard/${id}` }),
  getDashboardInfo: id => request({ url: `/api/dashboard/info/${id}` }),
  getPluginsTelemetry: (type, id) => request({ url: `/api/plugins/telemetry/${type}/${id}/keys/timeseries` }),
  postDashboard: params => request({ url: '/api/dashboard', method: 'post', params }),
  postDashboardCustomers: (id, params) => request({ url: `/api/dashboard/${id}/customers`, method: 'post', params }),
  postPublicDashboard: id => request({ url: `/api/customer/public/dashboard/${id}`, method: 'post' }),
  deletePublicDashboard: id => request({ url: `/api/customer/public/dashboard/${id}`, method: 'delete' }),
  deleteDashboard: id => request({ url: `/api/dashboard/${id}`, method: 'delete' }),
  postRpcOneway: (id, params) => request({ url: `/api/plugins/rpc/oneway/${id}`, method: 'post', params }),
  getRpcTwoway: (id, params, isLoop) => request({ url: `/api/plugins/rpc/twoway/${id}`, method: 'post', params, isLoop: (isLoop || false) })
}
