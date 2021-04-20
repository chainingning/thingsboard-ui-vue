/**
 * 部件库
 */

import { request } from '@/utils/request'

export default {
  getWidgetsBundlesList: params => request({ url: '/api/widgetsBundles', params }),
  getWidgetsBundleInfos: id => request({ url: `/api/widgetsBundle/${id}` }),
  getWidgetTypes: params => request({ url: '/api/widgetTypes', params, isLoop: true }),
  getWidgetTypeInfo: params => request({ url: '/api/widgetType', params }),
  getWidgetType: id => request({ url: `/api/widgetType/${id}` }),
  postWidgetsBundle: params => request({ url: '/api/widgetsBundle', method: 'post', params }),
  postWidgetType: params => request({ url: '/api/widgetType', method: 'post', params, isLoop: true }),
  deleteWidgetsBundle: id => request({ url: `/api/widgetsBundle/${id}`, method: 'delete' }),
  deleteWidgetType: id => request({ url: `/api/widgetType/${id}`, method: 'delete' })
}
