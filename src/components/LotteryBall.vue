<template>
  <span class="lottery-ball" :class="[colorClass, size, { selected, clickable }]" :title="title">{{ number }}</span>
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
.lottery-ball.clickable:hover { box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.08); }
.lottery-ball.selected.red { background: #e5484d; color: #fff; border-color: #e5484d; }
.lottery-ball.selected.blue { background: #3e7bfa; color: #fff; border-color: #3e7bfa; }
.lottery-ball.selected.green { background: #2f9e44; color: #fff; border-color: #2f9e44; }
.lottery-ball.selected.gray { background: #909399; color: #fff; border-color: #909399; }
</style>
