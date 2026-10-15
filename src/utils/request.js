import axios from 'axios'
import { ElMessage } from 'element-plus'
import { getToken, removeToken } from '@/utils/auth'

const errorCode = {
  401: '登录状态已过期，请重新登录',
  403: '当前账号没有权限',
  404: '访问资源不存在',
  default: '系统未知错误，请反馈给管理员'
}

const service = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json;charset=utf-8' }
})

service.interceptors.request.use(config => {
  const token = getToken()
  if (token && (config.headers || {}).isToken !== false) {
    config.headers.Authorization = 'Bearer ' + token
  }
  return config
})

service.interceptors.response.use(
  res => {
    const code = res.data.code || 200
    const msg = res.data.msg || errorCode[code] || errorCode.default
    if (code === 401) {
      removeToken()
      // 交给路由守卫回到登录页
      if (!location.hash.startsWith('#/login')) {
        ElMessage.warning(errorCode[401])
        location.hash = '#/login'
      }
      return Promise.reject(new Error(errorCode[401]))
    }
    if (code !== 200) {
      ElMessage.error(code === 403 ? errorCode[403] : msg)
      return Promise.reject(new Error(msg))
    }
    return res.data
  },
  error => {
    let { message } = error
    if (message === 'Network Error') {
      message = '后端接口连接异常'
    } else if (message.includes('timeout')) {
      message = '系统接口请求超时'
    } else if (message.includes('Request failed with status code')) {
      message = '系统接口' + message.slice(-3) + '异常'
    }
    ElMessage.error(message)
    return Promise.reject(error)
  }
)

export default service
