// 桌面版配置：config.json
//
// 查找顺序：
//   1. 程序所在目录（免安装版为 exe 所在目录）下的 config.json —— 方便直接改
//   2. 用户数据目录 %APPDATA%\录入统计\config.json
// 都不存在时，在程序目录生成默认配置；程序目录不可写（如装在 Program Files）则写到用户数据目录。
const path = require('node:path')
const fs = require('node:fs')

const DEFAULTS = { apiBaseUrl: 'http://localhost:8060' }
const FILE_NAME = 'config.json'

function programDir(app) {
  // electron-builder 免安装版运行时会解压到临时目录，真实 exe 所在目录在这个环境变量里
  if (process.env.PORTABLE_EXECUTABLE_DIR) return process.env.PORTABLE_EXECUTABLE_DIR
  return app.isPackaged ? path.dirname(app.getPath('exe')) : path.join(__dirname, '..')
}

/** 规范化后端地址：去掉末尾的 /，缺协议时补 http:// */
function normalizeBaseUrl(value) {
  let v = String(value || '').trim()
  if (!v) return DEFAULTS.apiBaseUrl
  if (!/^https?:\/\//i.test(v)) v = 'http://' + v
  return v.replace(/\/+$/, '')
}

function tryWrite(file, data) {
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8')
    return true
  } catch (e) {
    return false
  }
}

function loadConfig(app) {
  const candidates = [path.join(programDir(app), FILE_NAME), path.join(app.getPath('userData'), FILE_NAME)]
  let file = candidates.find(f => fs.existsSync(f))
  let data = {}
  if (file) {
    try {
      data = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''))
    } catch (e) {
      console.error('config.json 格式错误，使用默认配置：', e.message)
    }
  } else {
    file = candidates.find(f => tryWrite(f, DEFAULTS)) || candidates[1]
  }
  return { ...DEFAULTS, ...data, apiBaseUrl: normalizeBaseUrl(data.apiBaseUrl), file }
}

module.exports = { loadConfig, normalizeBaseUrl, DEFAULTS }
