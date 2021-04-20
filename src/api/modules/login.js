/**
 * 登录
*/
import { request } from '@/utils/request'

export default {
  login: params => request({ url: '/api/auth/login', method: 'post', params, isToken: false }),
  logout: _ => request({ url: '/api/auth/logout', method: 'post' }),
  loginPublic: params => request({ url: '/api/auth/login/public', method: 'post', params, isToken: false }),
  getToken: userId => request({ url: `/api/user/${userId}/token` }),
  postRefreshToken: params => request({ url: '/api/auth/token', method: 'post', params, isLoop: true }),
  postActivate: params => request({ url: '/api/noauth/activate', method: 'post', params }),
  postResetPassword: params => request({ url: '/api/noauth/resetPassword', method: 'post', params, isToken: false }),
  postResetPasswordByEmail: params => request({ url: '/api/noauth/resetPasswordByEmail', method: 'post', params, isToken: false }),
  postResetCertKey: params => request({ url: '/api/noauth/resetCertKey', method: 'post', params, isToken: false })
}
