import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Database operations
  getDatabasePath: () => ipcRenderer.invoke('get-database-path'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // File system operations for backups
  showSaveDialog: (options: any) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options: any) => ipcRenderer.invoke('show-open-dialog', options),

  // Backup operations (export path optional)
  exportDatabase: (filePath?: string) => ipcRenderer.invoke('export-database', filePath),
  importDatabase: (filePath: string) => ipcRenderer.invoke('import-database', filePath),

  // Platform information
  platform: process.platform,

  // Environment
  isElectron: true
})

// Type definitions for the exposed API
declare global {
  interface Window {
    electronAPI: {
      getDatabasePath: () => Promise<string>
      getAppVersion: () => Promise<string>
      showSaveDialog: (options: any) => Promise<any>
      showOpenDialog: (options: any) => Promise<any>
  exportDatabase: (filePath?: string) => Promise<{ success: boolean; path?: string; error?: string }>
      importDatabase: (filePath: string) => Promise<void>
      platform: string
      isElectron: boolean
    }
  }
}
