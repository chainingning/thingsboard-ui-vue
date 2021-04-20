/**
 * 客户
*/
import { request } from '@/utils/request'

export default {
  getToken: id => request({ url: `/api/user/${id}/token` }),
  getUser: _ => request({ url: '/api/auth/user' }),
  getUserInfo: id => request({ url: `/api/user/${id}` }),
  getCustomersList: params => request({ url: '/api/customers', params }),
  getOneUserList: (params, userType) => request({ url: `/api/${userType}`, params }),
  getCustomersInfo: id => request({ url: `/api/customer/${id}`, isLoop: true }),
  getOneUserInfo: (id, userType) => request({ url: `/api/${userType}/${id}` }),
  getCustomersUserList: (params, id) => request({ url: `/api/customer/${id}/users`, params }),
  getOneUsersList: (params, id, userType) => request({ url: `/api/${userType}/${id}/users`, params }),
  getCustomerAssetList: (params, id) => request({ url: `/api/customer/${id}/assets`, params, isLoop: true }),
  getCustomerDeviceList: (params, id) => request({ url: `/api/customer/${id}/devices`, params, isLoop: true }),
  getCustomerDeviceLists: (params, id) => request({ url: `/api/customer/${id}/deviceInfos`, params }),
  getCustomerDashboardList: (params, id) => request({ url: `/api/customer/${id}/dashboards`, params }),
  getTenantInfos: id => request({ url: `/api/tenant/${id}` }),
  getUserActivationLink: id => request({ url: `/api/user/${id}/activationLink` }),
  updateCustomer: params => request({ url: '/api/customer', method: 'post', params }),
  updateOneUser: (params, userType) => request({ url: `/api/${userType}`, method: 'post', params }),
  postUserSendActivationMail: (params, sendActivationMail) => request({ url: `/api/user?sendActivationMail=${sendActivationMail}`, method: 'post', params }),
  postSendActivationMail: email => request({ url: `/api/user/sendActivationMail?email=${email}`, method: 'post' }),
  postUserCredentialsEnabled: (id, userCredentialsEnabled) => request({ url: `/api/user/${id}/userCredentialsEnabled?userCredentialsEnabled=${userCredentialsEnabled}`, method: 'post' }),
  postCustomerAsset: (userId, assetId) => request({ url: `/api/customer/${userId}/asset/${assetId}`, method: 'post' }),
  postCustomerDevice: (userId, deviceId) => request({ url: `/api/customer/${userId}/device/${deviceId}`, method: 'post' }),
  postCustomerDashboard: (userId, dashboardId) => request({ url: `/api/customer/${userId}/dashboard/${dashboardId}`, method: 'post' }),
  deleteCustomer: id => request({ url: `/api/customer/${id}`, method: 'delete' }),
  deleteOneUser: (id, userType) => request({ url: `/api/${userType}/${id}`, method: 'delete' }),
  deleteUser: id => request({ url: `/api/user/${id}`, method: 'delete' }),
  deleteCustomerAsset: id => request({ url: `/api/customer/asset/${id}`, method: 'delete' }),
  deleteCustomerDevice: id => request({ url: `/api/customer/device/${id}`, method: 'delete' }),
  deleteCustomerDashboard: (userId, dashboardId) => request({ url: `/api/customer/${userId}/dashboard/${dashboardId}`, method: 'delete' })
}
