<template>
  <div class="layout">
    <header class="topbar">
      <span class="brand">{{ title }}</span>
      <span class="spacer" />
      <el-dropdown trigger="click" @command="onCommand">
        <span class="user">
          <el-icon><UserFilled /></el-icon>
          {{ user.nickName }}
          <el-icon><ArrowDown /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="logout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </header>

    <main class="content">
      <el-alert v-if="!canAdd" type="error" :closable="false" show-icon class="mb16" title="当前账号没有「投注新增」权限，请联系管理员分配「录入员」角色" />
      <bet-form
        v-if="canAdd"
        v-model:issue-date="issueDate"
        :issue-no="issueNo"
        :options="options"
        :drawn="!!stats.drawn"
        @changed="loadStats"
      />
      <bet-stats :stats="stats" :issue-no="issueNo" :loading="statsLoading" class="mt16" @refresh="loadStats" />
    </main>
  </div>
</template>

<script setup>
import { APP_TITLE } from '@/config'
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { UserFilled, ArrowDown } from '@element-plus/icons-vue'
import BetForm from './components/BetForm.vue'
import BetStats from './components/BetStats.vue'
import { getLotteryOptions, getIssueStats } from '@/api/bet'
import { logout } from '@/api/login'
import { issueOf, todayDate } from '@/utils/lotteryIssue'
import { user, clearUser, hasPermi } from '@/utils/user'

const router = useRouter()
const title = APP_TITLE

const issueDate = ref(todayDate())
const issueNo = computed(() => issueOf(issueDate.value))
const options = ref({ zodiacs: [], numbers: [], waves: [] })
const stats = ref({})
const statsLoading = ref(false)
const canAdd = computed(() => hasPermi('lottery:bet:add'))

// 并发切换日期时只采用最后一次请求的结果
let statsSeq = 0
async function loadStats() {
  const seq = ++statsSeq
  statsLoading.value = true
  try {
    const res = await getIssueStats(issueDate.value)
    if (seq === statsSeq) stats.value = res.data
  } catch (e) {
    if (seq === statsSeq) stats.value = {}
  } finally {
    if (seq === statsSeq) statsLoading.value = false
  }
}

watch(issueDate, loadStats)

function onCommand(cmd) {
  if (cmd !== 'logout') return
  ElMessageBox.confirm('确定退出登录吗？退出后下次打开需要重新登录。', '提示', { type: 'warning' })
    .then(async () => {
      try {
        await logout()
      } finally {
        clearUser()
        router.replace('/login')
      }
    })
    .catch(() => {})
}

onMounted(async () => {
  try {
    const res = await getLotteryOptions()
    options.value = res.data
  } finally {
    loadStats()
  }
})
</script>

<style lang="scss" scoped>
.layout {
  min-height: 100vh;
}
.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  height: 52px;
  padding: 0 24px;
  background: #1f2329;
  color: #fff;
}
.brand {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 1px;
}
.spacer {
  flex: 1;
}
.user {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #e5e6eb;
  cursor: pointer;
  outline: none;
}
.content {
  max-width: 1280px;
  margin: 0 auto;
  padding: 16px 24px 32px;
}
.mt16 {
  margin-top: 16px;
}
.mb16 {
  margin-bottom: 16px;
}
</style>
