import request from '@/utils/request'

// 投注选项：生肖、号码、色波及其号码
export function getLotteryOptions() {
  return request({ url: '/lottery/bet/options', method: 'get' })
}

// 某期统计：合计、生肖 / 号码 / 色波各项笔数与金额
export function getIssueStats(issueNo) {
  return request({ url: '/lottery/bet/stats', method: 'get', params: { issueNo } })
}

// 新增投注（betItems 多选，每项一条），返回本次新增的 betId
export function addBetBatch(data) {
  return request({ url: '/lottery/bet/batch', method: 'post', data })
}

// 撤销自己刚录入的投注
export function undoBets(betIds) {
  return request({ url: '/lottery/bet/undo/' + betIds.join(','), method: 'delete' })
}

// 投注列表（分页；issueNo 可传期号或 YYYYMMDD 日期）
export function listBet(query) {
  return request({ url: '/lottery/bet/list', method: 'get', params: query })
}

// 修改投注（未开奖时）
export function updateBet(data) {
  return request({ url: '/lottery/bet', method: 'put', data })
}

// 删除投注（未开奖时）
export function delBet(betIds) {
  return request({ url: '/lottery/bet/' + [].concat(betIds).join(','), method: 'delete' })
}
