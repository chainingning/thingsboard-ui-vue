/**
 * 资产
 */

import { request } from '@/utils/request'

export default {
  getAssetInfos: params => request({ url: '/api/tenant/assetInfos', params, isLoop: true }),
  getCustomerAssetInfos: (params, id) => request({ url: `/api/customer/${id}/assetInfos`, params }),
  getAssetTypes: _ => request({ url: '/api/asset/types' }),
  getItemAssetInfo: assetId => request({ url: `/api/asset/info/${assetId}` }),
  getOneAssetInfo: assetId => request({ url: `/api/asset/${assetId}` }),
  getAssets: params => request({ url: '/api/assets', params, isLoop: true }),
  getTenantAssets: params => request({ url: '/api/tenant/assets', params }),
  postAsset: params => request({ url: '/api/asset', method: 'post', params }),
  postPublicAsset: id => request({ url: `/api/customer/public/asset/${id}`, method: 'post' }),
  postPluginsTelemetry: (module, id, params, scope) => request({ url: `/api/plugins/telemetry/${module}/${id}/${scope}`, method: 'post', params }),
  postPluginsTelemetryTimeseries: (module, id, params) => request({ url: `/api/plugins/telemetry/${module}/${id}/timeseries/time`, method: 'post', params }),
  deleteAsset: id => request({ url: `/api/asset/${id}`, method: 'delete' }),
  deletePluginsTelemetry: (module, id, params, scope) => request({ url: `/api/plugins/telemetry/${module}/${id}/${scope}`, method: 'delete', params })
}
