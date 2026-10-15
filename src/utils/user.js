import { reactive } from 'vue'
import { getInfo } from '@/api/login'
import { getToken, removeToken } from '@/utils/auth'

// 当前登录用户（全局唯一，页面很少，不引入 pinia）
export const user = reactive({ loaded: false, userName: '', nickName: '', permissions: [] })

/** 有令牌时拉取用户信息；令牌失效返回 false */
export async function loadUser() {
  if (!getToken()) return false
  if (user.loaded) return true
  try {
    const res = await getInfo()
    user.userName = res.user.userName
    user.nickName = res.user.nickName || res.user.userName
    user.permissions = res.permissions || []
    user.loaded = true
    return true
  } catch (e) {
    removeToken()
    return false
  }
}

export function clearUser() {
  removeToken()
  Object.assign(user, { loaded: false, userName: '', nickName: '', permissions: [] })
}

export function hasPermi(perm) {
  return user.permissions.includes('*:*:*') || user.permissions.includes(perm)
}
