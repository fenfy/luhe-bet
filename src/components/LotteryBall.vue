<template>
  <!-- 有 label（如生肖）时显示在球的正下方 -->
  <span v-if="label" class="ball-wrap" :class="{ clickable }" :title="title">
    <span class="lottery-ball" :class="[colorClass, size, { selected, clickable }]">{{ number }}</span>
    <span class="ball-label" :class="[size, { selected }]">{{ label }}</span>
  </span>
  <span v-else class="lottery-ball" :class="[colorClass, size, { selected, clickable }]" :title="title">{{ number }}</span>
</template>

<script setup>
import { computed } from "vue"

const props = defineProps({
  number: { type: String, required: true },
  // 色波名，如 红波/蓝波/绿波
  wave: { type: String, default: '' },
  // small / default / large
  size: { type: String, default: 'default' },
  title: { type: String, default: '' },
  selected: { type: Boolean, default: false },
  // 球下方的小字，如生肖
  label: { type: String, default: '' },
  clickable: { type: Boolean, default: false }
})

const colorClass = computed(() => {
  if (props.wave.includes('红')) return 'red'
  if (props.wave.includes('蓝')) return 'blue'
  if (props.wave.includes('绿')) return 'green'
  return 'gray'
})
</script>

<style scoped>
.lottery-ball {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin: 2px;
  border-radius: 50%;
  border: 2px solid currentColor;
  background: #fff;
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  user-select: none;
  box-sizing: border-box;
}
.lottery-ball.small {
  width: 22px;
  height: 22px;
  font-size: 11px;
  border-width: 1px;
}
.lottery-ball.large {
  width: 34px;
  height: 34px;
  font-size: 15px;
}
.lottery-ball.red { color: #e5484d; }
.lottery-ball.blue { color: #3e7bfa; }
.lottery-ball.green { color: #2f9e44; }
.lottery-ball.gray { color: #909399; }
.lottery-ball.clickable { cursor: pointer; }
.ball-wrap {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  margin: 2px;
  vertical-align: top;
}
.ball-wrap .lottery-ball { margin: 0; }
.ball-wrap.clickable { cursor: pointer; }
.ball-label {
  margin-top: 1px;
  font-size: 12px;
  line-height: 14px;
  color: #606266;
  user-select: none;
}
.ball-label.small { font-size: 11px; line-height: 13px; }
.ball-label.selected { color: #303133; font-weight: 600; }
.lottery-ball.clickable:hover { box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.08); }
.lottery-ball.selected.red { background: #e5484d; color: #fff; border-color: #e5484d; }
.lottery-ball.selected.blue { background: #3e7bfa; color: #fff; border-color: #3e7bfa; }
.lottery-ball.selected.green { background: #2f9e44; color: #fff; border-color: #2f9e44; }
.lottery-ball.selected.gray { background: #909399; color: #fff; border-color: #909399; }
</style>
