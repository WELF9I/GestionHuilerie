"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = require("path");
const database_1 = require("./database");
const child_process_1 = require("child_process");
// Inline isDev to avoid TS resolution issues with relative import when editing in main project context
const isDev = process.env.NODE_ENV === 'development';
// Keep a global reference of the window object
let mainWindow = null;
let nextServerProcess = null;
async function waitForPort(port, timeoutMs = 20000) {
    const start = Date.now();
    const net = await Promise.resolve().then(() => __importStar(require('net')));
    return new Promise((resolveWait, reject) => {
        const tryConnect = () => {
            const socket = new net.Socket();
            socket
                .setTimeout(2000)
                .once('connect', () => {
                socket.destroy();
                resolveWait();
            })
                .once('timeout', () => {
                socket.destroy();
                retry();
            })
                .once('error', () => {
                socket.destroy();
                retry();
            })
                .connect(port, '127.0.0.1');
            const retry = () => {
                if (Date.now() - start > timeoutMs) {
                    reject(new Error(`Timed out waiting for port ${port}`));
                    return;
                }
                setTimeout(tryConnect, 300);
            };
        };
        tryConnect();
    });
}
async function startNextInProduction() {
    // Use Next.js standalone output to start a local server within Electron
    const standaloneDir = (0, path_1.resolve)(__dirname, '../../.next/standalone');
    const serverJs = (0, path_1.resolve)(standaloneDir, 'server.js');
    // Pass DB path for desktop to Next server so it uses userData location
    const dbPath = (0, path_1.join)(electron_1.app.getPath('userData'), 'huilerie.db');
    // Use Electron binary as Node with ELECTRON_RUN_AS_NODE
    nextServerProcess = (0, child_process_1.spawn)(process.execPath, [serverJs], {
        cwd: standaloneDir,
        env: {
            ...process.env,
            ELECTRON_RUN_AS_NODE: '1',
            PORT: process.env.PORT || '3000',
            HUILERIE_DB_PATH: dbPath
        },
        stdio: 'pipe'
    });
    nextServerProcess.stdout?.on('data', (d) => {
        const msg = d.toString();
        if (msg.toLowerCase().includes('ready') || msg.toLowerCase().includes('started')) {
            // no-op, we'll still wait on the port below
        }
    });
    nextServerProcess.stderr?.on('data', (d) => {
        console.error('[next-server]', d.toString());
    });
    electron_1.app.once('before-quit', () => {
        if (nextServerProcess && !nextServerProcess.killed) {
            nextServerProcess.kill();
        }
    });
    await waitForPort(Number(process.env.PORT || 3000));
}
const createWindow = () => {
    // Create the browser window
    mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: (0, path_1.join)(__dirname, 'preload.js'),
            webSecurity: !isDev // Disable web security in dev for localhost
        },
        icon: (0, path_1.join)(__dirname, '../public/icon.png'), // Optional: add an icon
        titleBarStyle: 'default',
        show: false // Don't show until ready
    });
    // Load the app
    if (isDev) {
        const port = process.env.PORT || '3000';
        mainWindow.loadURL(`http://localhost:${port}`);
        // Open DevTools in development
        mainWindow.webContents.openDevTools();
    }
    else {
        // In production, we serve the Next.js standalone server on localhost
        const port = process.env.PORT || '3000';
        mainWindow.loadURL(`http://localhost:${port}`);
    }
    // Show window when ready to prevent visual flash
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
    });
    // Handle external links
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        electron_1.shell.openExternal(url);
        return { action: 'deny' };
    });
    // Emitted when the window is closed
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
};
// This method will be called when Electron has finished initialization
electron_1.app.whenReady().then(async () => {
    // Register IPC handlers (backup/import/dialogs)
    (0, database_1.initializeDatabaseHandlers)();
    if (!isDev) {
        try {
            await startNextInProduction();
        }
        catch (err) {
            console.error('Failed to start Next server in production:', err);
        }
    }
    createWindow();
    electron_1.app.on('activate', () => {
        // On macOS it's common to re-create a window when the dock icon is clicked
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
// Quit when all windows are closed, except on macOS
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
// IPC handlers for database operations
electron_1.ipcMain.handle('get-database-path', () => {
    const userDataPath = electron_1.app.getPath('userData');
    return (0, path_1.join)(userDataPath, 'huilerie.db');
});
electron_1.ipcMain.handle('get-app-version', () => {
    return electron_1.app.getVersion();
});
// Security: Prevent navigation to external URLs
electron_1.app.on('web-contents-created', (event, contents) => {
    contents.on('will-navigate', (event, navigationUrl) => {
        const parsedUrl = new URL(navigationUrl);
        if (isDev && parsedUrl.origin === 'http://localhost:3000') {
            return;
        }
        if (parsedUrl.origin !== 'file:') {
            event.preventDefault();
        }
    });
});
//# sourceMappingURL=main.js.map