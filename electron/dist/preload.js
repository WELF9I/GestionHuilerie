"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // Database operations
    getDatabasePath: () => electron_1.ipcRenderer.invoke('get-database-path'),
    getAppVersion: () => electron_1.ipcRenderer.invoke('get-app-version'),
    // File system operations for backups
    showSaveDialog: (options) => electron_1.ipcRenderer.invoke('show-save-dialog', options),
    showOpenDialog: (options) => electron_1.ipcRenderer.invoke('show-open-dialog', options),
    // Backup operations (export path optional)
    exportDatabase: (filePath) => electron_1.ipcRenderer.invoke('export-database', filePath),
    importDatabase: (filePath) => electron_1.ipcRenderer.invoke('import-database', filePath),
    // Platform information
    platform: process.platform,
    // Environment
    isElectron: true
});
//# sourceMappingURL=preload.js.map