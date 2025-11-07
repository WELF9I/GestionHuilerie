-- Huilerie Management System - SQLite Database Schema
-- Full system for olive oil mill operations

-- 1. EMPLOYEES MODULE
CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  role TEXT NOT NULL,
  salary REAL,
  hireDate DATE NOT NULL,
  status TEXT CHECK(status IN ('actif', 'inactif')) DEFAULT 'actif',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. SUPPLIERS MODULE
CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  contactPerson TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  postalCode TEXT,
  type TEXT CHECK(type IN ('producteur_olives', 'fournisseur', 'prestataire')) DEFAULT 'producteur_olives',
  status TEXT CHECK(status IN ('actif', 'inactif')) DEFAULT 'actif',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. OLIVE PURCHASES MODULE
CREATE TABLE IF NOT EXISTS olive_purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  supplierId INTEGER NOT NULL,
  purchaseDate DATE NOT NULL,
  quantityKg REAL NOT NULL,
  pricePerKg REAL NOT NULL,
  totalPrice REAL NOT NULL,
  quality TEXT CHECK(quality IN ('extra', 'premiere', 'second')),
  notes TEXT,
  status TEXT CHECK(status IN ('en_attente', 'recu', 'refuse')) DEFAULT 'en_attente',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(supplierId) REFERENCES suppliers(id)
);

-- 4. OIL PRESSING MODULE
CREATE TABLE IF NOT EXISTS pressing_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  purchaseId INTEGER,
  pressDate DATE NOT NULL,
  oliveQuantityKg REAL NOT NULL,
  oilProducedLiters REAL NOT NULL,
  extractionRate REAL,
  temperature REAL,
  pressType TEXT CHECK(pressType IN ('premiere', 'deuxieme', 'mixte')),
  operatorId INTEGER,
  notes TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(purchaseId) REFERENCES olive_purchases(id),
  FOREIGN KEY(operatorId) REFERENCES employees(id)
);

-- 5. TANK STORAGE MODULE
CREATE TABLE IF NOT EXISTS storage_tanks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  capacity REAL NOT NULL,
  location TEXT,
  material TEXT,
  temperature REAL,
  status TEXT CHECK(status IN ('vide', 'partiel', 'plein')) DEFAULT 'vide',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tank_storage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tankId INTEGER NOT NULL,
  pressingSessionId INTEGER,
  storageDate DATE NOT NULL,
  quantityLiters REAL NOT NULL,
  harvestYear INTEGER,
  qualityGrade TEXT CHECK(qualityGrade IN ('extra', 'premiere', 'lampante')),
  notes TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(tankId) REFERENCES storage_tanks(id),
  FOREIGN KEY(pressingSessionId) REFERENCES pressing_sessions(id)
);

-- 6. SALES MODULE
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  contactPerson TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  postalCode TEXT,
  type TEXT CHECK(type IN ('entreprise', 'particulier', 'grossiste')) DEFAULT 'particulier',
  status TEXT CHECK(status IN ('actif', 'inactif')) DEFAULT 'actif',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customerId INTEGER NOT NULL,
  saleDate DATE NOT NULL,
  quantityLiters REAL NOT NULL,
  pricePerLiter REAL NOT NULL,
  totalPrice REAL NOT NULL,
  qualityGrade TEXT CHECK(qualityGrade IN ('extra', 'premiere', 'lampante')),
  paymentStatus TEXT CHECK(paymentStatus IN ('en_attente', 'partiel', 'paye')) DEFAULT 'en_attente',
  paymentMethod TEXT CHECK(paymentMethod IN ('cheque', 'virement', 'especes', 'carte')),
  notes TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(customerId) REFERENCES customers(id)
);

-- 7. AUDIT LOG MODULE
CREATE TABLE IF NOT EXISTS pomace_stock (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pressingSessionId INTEGER,
  quantityKg REAL NOT NULL,
  storageDate DATE NOT NULL,
  moistureContent REAL,
  quality TEXT CHECK(quality IN ('humide', 'sechee')),
  status TEXT CHECK(status IN ('stock', 'vendu')) DEFAULT 'stock',
  notes TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(pressingSessionId) REFERENCES pressing_sessions(id)
);

CREATE TABLE IF NOT EXISTS pomace_sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pomaceId INTEGER NOT NULL,
  buyerId INTEGER,
  saleDate DATE NOT NULL,
  quantityKg REAL NOT NULL,
  pricePerKg REAL NOT NULL,
  totalPrice REAL NOT NULL,
  paymentStatus TEXT CHECK(paymentStatus IN ('en_attente', 'partiel', 'paye')) DEFAULT 'en_attente',
  notes TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(pomaceId) REFERENCES pomace_stock(id),
  FOREIGN KEY(buyerId) REFERENCES suppliers(id)
);

-- 8. SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  action TEXT NOT NULL,
  tableName TEXT NOT NULL,
  recordId INTEGER,
  oldValue TEXT,
  newValue TEXT,
  userId INTEGER,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(userId) REFERENCES employees(id)
);

-- 10. SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indices for performance
CREATE INDEX IF NOT EXISTS idx_supplier_status ON suppliers(status);
CREATE INDEX IF NOT EXISTS idx_purchase_date ON olive_purchases(purchaseDate);
CREATE INDEX IF NOT EXISTS idx_pressing_date ON pressing_sessions(pressDate);
CREATE INDEX IF NOT EXISTS idx_tank_status ON storage_tanks(status);
CREATE INDEX IF NOT EXISTS idx_sale_date ON sales(saleDate);
CREATE INDEX IF NOT EXISTS idx_customer_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
