// luhe-bet 桌面版（Electron）主进程
//
// - 页面通过自定义协议 app://bet/ 加载打包后的 dist/，localStorage（自动登录令牌）随应用持久保存
// - app://bet/prod-api/* 由主进程转发到 luhe-admin，不经过浏览器，因此没有跨域问题
// - 后端地址在 config.json 中配置（见 electron/config.cjs），修改后重启应用生效
const { app, BrowserWindow, Menu, protocol, net, shell, dialog } = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const { pathToFileURL } = require('node:url')
const { loadConfig } = require('./config.cjs')

const SCHEME = 'app'
const HOST = 'bet'
const API_PREFIX = '/prod-api'
const DIST = path.join(__dirname, '..', 'dist')
// 开发调试：设置 ELECTRON_DEV_URL=http://localhost:81 时直接加载 vite 开发服务器
const DEV_URL = process.env.ELECTRON_DEV_URL

protocol.registerSchemesAsPrivileged([
  { scheme: SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true } }
])

let mainWindow = null
let config = null

/** 处理 app://bet/ 请求：接口转发到后端，其余读取 dist/ 静态文件 */
function registerAppProtocol() {
  protocol.handle(SCHEME, async request => {
    const url = new URL(request.url)
    if (url.pathname === API_PREFIX || url.pathname.startsWith(API_PREFIX + '/')) {
      return forwardToBackend(request, url)
    }
    let file = path.normalize(path.join(DIST, decodeURIComponent(url.pathname)))
    // 防止 ../ 越出 dist 目录
    if (!file.startsWith(DIST)) {
      return new Response('Forbidden', { status: 403 })
    }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      file = path.join(DIST, 'index.html')
    }
    return net.fetch(pathToFileURL(file).toString())
  })
}

async function forwardToBackend(request, url) {
  const target = config.apiBaseUrl + url.pathname.slice(API_PREFIX.length) + url.search
  const headers = new Headers(request.headers)
  headers.delete('origin')
  headers.delete('referer')
  try {
    const hasBody = !['GET', 'HEAD'].includes(request.method)
    return await net.fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined
    })
  } catch (e) {
    // 返回与后端一致的结构，让页面弹出可读的提示
    const body = JSON.stringify({ code: 500, msg: `无法连接后台服务 ${config.apiBaseUrl}，请检查网络或 config.json 中的 apiBaseUrl` })
    return new Response(body, { status: 200, headers: { 'Content-Type': 'application/json;charset=utf-8' } })
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#f3f5f8',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })
  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize()
    mainWindow.show()
  })
  // 页面里的外部链接用系统浏览器打开
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url)
    return { action: 'deny' }
  })
  mainWindow.loadURL(DEV_URL || `${SCHEME}://${HOST}/`)
}

/** 隐藏的菜单：保留刷新、开发者工具快捷键 */
function buildMenu() {
  const menu = Menu.buildFromTemplate([
    {
      label: '视图',
      submenu: [
        { label: '刷新', accelerator: 'F5', role: 'reload' },
        { label: '强制刷新', accelerator: 'Ctrl+F5', role: 'forceReload' },
        { type: 'separator' },
        { label: '放大', accelerator: 'Ctrl+=', role: 'zoomIn' },
        { label: '缩小', accelerator: 'Ctrl+-', role: 'zoomOut' },
        { label: '实际大小', accelerator: 'Ctrl+0', role: 'resetZoom' },
        { type: 'separator' },
        { label: '开发者工具', accelerator: 'F12', role: 'toggleDevTools' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '后台地址…',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '后台地址',
              message: `当前后台地址：${config.apiBaseUrl}`,
              detail: `修改配置文件后重启应用生效：\n${config.file}`,
              buttons: ['打开配置文件所在目录', '关闭']
            }).then(r => {
              if (r.response === 0) shell.showItemInFolder(config.file)
            })
          }
        }
      ]
    }
  ])
  Menu.setApplicationMenu(menu)
}

// 只允许运行一个实例，再次打开时激活已有窗口
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.whenReady().then(() => {
    config = loadConfig(app)
    registerAppProtocol()
    buildMenu()
    createWindow()
  })

  app.on('window-all-closed', () => app.quit())
}
