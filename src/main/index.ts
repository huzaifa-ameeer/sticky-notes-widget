import { mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  screen,
  type IpcMainEvent,
  type IpcMainInvokeEvent
} from 'electron'
import { IPC, type NoteData } from '../shared/types'
import { defaultBounds, MIN_SIZE, normalizeBounds } from './bounds'
import { NoteStore } from './storage'
import { WindowStateStore } from './windowState'

const BOUNDS_SAVE_DEBOUNCE_MS = 300
const WINDOW_TITLE = 'My Notes'

let mainWindow: BrowserWindow | null = null
let noteStore: NoteStore | null = null
let windowStateStore: WindowStateStore | null = null
let boundsTimer: ReturnType<typeof setTimeout> | null = null

interface AppSettings {
  launchAtStartup?: boolean
}

function isTrustedSender(event: IpcMainEvent | IpcMainInvokeEvent): boolean {
  return mainWindow !== null && !mainWindow.isDestroyed() && event.sender === mainWindow.webContents
}

function assertTrustedSender(event: IpcMainInvokeEvent): void {
  if (!isTrustedSender(event)) throw new Error('Rejected IPC call from an unknown sender')
}

function registerIpcHandlers(): void {
  ipcMain.handle(IPC.loadNote, (event): NoteData => {
    assertTrustedSender(event)
    return noteStore?.get() ?? { content: '', updatedAt: '' }
  })

  ipcMain.handle(IPC.saveNote, (event, content: unknown): void => {
    assertTrustedSender(event)
    if (typeof content !== 'string') return
    noteStore?.save(content)
  })

  ipcMain.on(IPC.saveNoteSync, (event, content: unknown) => {
    if (!isTrustedSender(event)) {
      event.returnValue = false
      return
    }

    try {
      if (typeof content === 'string') noteStore?.save(content)
      event.returnValue = true
    } catch (error) {
      console.error('[ipc] Synchronous note save failed:', error)
      event.returnValue = false
    }
  })

  ipcMain.on(IPC.minimizeWindow, (event) => {
    if (!isTrustedSender(event)) return
    mainWindow?.minimize()
  })

  ipcMain.on(IPC.closeWindow, (event) => {
    if (!isTrustedSender(event)) return
    mainWindow?.close()
  })
}

function applyAutoStartSetting(): void {
  if (!app.isPackaged) return

  const settingsPath = join(app.getPath('userData'), 'settings.json')
  let launchAtStartup = false

  try {
    const settings = JSON.parse(readFileSync(settingsPath, 'utf-8')) as AppSettings
    launchAtStartup = settings.launchAtStartup === true
  } catch {
    launchAtStartup = false
  }

  app.setLoginItemSettings({
    openAtLogin: launchAtStartup,
    path: process.execPath,
    args: []
  })
}

function persistWindowBounds(): void {
  if (!mainWindow || mainWindow.isDestroyed() || !windowStateStore) return
  windowStateStore.save(mainWindow.getBounds())
}

function scheduleWindowBoundsSave(): void {
  if (boundsTimer) clearTimeout(boundsTimer)
  boundsTimer = setTimeout(() => {
    boundsTimer = null
    persistWindowBounds()
  }, BOUNDS_SAVE_DEBOUNCE_MS)
}

function createWindow(): void {
  if (!windowStateStore) return

  const workAreas = screen.getAllDisplays().map((display) => display.workArea)
  const savedBounds = windowStateStore.load()
  const restoredBounds = savedBounds ? normalizeBounds(savedBounds, workAreas) : null
  const bounds = restoredBounds ?? defaultBounds(screen.getPrimaryDisplay().workArea)

  mainWindow = new BrowserWindow({
    ...bounds,
    minWidth: MIN_SIZE.width,
    minHeight: MIN_SIZE.height,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    resizable: true,
    maximizable: false,
    fullscreenable: false,
    alwaysOnTop: true,
    show: false,
    title: WINDOW_TITLE,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: true
    }
  })

  Menu.setApplicationMenu(null)
  mainWindow.setMenuBarVisibility(false)
  mainWindow.setAlwaysOnTop(true, 'floating')

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('resize', scheduleWindowBoundsSave)
  mainWindow.on('move', scheduleWindowBoundsSave)
  mainWindow.on('close', persistWindowBounds)
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  mainWindow.webContents.on('will-navigate', (event) => {
    event.preventDefault()
  })
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    console.error('[main] Renderer process gone:', details.reason)
  })

  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

const userDataOverride = process.env['STICKY_NOTES_USER_DATA']
if (!app.isPackaged && userDataOverride) {
  mkdirSync(userDataOverride, { recursive: true })
  app.setPath('userData', userDataOverride)
}

const hasSingleInstanceLock = app.requestSingleInstanceLock()

if (!hasSingleInstanceLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.show()
    mainWindow.focus()
  })

  app.whenReady().then(() => {
    noteStore = new NoteStore(app.getPath('userData'))
    windowStateStore = new WindowStateStore(app.getPath('userData'))
    applyAutoStartSetting()
    registerIpcHandlers()
    createWindow()
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  app.on('window-all-closed', () => {
    app.quit()
  })

  app.on('before-quit', () => {
    if (boundsTimer) {
      clearTimeout(boundsTimer)
      boundsTimer = null
    }
    persistWindowBounds()
  })
}
