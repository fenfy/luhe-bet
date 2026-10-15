<template>
  <section class="panel">
    <div class="panel-head">
      <h2>录入投注</h2>
      <span class="issue">第 {{ issueNo }} 期</span>
    </div>

    <el-alert v-if="drawn" type="warning" :closable="false" show-icon class="mb12" title="本期已开奖，投注已锁定，不能再录入" />

    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px" :disabled="drawn || submitting">
      <el-form-item label="开奖日期" prop="issueDate">
        <el-date-picker
          :model-value="issueDate"
          type="date"
          value-format="YYYYMMDD"
          format="YYYY-MM-DD"
          :clearable="false"
          :disabled="submitting"
          style="width: 180px"
          @update:model-value="v => emit('update:issueDate', v)"
        />
      </el-form-item>
      <el-form-item label="投注方式" prop="betType">
        <el-radio-group v-model="form.betType" @change="form.betItems = []">
          <el-radio-button v-for="t in BET_TYPES" :key="t.value" :value="t.value">{{ t.label }}</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="投注项" prop="betItems">
        <div v-if="form.betType === '1'" class="item-grid">
          <el-check-tag v-for="z in options.zodiacs" :key="z.name" :checked="isPicked(z.name)" class="item-tag" @change="togglePick(z.name)">
            {{ z.name }}<span class="item-sub">{{ z.numbers.length }}个号</span>
          </el-check-tag>
        </div>
        <div v-else-if="form.betType === '2'" class="ball-grid">
          <lottery-ball
            v-for="n in options.numbers"
            :key="n.number"
            :number="n.number"
            :wave="n.wave"
            :title="n.zodiac + ' · ' + n.wave"
            :selected="isPicked(n.number)"
            :clickable="!drawn"
            size="large"
            @click="!drawn && togglePick(n.number)"
          />
        </div>
        <div v-else class="item-grid">
          <el-check-tag v-for="w in options.waves" :key="w.name" :checked="isPicked(w.name)" class="item-tag" @change="togglePick(w.name)">
            {{ w.name }}<span class="item-sub">{{ w.numbers.length }}个号 · 赔率 {{ w.odds }}</span>
          </el-check-tag>
        </div>
        <div class="form-tip">
          可多选，每个投注项各生成一条投注，金额相同
          <el-button v-if="form.betItems.length" link type="primary" size="small" @click="form.betItems = []">清空已选（{{ form.betItems.length }}）</el-button>
        </div>
      </el-form-item>
      <el-form-item label="金额" prop="amount">
        <el-input-number v-model="form.amount" :min="0.01" :precision="2" :step="10" controls-position="right" style="width: 180px" />
        <span class="ml10 muted">元 / 每个投注项</span>
      </el-form-item>
      <el-form-item v-if="preview.length" label="核对">
        <div class="preview">
          <div v-for="p in preview" :key="p.item" :class="{ 'preview-error': !p.ok }">
            {{ p.item }}：{{ p.count }} 个号，
            <template v-if="p.ok">每号 {{ formatMoney(p.per) }} 元</template>
            <template v-else>{{ formatMoney(form.amount) }} 元不能均分到每个号码</template>
          </div>
          <div v-if="preview.length > 1" class="preview-total">合计 {{ preview.length }} 笔，{{ formatMoney(form.amount * preview.length) }} 元</div>
        </div>
      </el-form-item>
      <el-form-item label="备注" prop="remark">
        <el-input v-model="form.remark" placeholder="选填" maxlength="500" style="max-width: 420px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="submitting" @click="submit">确 定</el-button>
        <el-button @click="resetItems">重 置</el-button>
      </el-form-item>
    </el-form>

    <el-alert v-if="last" type="success" :closable="false" show-icon class="last">
      <template #title>
        <span>已录入第 {{ last.issueNo }} 期 {{ last.label }}：{{ last.items.join('、') }}，各 {{ formatMoney(last.amount) }} 元，共 {{ last.ids.length }} 笔</span>
        <el-button link type="danger" class="ml10" :loading="undoing" @click="undo">撤销此次录入</el-button>
      </template>
    </el-alert>
  </section>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import LotteryBall from '@/components/LotteryBall.vue'
import { addBetBatch, undoBets } from '@/api/bet'
import { BET_TYPES, previewItems, formatMoney } from '@/utils/bet'

const props = defineProps({
  options: { type: Object, required: true },
  issueDate: { type: String, required: true },
  issueNo: { type: String, required: true },
  drawn: { type: Boolean, default: false }
})
const emit = defineEmits(['update:issueDate', 'changed'])

const formRef = ref()
const submitting = ref(false)
const undoing = ref(false)
// 最近一次提交，用于撤销
const last = ref(null)

const form = reactive({ betType: '1', betItems: [], amount: undefined, remark: '' })
const rules = {
  betItems: [{ type: 'array', required: true, min: 1, message: '请选择投注项', trigger: 'change' }],
  amount: [{ required: true, message: '请输入金额', trigger: 'blur' }]
}

const preview = computed(() => previewItems(props.options, form.betType, form.betItems, form.amount))

// 换了日期，上一次的撤销入口不再对应当前期
watch(() => props.issueDate, () => {
  last.value = null
})

function isPicked(item) {
  return form.betItems.includes(item)
}

function togglePick(item) {
  form.betItems = isPicked(item) ? form.betItems.filter(x => x !== item) : [...form.betItems, item]
  formRef.value?.validateField('betItems').catch(() => {})
}

/** 保留开奖日期和投注方式，清空投注项、金额、备注，方便连续录入 */
function resetItems() {
  form.betItems = []
  form.amount = undefined
  form.remark = ''
  formRef.value?.clearValidate()
}

function submit() {
  formRef.value.validate(async valid => {
    if (!valid) return
    const bad = preview.value.find(p => !p.ok)
    if (bad) {
      ElMessage.error(`「${bad.item}」有 ${bad.count} 个号码，金额不能均分到每个号码`)
      return
    }
    submitting.value = true
    try {
      const payload = { issueNo: props.issueDate, betType: form.betType, betItems: [...form.betItems], amount: form.amount, remark: form.remark || undefined }
      const res = await addBetBatch(payload)
      last.value = {
        ids: res.data,
        issueNo: props.issueNo,
        label: BET_TYPES.find(t => t.value === form.betType).label,
        items: payload.betItems,
        amount: payload.amount
      }
      ElMessage.success(`录入成功，共 ${res.data.length} 笔`)
      resetItems()
      emit('changed')
    } finally {
      submitting.value = false
    }
  })
}

function undo() {
  const l = last.value
  ElMessageBox.confirm(`确认撤销刚才录入的 ${l.ids.length} 笔投注（${l.items.join('、')}）吗？`, '撤销录入', { type: 'warning' })
    .then(async () => {
      undoing.value = true
      try {
        await undoBets(l.ids)
        last.value = null
        ElMessage.success('已撤销')
        emit('changed')
      } finally {
        undoing.value = false
      }
    })
    .catch(() => {})
}
</script>

<style lang="scss" scoped>
.panel {
  background: var(--bet-card);
  border: 1px solid var(--bet-border);
  border-radius: 8px;
  padding: 18px 20px 4px;
}
.panel-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 14px;
  h2 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
  }
}
.issue {
  color: var(--bet-muted);
  font-size: 13px;
}
.mb12 {
  margin-bottom: 12px;
}
.ml10 {
  margin-left: 10px;
}
.muted {
  color: var(--bet-muted);
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
.form-tip {
  width: 100%;
  font-size: 12px;
  color: var(--bet-muted);
  line-height: 20px;
  margin-top: 4px;
}
.preview {
  line-height: 22px;
  font-size: 13px;
}
.preview-error {
  color: #e5484d;
}
.preview-total {
  margin-top: 4px;
  font-weight: 600;
}
.last {
  margin-bottom: 16px;
}
</style>
