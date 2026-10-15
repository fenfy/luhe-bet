// 令牌存储：勾选「自动登录」存 localStorage（关闭浏览器后仍在，后端 7 天滑动续期），否则存 sessionStorage
const TokenKey = 'Luhe-Bet-Token'

function safe(fn, fallback) {
  try {
    return fn()
  } catch (e) {
    return fallback
  }
}

export function getToken() {
  return safe(() => localStorage.getItem(TokenKey) || sessionStorage.getItem(TokenKey), null)
}

export function setToken(token, remember) {
  removeToken()
  safe(() => (remember ? localStorage : sessionStorage).setItem(TokenKey, token))
}

export function removeToken() {
  safe(() => localStorage.removeItem(TokenKey))
  safe(() => sessionStorage.removeItem(TokenKey))
}
