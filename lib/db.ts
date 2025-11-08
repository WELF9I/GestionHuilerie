import Database from "better-sqlite3"
import path from "path"

let db: Database.Database | null = null

export function getDatabase() {
  if (!db) {
    const dbPath = path.join(process.cwd(), "data", "huilerie.db")
    db = new Database(dbPath)
    db.pragma("journal_mode = WAL")
  }
  return db
}

export function closeDatabase() {
  if (db) {
    // Ensure pending transactions are flushed and WAL is truncated before closing
    try {
      db.pragma("wal_checkpoint(TRUNCATE)")
    } catch (error) {
      console.error("Erreur lors du checkpoint WAL:", error)
    }
    db.close()
    db = null
  }
}

export function initializeDatabase() {
  const database = getDatabase()
  
  // Enable foreign keys
  database.pragma("foreign_keys = ON")

  // Employees table
  database.exec(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      position TEXT NOT NULL,
      salary REAL DEFAULT 0,
      hire_date DATE,
      vacation_balance REAL DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Suppliers table
  database.exec(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Olive Purchases table
  database.exec(`
    CREATE TABLE IF NOT EXISTS olive_purchases (
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
    )
  `)

  // Pressing Operations table
  database.exec(`
    CREATE TABLE IF NOT EXISTS pressing_operations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operation_date DATE NOT NULL,
      olives_quantity_kg REAL NOT NULL,
      oil_produced_liters REAL NOT NULL,
      pomace_quantity_kg REAL,
      rendement_percentage REAL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Tanks table
  database.exec(`
    CREATE TABLE IF NOT EXISTS tanks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tank_code TEXT UNIQUE NOT NULL,
      capacity_liters REAL NOT NULL,
      current_volume REAL DEFAULT 0,
      oil_type TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Tank Movements table (history)
  database.exec(`
    CREATE TABLE IF NOT EXISTS tank_movements (
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
    )
  `)

  // Oil Sales table
  database.exec(`
    CREATE TABLE IF NOT EXISTS oil_sales (
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
    )
  `)

  // Pomace (Grignons) table
  database.exec(`
    CREATE TABLE IF NOT EXISTS pomace (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      collection_date DATE NOT NULL,
      quantity_kg REAL NOT NULL,
      status TEXT DEFAULT 'stocké',
      customer_buyer TEXT,
      sale_price REAL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Settings table
  database.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      setting_key TEXT UNIQUE NOT NULL,
      setting_value TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Payroll table for tracking employee payments and advances
  database.exec(`
    CREATE TABLE IF NOT EXISTS payroll (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      payment_date DATE NOT NULL,
      payment_type TEXT NOT NULL CHECK(payment_type IN ('salary', 'advance')),
      amount REAL NOT NULL,
      month TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(employee_id) REFERENCES employees(id) ON DELETE CASCADE
    )
  `)
}
