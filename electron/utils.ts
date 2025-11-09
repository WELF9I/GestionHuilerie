export const isDev = process.env.NODE_ENV === 'development'
export const isProd = process.env.NODE_ENV === 'production'

export function getDatabasePath(): string {
  if (isDev) {
    // In development, use the local data folder
    return './data/huilerie.db'
  } else {
    // In production, use the user data folder
    const { app } = require('electron')
    const path = require('path')
    return path.join(app.getPath('userData'), 'huilerie.db')
  }
}
