/**
 * 实体视图
 */

import { request } from '@/utils/request'

export default {
  getEntityViewList: params => request({ url: '/api/tenant/entityViewInfos', params }),
  getTenantEntityViews: params => request({ url: '/api/tenant/entityViews', params }),
  getEntityViewInfo: id => request({ url: `/api/entityView/info/${id}` }),
  getEntityViewTypes: _ => request({ url: '/api/entityView/types' }),
  getRelationsInfo: params => request({ url: '/api/relations/info', params }),
  getEntityView: entityViewId => request({ url: `/api/entityView/${entityViewId}`, isLoop: true }),
  getAttribute: (module, id, scope) => request({ url: `/api/plugins/telemetry/${module}/${id}/values/attributes/${scope}` }),
  getEvents: (module, id, eventType, params) => request({ url: `/api/events/${module}/${id}/${eventType}`, params }),
  getAlarms: (module, id, params) => request({ url: `/api/alarm/${module}/${id}`, params, isLoop: true }),
  getCustomerEntityView: (params, id) => request({ url: `/api/customer/${id}/entityViews`, params }),
  getTenantDeviceInfos: params => request({ url: '/api/tenant/deviceInfos', params }),
  getPluginsTelemetryKeys: (module, id, attr) => request({ url: `/api/plugins/telemetry/${module}/${id}/keys/${attr}` }),
  postCustomerEntityView: (customerId, entityViewId) => request({ url: `/api/customer/${customerId}/entityView/${entityViewId}`, method: 'post' }),
  postEntityView: params => request({ url: '/api/entityView', method: 'post', params }),
  postCustomerPublicEntityView: entityViewId => request({ url: `/api/customer/public/entityView/${entityViewId}`, method: 'post' }),
  deleteCustomerEntityView: entityViewId => request({ url: `/api/customer/entityView/${entityViewId}`, method: 'delete' }),
  deleteEntityView: entityViewId => request({ url: `/api/entityView/${entityViewId}`, method: 'delete' }),
  postRelation: params => request({ url: '/api/relation', method: 'post', params, isLoop: true }),
  deleteRelation: params => request({ url: '/api/relation', method: 'delete', params, isLoop: true })
}
