/**
 * 系统设置
 */

import { request } from '@/utils/request'

export default {
  getAdminSettingsGeneral: _ => request({ url: '/api/admin/settings/general' }),
  getAdminSettingsMail: _ => request({ url: '/api/admin/settings/mail' }),
  getAdminSecuritySettings: _ => request({ url: '/api/admin/securitySettings' }),
  postAdminSettings: params => request({ url: '/api/admin/settings', method: 'post', params }),
  postAdminSettingsTestMail: params => request({ url: '/api/admin/settings/testMail', method: 'post', params }),
  postAdminSecuritySettings: params => request({ url: '/api/admin/securitySettings', method: 'post', params })
}
