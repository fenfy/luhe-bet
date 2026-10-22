<template>
  <el-dialog
    :model-value="modelValue"
    :title="`第 ${issueNo} 期投注记录`"
    width="1100px"
    top="6vh"
    append-to-body
    @update:model-value="v => emit('update:modelValue', v)"
    @open="onOpen"
    @closed="stopTimer"
  >
    <div class="toolbar">
      <el-radio-group v-model="query.betType" size="small" @change="reload">
        <el-radio-button value="">全部</el-radio-button>
        <el-radio-button v-for="t in BET_TYPES" :key="t.value" :value="t.value">{{ t.label }}</el-radio-button>
      </el-radio-group>
      <span class="summary">共 {{ total }} 笔</span>
      <el-tag v-if="drawn" type="warning" size="small">已开奖，记录已锁定</el-tag>
      <span class="spacer" />
      <span v-if="updatedAt" class="updated">更新于 {{ updatedAt }}</span>
      <el-select v-model="autoRefresh" size="small" class="auto-refresh" @change="onIntervalChange">
        <template #prefix>自动刷新</template>
        <el-option v-for="o in REFRESH_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
      </el-select>
      <el-button size="small" :icon="Refresh" @click="getList()">刷新</el-button>
    </div>

    <el-table v-loading="loading" :data="rows" size="small" max-height="62vh" empty-text="本期暂无投注">
      <el-table-column label="投注方式" align="center" width="84">
        <template #default="{ row }">
          <el-tag :type="betTypeTag(row.betType)" size="small">{{ betTypeLabel(row.betType) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="投注项" align="center" width="80">
        <template #default="{ row }">
          <lottery-ball v-if="row.betType === '2'" :number="row.betItem" :wave="waveOf(row.betItem)" :label="zodiacOf(row.betItem)" />
          <span v-else class="item-text">{{ row.betItem }}</span>
        </template>
      </el-table-column>
      <el-table-column label="号码" min-width="240">
        <template #default="{ row }">
          <template v-if="row.betType !== '2' && row.numbers">
            <lottery-ball v-for="n in row.numbers.split(',')" :key="n" :number="n" :wave="waveOf(n)" :label="row.betType === '3' ? zodiacOf(n) : ''" size="small" />
          </template>
        </template>
      </el-table-column>
      <el-table-column label="金额" align="right" width="90">
        <template #default="{ row }">{{ formatMoney(row.amount) }}</template>
      </el-table-column>
      <el-table-column label="每号金额" align="right" width="90">
        <template #default="{ row }">{{ formatMoney(row.perAmount) }}</template>
      </el-table-column>
      <el-table-column label="备注" prop="remark" min-width="100" show-overflow-tooltip />
      <el-table-column label="录入人" prop="createBy" align="center" width="90" />
      <el-table-column label="录入时间" align="center" width="90">
        <template #default="{ row }">{{ timeOf(row.createTime) }}</template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="120">
        <template #default="{ row }">
          <el-tag v-if="row.drawn" type="info" size="small">已开奖</el-tag>
          <template v-else>
            <el-button v-if="canEdit" link type="primary" size="small" @click="openEdit(row)">修改</el-button>
            <el-button v-if="canRemove" link type="danger" size="small" @click="remove(row)">删除</el-button>
            <span v-if="!canEdit && !canRemove" class="muted">—</span>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager">
      <el-pagination
        v-model:current-page="query.pageNum"
        v-model:page-size="query.pageSize"
        :total="total"
        :page-sizes="[20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        small
        background
        hide-on-single-page
        @current-change="getList()"
        @size-change="reload"
      />
    </div>

    <!-- 修改单条投注 -->
    <el-dialog v-model="edit.open" title="修改投注" width="640px" append-to-body>
      <el-form ref="editRef" :model="edit.form" :rules="rules" label-width="80px">
        <el-form-item label="投注方式" prop="betType">
          <el-radio-group v-model="edit.form.betType" @change="edit.form.betItem = ''">
            <el-radio-button v-for="t in BET_TYPES" :key="t.value" :value="t.value">{{ t.label }}</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="投注项" prop="betItem">
          <div v-if="edit.form.betType === '1'" class="item-grid">
            <el-check-tag v-for="z in options.zodiacs" :key="z.name" :checked="edit.form.betItem === z.name" class="item-tag" @change="pick(z.name)">
              {{ z.name }}<span class="item-sub">{{ z.numbers.length }}个号</span>
            </el-check-tag>
          </div>
          <div v-else-if="edit.form.betType === '2'" class="ball-grid">
            <lottery-ball
              v-for="n in options.numbers"
              :key="n.number"
              :number="n.number"
              :wave="n.wave"
              :title="n.zodiac + ' · ' + n.wave"
              :selected="edit.form.betItem === n.number"
              :label="n.zodiac"
              clickable
              size="large"
              @click="pick(n.number)"
            />
          </div>
          <div v-else class="item-grid">
            <el-check-tag v-for="w in options.waves" :key="w.name" :checked="edit.form.betItem === w.name" class="item-tag" @change="pick(w.name)">
              {{ w.name }}<span class="item-sub">{{ w.numbers.length }}个号</span>
            </el-check-tag>
          </div>
        </el-form-item>
        <el-form-item label="金额" prop="amount">
          <el-input-number v-model="edit.form.amount" :min="0.01" :precision="2" :step="10" controls-position="right" style="width: 180px" />
          <span v-if="editPreview" class="ml10" :class="editPreview.ok ? 'muted' : 'error'">
            <template v-if="editPreview.ok">{{ editPreview.count }} 个号，每号 {{ formatMoney(editPreview.per) }} 元</template>
            <template v-else>{{ editPreview.count }} 个号，金额不能均分到每个号码</template>
          </span>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="edit.form.remark" placeholder="选填" maxlength="500" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button type="primary" :loading="edit.saving" @click="saveEdit">确 定</el-button>
        <el-button @click="edit.open = false">取 消</el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import LotteryBall from '@/components/LotteryBall.vue'
import { listBet, updateBet, delBet } from '@/api/bet'
import { BET_TYPES, previewItems, formatMoney } from '@/utils/bet'
import { hasPermi } from '@/utils/user'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  issueDate: { type: String, required: true },
  issueNo: { type: String, required: true },
  options: { type: Object, required: true }
})
// changed：修改或删除了记录，参数为受影响的 betId 列表
const emit = defineEmits(['update:modelValue', 'changed'])

const canEdit = computed(() => hasPermi('lottery:bet:edit'))
const canRemove = computed(() => hasPermi('lottery:bet:remove'))

const loading = ref(false)
const rows = ref([])
const total = ref(0)
const query = reactive({ betType: '', pageNum: 1, pageSize: 20 })
const drawn = computed(() => rows.value.some(r => r.drawn))
const updatedAt = ref('')

// 自动刷新：秒，0 为关闭；选择保存在本机
const REFRESH_KEY = 'Luhe-Bet-AutoRefresh'
const REFRESH_OPTIONS = [
  { value: 0, label: '关闭' },
  { value: 5, label: '5 秒' },
  { value: 10, label: '10 秒' },
  { value: 20, label: '20 秒' },
  { value: 60, label: '60 秒' }
]
const autoRefresh = ref(loadInterval())
let timer = null

const editRef = ref()
const edit = reactive({ open: false, saving: false, form: {} })
const rules = {
  betItem: [{ required: true, message: '请选择投注项', trigger: 'change' }],
  amount: [{ required: true, message: '请输入金额', trigger: 'blur' }]
}
const editPreview = computed(() => {
  const f = edit.form
  return f.betItem ? previewItems(props.options, f.betType, [f.betItem], f.amount)[0] : null
})

function betTypeLabel(type) {
  const t = BET_TYPES.find(b => b.value === type)
  return t ? t.label : type
}

function betTypeTag(type) {
  return { 1: 'warning', 2: 'primary', 3: 'success' }[type] || 'info'
}

function waveOf(number) {
  const n = props.options.numbers.find(x => x.number === number)
  return n ? n.wave : ''
}

/** 号码对应的生肖 */
function zodiacOf(number) {
  const n = props.options.numbers.find(x => x.number === number)
  return n ? n.zodiac : ''
}

/** 录入时间只显示时分秒（同一期都是同一天） */
function timeOf(v) {
  if (!v) return ''
  const m = String(v).match(/(\d{2}:\d{2}:\d{2})/)
  return m ? m[1] : v
}

function loadInterval() {
  try {
    const v = Number(localStorage.getItem(REFRESH_KEY))
    if (REFRESH_OPTIONS.some(o => o.value === v) && localStorage.getItem(REFRESH_KEY) !== null) return v
  } catch (e) {
    // 浏览器禁用存储时用默认值
  }
  return 10
}

function startTimer() {
  stopTimer()
  if (autoRefresh.value > 0 && props.modelValue) {
    timer = setInterval(tick, autoRefresh.value * 1000)
  }
}

function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

/** 定时刷新：正在修改记录或上一次请求未完成时跳过，避免打断操作 */
function tick() {
  if (edit.open || loading.value) return
  getList(true)
}

function onIntervalChange(v) {
  try {
    localStorage.setItem(REFRESH_KEY, String(v))
  } catch (e) {
    // 忽略
  }
  startTimer()
}

function onOpen() {
  reload()
  startTimer()
}

// 弹窗一关闭就停止定时刷新
watch(() => props.modelValue, v => {
  if (!v) stopTimer()
})

onBeforeUnmount(stopTimer)

/** silent：后台刷新，不显示加载遮罩，出错也不清空当前列表 */
async function getList(silent = false) {
  if (!silent) loading.value = true
  try {
    const res = await listBet({ issueNo: props.issueDate, betType: query.betType || undefined, pageNum: query.pageNum, pageSize: query.pageSize })
    rows.value = res.rows || []
    total.value = res.total || 0
    updatedAt.value = new Date().toTimeString().slice(0, 8)
  } catch (e) {
    if (!silent) {
      rows.value = []
      total.value = 0
    }
  } finally {
    if (!silent) loading.value = false
  }
}

function reload() {
  query.pageNum = 1
  getList()
}

function openEdit(row) {
  edit.form = { betId: row.betId, betType: row.betType, betItem: row.betItem, amount: Number(row.amount), remark: row.remark || '' }
  edit.open = true
  editRef.value?.clearValidate()
}

function pick(item) {
  edit.form.betItem = item
  editRef.value?.validateField('betItem').catch(() => {})
}

function saveEdit() {
  editRef.value.validate(async valid => {
    if (!valid) return
    if (editPreview.value && !editPreview.value.ok) {
      ElMessage.error(`「${edit.form.betItem}」有 ${editPreview.value.count} 个号码，金额不能均分到每个号码`)
      return
    }
    edit.saving = true
    try {
      const f = edit.form
      await updateBet({ betId: f.betId, betType: f.betType, betItem: f.betItem, amount: f.amount, remark: f.remark || undefined })
      ElMessage.success('修改成功')
      edit.open = false
      emit('changed', [f.betId])
      getList()
    } finally {
      edit.saving = false
    }
  })
}

function remove(row) {
  ElMessageBox.confirm(`确认删除「${betTypeLabel(row.betType)} ${row.betItem}」${formatMoney(row.amount)} 元这笔投注吗？`, '删除投注', { type: 'warning' })
    .then(async () => {
      await delBet(row.betId)
      ElMessage.success('删除成功')
      emit('changed', [row.betId])
      // 删掉本页最后一条时回到上一页
      if (rows.value.length === 1 && query.pageNum > 1) query.pageNum--
      getList()
    })
    .catch(() => {})
}
</script>

<style lang="scss" scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}
.summary {
  font-size: 13px;
  color: var(--bet-muted);
}
.spacer {
  flex: 1;
}
.updated {
  font-size: 12px;
  color: var(--bet-muted);
}
.auto-refresh {
  width: 140px;
}
.item-text {
  font-weight: 600;
}
.muted {
  color: var(--bet-muted);
}
.error {
  color: #e5484d;
}
.ml10 {
  margin-left: 10px;
}
.pager {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}
.item-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.item-tag {
  min-width: 64px;
  text-align: center;
}
.item-sub {
  margin-left: 6px;
  font-size: 12px;
  font-weight: normal;
  opacity: 0.75;
}
.ball-grid {
  display: grid;
  grid-template-columns: repeat(10, 38px);
  gap: 2px;
}
</style>
