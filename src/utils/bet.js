// 录入相关的纯函数（无依赖，tests/ 下有单元测试）

export const BET_TYPES = [
  { value: '1', label: '生肖' },
  { value: '2', label: '号码' },
  { value: '3', label: '色波' }
]

/** 投注项覆盖的号码 */
export function numbersOf(options, betType, item) {
  if (betType === '1') {
    const z = options.zodiacs.find(x => x.name === item)
    return z ? z.numbers : []
  }
  if (betType === '2') {
    return options.numbers.some(x => x.number === item) ? [item] : []
  }
  const w = options.waves.find(x => x.name === item)
  return w ? w.numbers : []
}

/** 每个已选投注项的号码数与每号金额（以分计算，避免浮点误差） */
export function previewItems(options, betType, items, amount) {
  const cents = Math.round((amount || 0) * 100)
  if (!cents || !items || !items.length) return []
  return items.map(item => {
    const count = numbersOf(options, betType, item).length
    const ok = count > 0 && cents % count === 0
    return { item, count, ok, per: ok ? cents / count / 100 : 0 }
  })
}

export function formatMoney(v) {
  if (v === null || v === undefined || v === '') return '—'
  return Number(v).toFixed(2)
}

/** 金额排名前 n 的名字（金额为 0 的不算），用于高亮 */
export function topKeys(list, key, n = 3) {
  return new Set(
    list
      .filter(x => Number(x.amount) > 0)
      .sort((a, b) => Number(b.amount) - Number(a.amount))
      .slice(0, n)
      .map(x => x[key])
  )
}
