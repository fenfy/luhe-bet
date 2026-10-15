import request from '@/utils/request'

// 登录：rememberMe 为 true 时令牌有效期 7 天（后端 token.rememberExpireTime）
export function login(data) {
  return request({ url: '/login', method: 'post', headers: { isToken: false }, data })
}

// 当前用户信息（含权限）
export function getInfo() {
  return request({ url: '/getInfo', method: 'get' })
}

export function logout() {
  return request({ url: '/logout', method: 'post' })
}

// 验证码开关
export function getCaptchaEnabled() {
  return request({ url: '/captcha/enabled', method: 'get', headers: { isToken: false } })
}
