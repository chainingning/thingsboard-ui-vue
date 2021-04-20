/**
 * 固件管理
 */

import { request } from '@/utils/request'

export default {
  getOtas: params => request({ url: '/api/otas', params }),
  postOta: params => request({ url: '/api/ota', method: 'post', params, headers: { 'Conent-Type': 'multipart/form-data' } }),
  putOta: params => request({ url: '/api/ota/update', method: 'put', params }),
  deleteOta: id => request({ url: `/api/ota/${id}`, method: 'delete' })
}
