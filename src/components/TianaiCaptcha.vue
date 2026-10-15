<template>
  <teleport to="body">
    <div v-show="visible" class="tac-mask">
      <div :id="boxId" class="tac-box"></div>
    </div>
  </teleport>
</template>

<script setup>
// tianai-captcha 行为验证码弹窗
// 用法：调用 show() 弹出验证码，验证通过后触发 success 事件，参数为验证码凭证（登录/注册时作为 uuid 提交）
import { ref, nextTick, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { BASE_API } from '@/config'

const emit = defineEmits(['success', 'close'])

const baseApi = BASE_API
// SDK 静态资源位于 public/tac 目录
const assetBase = import.meta.env.BASE_URL + 'tac'
const boxId = 'tac-box-' + Math.random().toString(36).slice(2, 10)
const visible = ref(false)
let tac = null

// 按需加载 SDK（全局只加载一次）
let assetsPromise = null
function loadAssets() {
  if (window.TAC) {
    return Promise.resolve()
  }
  if (!assetsPromise) {
    assetsPromise = new Promise((resolve, reject) => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = assetBase + '/css/tac.css'
      document.head.appendChild(link)
      const script = document.createElement('script')
      script.src = assetBase + '/js/tac.min.js'
      script.onload = () => resolve()
      script.onerror = () => {
        assetsPromise = null
        script.remove()
        reject(new Error('验证码组件加载失败'))
      }
      document.head.appendChild(script)
    })
  }
  return assetsPromise
}

function destroy() {
  if (tac) {
    tac.destroyWindow()
    tac = null
  }
}

async function show() {
  if (visible.value) {
    return
  }
  try {
    await loadAssets()
  } catch (e) {
    ElMessage.error(e.message)
    emit('close')
    return
  }
  visible.value = true
  await nextTick()
  destroy()
  tac = new window.TAC({
    requestCaptchaDataUrl: baseApi + '/captcha/gen',
    validCaptchaUrl: baseApi + '/captcha/check',
    bindEl: '#' + boxId,
    validSuccess: (res) => {
      destroy()
      visible.value = false
      emit('success', res.data.id)
    },
    btnCloseFun: () => close()
  }, {
    // 隐藏 SDK 默认 logo
    logoUrl: null
  }).init()
}

function close() {
  destroy()
  if (visible.value) {
    visible.value = false
    emit('close')
  }
}

onBeforeUnmount(() => destroy())

defineExpose({ show, close })
</script>

<style lang="scss" scoped>
.tac-mask {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
}
.tac-box {
  background: #fff;
  border-radius: 5px;
}
</style>
