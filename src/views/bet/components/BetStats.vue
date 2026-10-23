<template>
  <section class="panel" v-loading="loading">
    <div class="panel-head">
      <h2>第 {{ issueNo }} 期投注统计</h2>
      <el-tag v-if="stats.drawn" type="warning" size="small">已开奖</el-tag>
      <el-tag v-else type="success" size="small">未开奖</el-tag>
      <span class="spacer" />
      <el-button link type="primary" :icon="Refresh" @click="emit('refresh')">刷新</el-button>
    </div>

    <div class="totals">
      <div class="total">
        <span class="label">总笔数</span>
        <span class="value">{{ stats.betCount || 0 }}</span>
      </div>
      <div class="total">
        <span class="label">总金额（元）</span>
        <span class="value">{{ formatMoney(stats.totalAmount || 0) }}</span>
      </div>
    </div>

    <!--生肖统计
    <h3>生肖 <small>按投注项汇总</small></h3>
    <div class="zodiac-grid">
      <div v-for="z in stats.zodiacs" :key="z.name" class="cell" :class="{ hot: hotZodiacs.has(z.name), empty: !z.count }">
        <span class="name">{{ z.name }}</span>
        <span class="count">{{ z.count }} 笔</span>
        <span class="amount">{{ formatMoney(z.amount) }}</span>
      </div>
    </div>
    -->

    <h3>号码 <small>含生肖、色波投注按每号金额摊入，按金额从高到低排列</small></h3>
    <div class="number-grid">
      <div
        v-for="n in sortedNumbers"
        :key="n.number"
        class="cell number"
        :class="{ hot: hotNumbers.has(n.number), empty: !n.count }"
        :title="n.zodiac + ' · ' + n.wave"
      >
        <lottery-ball :number="n.number" :wave="n.wave" size="small" />
        <span class="meta">
          <span class="count"><i class="zodiac">{{ n.zodiac }}</i> <b>{{n.count }}</b> 笔</span>
          <template v-if="n.amount > 0">
            <span class="amount lose">-{{ formatMoney(n.amount * 47.5) }}</span>
          </template>
          <span v-else class="amount">+{{ formatMoney(stats.totalAmount || 0) }}</span>
        </span>
      </div>
    </div>
    <!--色波统计
    <h3>色波 <small>按投注项汇总</small></h3>
    <div class="wave-grid">
      <div v-for="w in stats.waves" :key="w.name" class="cell wave" :class="[waveClass(w.name), { empty: !w.count }]">
        <span class="name">{{ w.name }}</span>
        <span class="count">{{ w.count }} 笔</span>
        <span class="amount">{{ formatMoney(w.amount * 2.7) }}</span>
      </div>
    </div>
    -->
    <p class="legend"><span class="dot" />金额最大的前 3 项高亮显示</p>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import LotteryBall from '@/components/LotteryBall.vue'
import { formatMoney, topKeys } from '@/utils/bet'

const props = defineProps({
  stats: { type: Object, required: true },
  issueNo: { type: String, default: '' },
  loading: { type: Boolean, default: false }
})
const emit = defineEmits(['refresh'])

const hotZodiacs = computed(() => topKeys(props.stats.zodiacs || [], 'name'))
const hotNumbers = computed(() => topKeys(props.stats.numbers || [], 'number'))
// 号码按投注金额从低到高排列，金额相同按号码从小到大
const sortedNumbers = computed(() =>
  [...(props.stats.numbers || [])].sort((a, b) => Number(a.amount) - Number(b.amount) || a.number.localeCompare(b.number))
)

function waveClass(name) {
  if (name.includes('红')) return 'red'
  if (name.includes('蓝')) return 'blue'
  return 'green'
}
</script>

<style lang="scss" scoped>
.panel {
  background: var(--bet-card);
  border: 1px solid var(--bet-border);
  border-radius: 8px;
  padding: 18px 20px 12px;
}
.panel-head {
  display: flex;
  align-items: center;
  gap: 10px;
  h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
  }
}
.spacer {
  flex: 1;
}
.totals {
  display: flex;
  gap: 12px;
  margin: 14px 0 6px;
}
.total {
  display: flex;
  flex-direction: column;
  min-width: 160px;
  padding: 10px 16px;
  border-radius: 6px;
  background: #f7f8fa;
  .label {
    font-size: 12px;
    color: var(--bet-muted);
  }
  .value {
    font-size: 22px;
    font-weight: 600;
    margin-top: 2px;
  }
}
h3 {
  margin: 18px 0 8px;
  font-size: 14px;
  font-weight: 600;
  small {
    margin-left: 6px;
    font-weight: normal;
    font-size: 12px;
    color: var(--bet-muted);
  }
}
.cell {
  border: 1px solid var(--bet-border);
  border-radius: 6px;
  background: #fff;
  transition: background 0.15s;
  .count {
    font-size: 12px;
    color: var(--bet-muted);
    .zodiac {
      font-size: 12px;
      color: var(--bet-accent);
    }
   }
  .amount {
    font-weight: 600;
  }
  &.empty .amount {
    color: #c0c4cc;
    font-weight: normal;
  }
  &.hot {
    border-color: var(--bet-accent);
    background: #fdf1ef;
    .amount {
      color: var(--bet-accent);
    }
  }
}
.zodiac-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 8px;
  .cell {
    display: grid;
    grid-template-columns: auto 1fr;
    grid-template-rows: auto auto;
    column-gap: 10px;
    padding: 8px 12px;
    .name {
      grid-row: span 2;
      align-self: center;
      font-size: 20px;
    }
    .count,
    .amount {
      text-align: right;
    }
  }
}
.number-grid {
  display: grid;
  /* 按金额排序后不再固定 7 列：按宽度自动排列，每格至少放得下金额 */
  grid-template-columns: repeat(auto-fill, minmax(108px, 1fr));
  gap: 6px;
  .number {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 6px 4px 2px;
  }
  .meta {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    line-height: 1.3;
    .count,
    .amount {
      max-width: 100%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .amount {
      font-size: 12px;
      letter-spacing: -0.2px;
      color: #2f9e44;
      font-weight: 600;
      &.lose {
        color: var(--bet-accent);
      }
    }
  }
}
.wave-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  .wave {
    display: flex;
    align-items: baseline;
    gap: 12px;
    padding: 10px 14px;
    border-left-width: 4px;
    .name {
      font-size: 15px;
      font-weight: 600;
    }
    .amount {
      margin-left: auto;
      font-size: 16px;
    }
    &.red {
      border-left-color: #e5484d;
    }
    &.blue {
      border-left-color: #3e7bfa;
    }
    &.green {
      border-left-color: #2f9e44;
    }
  }
}
.legend {
  margin: 12px 0 0;
  font-size: 12px;
  color: var(--bet-muted);
  .dot {
    display: inline-block;
    width: 10px;
    height: 10px;
    margin-right: 6px;
    border: 1px solid var(--bet-accent);
    background: #fdf1ef;
    border-radius: 2px;
    vertical-align: -1px;
  }
}
</style>
