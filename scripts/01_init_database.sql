-- Huilerie Management System - Updated SQLite Database Schema
-- Current system for olive oil mill operations
-- Generated based on lib/db.ts schema

-- 1. EMPLOYEES TABLE
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
);

-- 2. SUPPLIERS TABLE
CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. OLIVE PURCHASES TABLE
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
);

-- 4. PRESSING OPERATIONS TABLE
CREATE TABLE IF NOT EXISTS pressing_operations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  operation_date DATE NOT NULL,
  olives_quantity_kg REAL NOT NULL,
  total_price REAL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. TANKS TABLE
CREATE TABLE IF NOT EXISTS tanks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tank_code TEXT UNIQUE NOT NULL,
  capacity_liters REAL NOT NULL,
  current_volume REAL DEFAULT 0,
  oil_type TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. TANK MOVEMENTS TABLE
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
);

-- 7. OIL SALES TABLE
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
);

-- 8. POMACE TABLE
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
);

-- 9. SETTINGS TABLE
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 10. PAYROLL TABLE
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
);

-- 11. PURCHASE PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS purchase_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  purchase_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  payment_date DATE NOT NULL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (purchase_id) REFERENCES olive_purchases(id) ON DELETE CASCADE
);

-- Create indices for performance
CREATE INDEX IF NOT EXISTS idx_employees_position ON employees(position);
CREATE INDEX IF NOT EXISTS idx_olive_purchases_date ON olive_purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_olive_purchases_supplier ON olive_purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_pressing_operations_date ON pressing_operations(operation_date);
CREATE INDEX IF NOT EXISTS idx_tanks_status ON tanks(is_active);
CREATE INDEX IF NOT EXISTS idx_oil_sales_date ON oil_sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_oil_sales_customer ON oil_sales(customer_name);
CREATE INDEX IF NOT EXISTS idx_pomace_date ON pomace(collection_date);
CREATE INDEX IF NOT EXISTS idx_payroll_date ON payroll(payment_date);
CREATE INDEX IF NOT EXISTS idx_payroll_employee ON payroll(employee_id);
CREATE INDEX IF NOT EXISTS idx_purchase_payments_purchase ON purchase_payments(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_payments_date ON purchase_payments(payment_date);
