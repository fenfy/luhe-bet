import { APP_TITLE } from '@/config'
import { createRouter, createWebHashHistory } from 'vue-router'
import { getToken } from '@/utils/auth'
import { loadUser } from '@/utils/user'

const routes = [
  { path: '/login', name: 'Login', component: () => import('@/views/login/index.vue'), meta: { title: '登录' } },
  { path: '/', name: 'Bet', component: () => import('@/views/bet/index.vue'), meta: { title: '录入统计' } },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  // hash 模式：部署时无需额外配置 nginx 回退
  history: createWebHashHistory(),
  routes
})

router.beforeEach(async to => {
  document.title = to.meta.title + ' - ' + APP_TITLE
  if (to.name === 'Login') {
    // 自动登录：本地令牌仍有效就直接进入
    return getToken() && (await loadUser()) ? { name: 'Bet' } : true
  }
  if (!(await loadUser())) {
    return { name: 'Login', query: to.fullPath !== '/' ? { redirect: to.fullPath } : {} }
  }
  return true
})

export default router
