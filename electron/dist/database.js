"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabaseHandlers = initializeDatabaseHandlers;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const electron_1 = require("electron");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const utils_1 = require("./utils");
let db = null;
function initializeDatabaseHandlers() {
    // Get database instance
    electron_1.ipcMain.handle('database-get', () => {
        if (!db) {
            const dbPath = (0, utils_1.getDatabasePath)();
            // Ensure directory exists
            const dir = path_1.default.dirname(dbPath);
            if (!fs_1.default.existsSync(dir)) {
                fs_1.default.mkdirSync(dir, { recursive: true });
            }
            db = new better_sqlite3_1.default(dbPath);
            db.pragma('journal_mode = WAL');
            initializeDatabaseSchema();
        }
        return db;
    });
    // Execute SQL query
    electron_1.ipcMain.handle('database-exec', (event, sql) => {
        const database = getDatabase();
        return database.exec(sql);
    });
    // Prepare statement
    electron_1.ipcMain.handle('database-prepare', (event, sql) => {
        const database = getDatabase();
        return database.prepare(sql);
    });
    // Export database
    electron_1.ipcMain.handle('export-database', async (_event, targetPath) => {
        const database = getDatabase();
        // Resolve destination path
        const backupPath = targetPath && targetPath.length > 0
            ? targetPath
            : path_1.default.join(electron_1.app.getPath('desktop'), `huilerie-backup-${Date.now()}.db`);
        try {
            // Ensure all changes are written
            database.pragma('wal_checkpoint(TRUNCATE)');
            // Close current database
            closeDatabase();
            // Ensure destination directory exists
            const destDir = path_1.default.dirname(backupPath);
            if (!fs_1.default.existsSync(destDir))
                fs_1.default.mkdirSync(destDir, { recursive: true });
            // Copy file
            fs_1.default.copyFileSync((0, utils_1.getDatabasePath)(), backupPath);
            // Reopen database
            getDatabase();
            return { success: true, path: backupPath };
        }
        catch (error) {
            // Reopen database if error occurred
            getDatabase();
            const message = error instanceof Error ? error.message : String(error);
            return { success: false, error: message };
        }
    });
    // Import database
    electron_1.ipcMain.handle('import-database', async (event, filePath) => {
        try {
            // Close current database
            closeDatabase();
            // Backup current database
            const currentPath = (0, utils_1.getDatabasePath)();
            const backupPath = `${currentPath}.backup-${Date.now()}`;
            if (fs_1.default.existsSync(currentPath)) {
                fs_1.default.copyFileSync(currentPath, backupPath);
            }
            // Replace with imported database
            fs_1.default.copyFileSync(filePath, currentPath);
            // Reopen database
            getDatabase();
            return { success: true, backupPath };
        }
        catch (error) {
            // Reopen database if error occurred
            getDatabase();
            const message = error instanceof Error ? error.message : String(error);
            return { success: false, error: message };
        }
    });
    // Show save dialog for export
    electron_1.ipcMain.handle('show-save-dialog', async (event, options) => {
        const result = await electron_1.dialog.showSaveDialog(options);
        return result;
    });
    // Show open dialog for import
    electron_1.ipcMain.handle('show-open-dialog', async (event, options) => {
        const result = await electron_1.dialog.showOpenDialog(options);
        return result;
    });
}
function getDatabase() {
    if (!db) {
        const dbPath = (0, utils_1.getDatabasePath)();
        const dir = path_1.default.dirname(dbPath);
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        db = new better_sqlite3_1.default(dbPath);
        db.pragma('journal_mode = WAL');
        initializeDatabaseSchema();
    }
    return db;
}
function closeDatabase() {
    if (db) {
        try {
            db.pragma('wal_checkpoint(TRUNCATE)');
        }
        catch (error) {
            console.error('Error during WAL checkpoint:', error);
        }
        db.close();
        db = null;
    }
}
function initializeDatabaseSchema() {
    const database = getDatabase();
    // Enable foreign keys
    database.pragma('foreign_keys = ON');
    // Create tables if they don't exist (same schema as web version)
    const tables = [
        // Employees table
        `CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      position TEXT NOT NULL,
      salary REAL DEFAULT 0,
      hire_date DATE,
      vacation_balance REAL DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
        // Suppliers table
        `CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
        // Olive Purchases table
        `CREATE TABLE IF NOT EXISTS olive_purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_date DATE NOT NULL,
      supplier_id INTEGER NOT NULL,
      quantity_kg REAL NOT NULL,
      unit_price REAL NOT NULL,
      total_amount REAL NOT NULL,
      advance_paid REAL DEFAULT 0,
      remaining_balance REAL DEFAULT 0,
      batch_number TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    )`,
        // Pressing Operations table
        `CREATE TABLE IF NOT EXISTS pressing_operations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operation_date DATE NOT NULL,
      olives_quantity_kg REAL NOT NULL,
      oil_produced_liters REAL NOT NULL,
      pomace_quantity_kg REAL,
      rendement_percentage REAL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
        // Tanks table
        `CREATE TABLE IF NOT EXISTS tanks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tank_code TEXT UNIQUE NOT NULL,
      capacity_liters REAL NOT NULL,
      current_volume REAL DEFAULT 0,
      oil_type TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
        // Tank Movements table
        `CREATE TABLE IF NOT EXISTS tank_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      movement_date DATE NOT NULL,
      movement_type TEXT NOT NULL,
      tank_id INTEGER,
      target_tank_id INTEGER,
      quantity_liters REAL NOT NULL,
      reference TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tank_id) REFERENCES tanks(id),
      FOREIGN KEY (target_tank_id) REFERENCES tanks(id)
    )`,
        // Oil Sales table
        `CREATE TABLE IF NOT EXISTS oil_sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_date DATE NOT NULL,
      customer_name TEXT NOT NULL,
      quantity_liters REAL NOT NULL,
      unit_price REAL NOT NULL,
      total_amount REAL NOT NULL,
      tank_id INTEGER,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tank_id) REFERENCES tanks(id)
    )`,
        // Pomace table
        `CREATE TABLE IF NOT EXISTS pomace (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      collection_date DATE NOT NULL,
      quantity_kg REAL NOT NULL,
      status TEXT DEFAULT 'stocké',
      customer_buyer TEXT,
      sale_price REAL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
        // Settings table
        `CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      setting_key TEXT UNIQUE NOT NULL,
      setting_value TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
        // Payroll table
        `CREATE TABLE IF NOT EXISTS payroll (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      payment_date DATE NOT NULL,
      payment_type TEXT NOT NULL CHECK(payment_type IN ('salary', 'advance')),
      amount REAL NOT NULL,
      month TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE CASCADE
    )`,
        // Maintenance Fees table
        `CREATE TABLE IF NOT EXISTS maintenance_fees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      expense_date DATE NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT DEFAULT 'maintenance',
      provider TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
    ];
    tables.forEach(tableSql => {
        try {
            database.exec(tableSql);
        }
        catch (error) {
            console.error('Error creating table:', error);
        }
    });
}
//# sourceMappingURL=database.js.map