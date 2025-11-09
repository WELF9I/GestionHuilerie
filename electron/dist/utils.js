"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isProd = exports.isDev = void 0;
exports.getDatabasePath = getDatabasePath;
exports.isDev = process.env.NODE_ENV === 'development';
exports.isProd = process.env.NODE_ENV === 'production';
function getDatabasePath() {
    if (exports.isDev) {
        // In development, use the local data folder
        return './data/huilerie.db';
    }
    else {
        // In production, use the user data folder
        const { app } = require('electron');
        const path = require('path');
        return path.join(app.getPath('userData'), 'huilerie.db');
    }
}
//# sourceMappingURL=utils.js.map