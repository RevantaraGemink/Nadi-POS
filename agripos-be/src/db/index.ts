import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";

const dbPath = process.env.DB_PATH || "sqlite.db";
const sqlite = new Database(dbPath);

// Auto-create tables if they don't exist (fixes fresh install / empty DB)
sqlite.exec(`
CREATE TABLE IF NOT EXISTS customers (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  name text NOT NULL,
  phone text,
  address text,
  customer_type text NOT NULL,
  created_at text NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  name text NOT NULL,
  sku text,
  barcode text,
  category text NOT NULL,
  unit text DEFAULT 'Pcs' NOT NULL,
  cost_price real NOT NULL,
  selling_price real NOT NULL,
  stock real NOT NULL,
  parent_product_id integer,
  conversion_qty real,
  is_active integer DEFAULT 1 NOT NULL,
  created_at text NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  transaction_type text NOT NULL,
  description text NOT NULL,
  debit real DEFAULT 0 NOT NULL,
  credit real DEFAULT 0 NOT NULL,
  customer_id integer,
  created_at text NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON UPDATE no action ON DELETE no action
);

CREATE TABLE IF NOT EXISTS transaction_items (
  id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  transaction_id integer NOT NULL,
  product_id integer,
  quantity integer NOT NULL,
  price real NOT NULL,
  discount real DEFAULT 0,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON UPDATE no action ON DELETE no action,
  FOREIGN KEY (product_id) REFERENCES products(id) ON UPDATE no action ON DELETE no action
);
`);

// Safe migrations for older databases that don't have the new columns
const migrations = [
  "ALTER TABLE products ADD COLUMN sku text;",
  "ALTER TABLE products ADD COLUMN barcode text;",
  "ALTER TABLE products ADD COLUMN unit text DEFAULT 'Pcs' NOT NULL;",
  "ALTER TABLE products ADD COLUMN parent_product_id integer;",
  "ALTER TABLE products ADD COLUMN conversion_qty real;",
  "ALTER TABLE products ADD COLUMN is_active integer DEFAULT 1 NOT NULL;",
  "ALTER TABLE products ADD COLUMN created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL;",
  
  "ALTER TABLE customers ADD COLUMN phone text;",
  "ALTER TABLE customers ADD COLUMN address text;",
  "ALTER TABLE customers ADD COLUMN customer_type text DEFAULT 'Umum' NOT NULL;",
  "ALTER TABLE customers ADD COLUMN created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL;",
  
  "ALTER TABLE transactions ADD COLUMN debit real DEFAULT 0 NOT NULL;",
  "ALTER TABLE transactions ADD COLUMN credit real DEFAULT 0 NOT NULL;",
  "ALTER TABLE transactions ADD COLUMN customer_id integer;",
  "ALTER TABLE transactions ADD COLUMN created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL;",
  
  "ALTER TABLE transaction_items ADD COLUMN discount real DEFAULT 0;"
];

for (const query of migrations) {
  try { sqlite.exec(query); } catch (e) { /* Column likely exists */ }
}

export const db = drizzle(sqlite, { schema });
