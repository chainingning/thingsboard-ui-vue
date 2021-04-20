export const getToken = tokenKey => window.sessionStorage.getItem(tokenKey)
export const setToken = (token, refreshToken) => {
  window.sessionStorage.setItem('token', token)
  window.sessionStorage.setItem('refreshToken', refreshToken)
}
export const removeToken = () => {
  window.sessionStorage.removeItem('token')
  window.sessionStorage.removeItem('refreshToken')
}
