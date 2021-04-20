/**
 * 审计日志
*/
import { request } from '@/utils/request'

export default {
  getAuditLogsList: params => request({ url: '/api/audit/logs', params }),
  getEntityViewLogs: (params, module, id) => request({ url: `/api/audit/logs/entity/${module}/${id}`, params }),
  getAuditLog: (params, module, id) => request({ url: `/api/audit/logs/${module}/${id}`, params }),
  getAuditLogsEntityDashboardList: (params, id) => request({ url: `/api/audit/logs/entity/DASHBOARD/${id}`, params })
}
