import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { loadConfig, normalizeBaseUrl } = require('../electron/config.cjs')

function fakeApp() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'luhe-bet-'))
  const exeDir = path.join(root, 'app')
  const userData = path.join(root, 'userData')
  fs.mkdirSync(exeDir)
  return {
    root, exeDir, userData,
    isPackaged: true,
    getPath: name => (name === 'exe' ? path.join(exeDir, 'luhe-bet.exe') : userData)
  }
}

test('normalizeBaseUrl', () => {
  assert.equal(normalizeBaseUrl('http://1.2.3.4:8060/'), 'http://1.2.3.4:8060')
  assert.equal(normalizeBaseUrl('1.2.3.4:8060'), 'http://1.2.3.4:8060')
  assert.equal(normalizeBaseUrl('https://a.com/api//'), 'https://a.com/api')
  assert.equal(normalizeBaseUrl(''), 'http://localhost:8060')
})

test('没有配置文件时在程序目录生成默认配置', () => {
  const app = fakeApp()
  const c = loadConfig(app)
  assert.equal(c.apiBaseUrl, 'http://localhost:8060')
  assert.equal(c.file, path.join(app.exeDir, 'config.json'))
  assert.deepEqual(JSON.parse(fs.readFileSync(c.file, 'utf8')), { apiBaseUrl: 'http://localhost:8060' })
})

test('程序目录不可写时写到用户数据目录', () => {
  const app = fakeApp()
  fs.rmSync(app.exeDir, { recursive: true })
  fs.writeFileSync(app.exeDir, '') // 同名文件，目录无法创建
  const c = loadConfig(app)
  assert.equal(c.file, path.join(app.userData, 'config.json'))
  assert.ok(fs.existsSync(c.file))
})

test('读取程序目录下的配置（含 BOM），优先于用户数据目录', () => {
  const app = fakeApp()
  fs.writeFileSync(path.join(app.exeDir, 'config.json'), '﻿{"apiBaseUrl": "192.168.1.10:8060/"}')
  fs.mkdirSync(app.userData)
  fs.writeFileSync(path.join(app.userData, 'config.json'), '{"apiBaseUrl": "http://other"}')
  assert.equal(loadConfig(app).apiBaseUrl, 'http://192.168.1.10:8060')
})

test('免安装版读取 exe 所在目录', () => {
  const app = fakeApp()
  const portable = path.join(app.root, 'portable')
  fs.mkdirSync(portable)
  fs.writeFileSync(path.join(portable, 'config.json'), '{"apiBaseUrl": "http://p:1"}')
  process.env.PORTABLE_EXECUTABLE_DIR = portable
  try {
    assert.equal(loadConfig(app).apiBaseUrl, 'http://p:1')
  } finally {
    delete process.env.PORTABLE_EXECUTABLE_DIR
  }
})

test('配置文件格式错误时使用默认值', () => {
  const app = fakeApp()
  fs.writeFileSync(path.join(app.exeDir, 'config.json'), '{oops')
  assert.equal(loadConfig(app).apiBaseUrl, 'http://localhost:8060')
})
