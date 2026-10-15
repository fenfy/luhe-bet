<template>
  <div class="login-page">
    <el-form ref="loginRef" :model="form" :rules="rules" class="login-card" @keyup.enter="handleLogin">
      <h1 class="title">{{ title }}</h1>
      <p class="sub">使用后台账号登录</p>
      <el-form-item prop="username">
        <el-input v-model="form.username" size="large" placeholder="账号" :prefix-icon="User" autocomplete="username" />
      </el-form-item>
      <el-form-item prop="password">
        <el-input v-model="form.password" type="password" size="large" placeholder="密码" :prefix-icon="Lock" show-password autocomplete="current-password" />
      </el-form-item>
      <div class="row">
        <el-checkbox v-model="form.rememberMe">自动登录</el-checkbox>
        <span class="hint">7 天内打开无需再登录</span>
      </div>
      <el-button type="primary" size="large" class="submit" :loading="loading" @click="handleLogin">
        {{ loading ? '登 录 中...' : '登 录' }}
      </el-button>
    </el-form>
    <tianai-captcha ref="captchaRef" @success="doLogin" @close="loading = false" />
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { User, Lock } from '@element-plus/icons-vue'
import TianaiCaptcha from '@/components/TianaiCaptcha.vue'
import { login, getCaptchaEnabled } from '@/api/login'
import { setToken } from '@/utils/auth'
import { loadUser } from '@/utils/user'

const LAST_USER_KEY = 'Luhe-Bet-Username'

const route = useRoute()
const router = useRouter()
const title = import.meta.env.VITE_APP_TITLE
const loginRef = ref()
const captchaRef = ref()
const loading = ref(false)

function lastUsername() {
  try {
    return localStorage.getItem(LAST_USER_KEY) || ''
  } catch (e) {
    return ''
  }
}

const form = reactive({ username: lastUsername(), password: '', rememberMe: true })
const rules = {
  username: [{ required: true, trigger: 'blur', message: '请输入账号' }],
  password: [{ required: true, trigger: 'blur', message: '请输入密码' }]
}

function handleLogin() {
  loginRef.value.validate(async valid => {
    if (!valid || loading.value) return
    loading.value = true
    let captchaEnabled = true
    try {
      const res = await getCaptchaEnabled()
      captchaEnabled = res.captchaEnabled !== false
    } catch (e) {
      loading.value = false
      return
    }
    if (captchaEnabled) {
      // 滑块通过后由 success 事件带着凭证调用 doLogin
      captchaRef.value.show()
    } else {
      doLogin()
    }
  })
}

async function doLogin(uuid) {
  loading.value = true
  try {
    const res = await login({ username: form.username.trim(), password: form.password, uuid, rememberMe: form.rememberMe })
    setToken(res.token, form.rememberMe)
    try {
      localStorage.setItem(LAST_USER_KEY, form.username.trim())
    } catch (e) {
      // 浏览器禁用存储时忽略
    }
    await loadUser()
    router.replace(route.query.redirect || '/')
  } catch (e) {
    form.password = ''
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background:
    radial-gradient(circle at 15% 20%, rgba(192, 57, 43, 0.08), transparent 40%),
    radial-gradient(circle at 85% 80%, rgba(62, 123, 250, 0.08), transparent 40%),
    var(--bet-bg);
}
.login-card {
  width: 380px;
  max-width: 100%;
  padding: 36px 32px 28px;
  background: var(--bet-card);
  border: 1px solid var(--bet-border);
  border-radius: 10px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.06);
}
.title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  text-align: center;
  letter-spacing: 2px;
}
.sub {
  margin: 6px 0 24px;
  text-align: center;
  font-size: 13px;
  color: var(--bet-muted);
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: -4px 0 18px;
}
.hint {
  font-size: 12px;
  color: var(--bet-muted);
}
.submit {
  width: 100%;
}
</style>
