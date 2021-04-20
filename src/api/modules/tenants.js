/**
 * 租户
*/
import { request } from '@/utils/request'

export default {
  getTenantsList: params => request({ url: '/api/tenants', params }),
  getTenantsInfo: id => request({ url: `/api/tenant/${id}` }),
  postTenants: params => request({ url: '/api/tenant', method: 'post', params }),
  deleteTenants: id => request({ url: `/api/tenant/${id}`, method: 'delete' })
}
