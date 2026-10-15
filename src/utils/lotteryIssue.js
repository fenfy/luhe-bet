// 期号：每天一期，「年份 + 当年第几天（3 位）」，如 2026-10-12 → 2026285

/** 日期（Date 或 'YYYYMMDD' / 'YYYY-MM-DD'）→ 期号 */
export function issueOf(date) {
  let d = date
  if (typeof date === 'string') {
    const s = date.replace(/-/g, '')
    d = new Date(Number(s.slice(0, 4)), Number(s.slice(4, 6)) - 1, Number(s.slice(6, 8)))
  }
  const start = new Date(d.getFullYear(), 0, 1)
  // 用 UTC 计算天数差，避开夏令时
  const day = Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(start.getFullYear(), 0, 1)) / 86400000) + 1
  return `${d.getFullYear()}${String(day).padStart(3, '0')}`
}

/** 今天的日期 'YYYYMMDD'（供日期选择器默认值） */
export function todayDate() {
  const d = new Date()
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`
}
