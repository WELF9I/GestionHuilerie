import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { join, dirname, resolve } from 'path'
import { initializeDatabaseHandlers } from './database'
import { spawn } from 'child_process'

// Inline isDev to avoid TS resolution issues with relative import when editing in main project context
const isDev = process.env.NODE_ENV === 'development'

// Keep a global reference of the window object
let mainWindow: BrowserWindow | null = null
let nextServerProcess: ReturnType<typeof spawn> | null = null

async function waitForPort(port: number, timeoutMs = 20000): Promise<void> {
  const start = Date.now()
  const net = await import('net')
  return new Promise((resolveWait, reject) => {
    const tryConnect = () => {
      const socket = new net.Socket()
      socket
        .setTimeout(2000)
        .once('connect', () => {
          socket.destroy()
          resolveWait()
        })
        .once('timeout', () => {
          socket.destroy()
          retry()
        })
        .once('error', () => {
          socket.destroy()
          retry()
        })
        .connect(port, '127.0.0.1')

      const retry = () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`Timed out waiting for port ${port}`))
          return
        }
        setTimeout(tryConnect, 300)
      }
    }
    tryConnect()
  })
}

async function startNextInProduction(): Promise<void> {
  // Use Next.js standalone output to start a local server within Electron
  const standaloneDir = resolve(__dirname, '../../.next/standalone')
  const serverJs = resolve(standaloneDir, 'server.js')

  // Pass DB path for desktop to Next server so it uses userData location
  const dbPath = join(app.getPath('userData'), 'huilerie.db')

  // Use Electron binary as Node with ELECTRON_RUN_AS_NODE
  nextServerProcess = spawn(process.execPath, [serverJs], {
    cwd: standaloneDir,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      PORT: process.env.PORT || '3000',
      HUILERIE_DB_PATH: dbPath
    },
    stdio: 'pipe'
  })

  nextServerProcess.stdout?.on('data', (d) => {
    const msg = d.toString()
    if (msg.toLowerCase().includes('ready') || msg.toLowerCase().includes('started')) {
      // no-op, we'll still wait on the port below
    }
  })
  nextServerProcess.stderr?.on('data', (d) => {
    console.error('[next-server]', d.toString())
  })

  app.once('before-quit', () => {
    if (nextServerProcess && !nextServerProcess.killed) {
      nextServerProcess.kill()
    }
  })

  await waitForPort(Number(process.env.PORT || 3000))
}

const createWindow = (): void => {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js'),
      webSecurity: !isDev // Disable web security in dev for localhost
    },
    icon: join(__dirname, '../public/icon.png'), // Optional: add an icon
    titleBarStyle: 'default',
    show: false // Don't show until ready
  })

  // Load the app
  if (isDev || process.env.ELECTRON_DEV === 'true') {
    const port = process.env.PORT || '3000'
    mainWindow.loadURL(`http://localhost:${port}`)
    // Open DevTools in development
    mainWindow.webContents.openDevTools()
  } else {
    // In production, we serve the Next.js standalone server on localhost
    const port = process.env.PORT || '3000'
    mainWindow.loadURL(`http://localhost:${port}`)
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
  // Register IPC handlers (backup/import/dialogs)
  initializeDatabaseHandlers()

  if (!isDev) {
    try {
      await startNextInProduction()
    } catch (err) {
      console.error('Failed to start Next server in production:', err)
    }
  }

  createWindow()

  app.on('activate', () => {
    // On macOS it's common to re-create a window when the dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC handlers for database operations
ipcMain.handle('get-database-path', () => {
  const userDataPath = app.getPath('userData')
  return join(userDataPath, 'huilerie.db')
})

ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})

// Security: Prevent navigation to external URLs
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl)
    
    if (isDev && parsedUrl.origin === 'http://localhost:3000') {
      return
    }
    
    if (parsedUrl.origin !== 'file:') {
      event.preventDefault()
    }
  })
})
