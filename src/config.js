// 全局配置：优先读取 .env.development / .env.production 中的变量，未配置时使用默认值
export const APP_TITLE = import.meta.env.VITE_APP_TITLE || '录入统计'

// 开发环境经 vite 代理转发到 luhe-admin；生产环境由 nginx 把 /prod-api 反向代理到 luhe-admin
export const BASE_API = import.meta.env.VITE_APP_BASE_API || (import.meta.env.PROD ? '/prod-api' : '/dev-api')
