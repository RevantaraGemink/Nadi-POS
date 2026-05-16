import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  sku: text("sku"),
  category: text("category").notNull(),
  costPrice: real("cost_price").notNull(),
  sellingPrice: real("selling_price").notNull(),
  stock: integer("stock").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const customers = sqliteTable("customers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  phone: text("phone"),
  address: text("address"),
  customerType: text("customer_type").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  transactionType: text("transaction_type").notNull(), // 'Penjualan', 'Operasional', 'Konsumsi', dll
  description: text("description").notNull(),
  debit: real("debit").notNull().default(0), // Masuk
  credit: real("credit").notNull().default(0), // Keluar
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const transactionItems = sqliteTable("transaction_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  transactionId: integer("transaction_id").notNull().references(() => transactions.id),
  productId: integer("product_id").references(() => products.id),
  quantity: integer("quantity").notNull(),
  price: real("price").notNull(),
  discount: real("discount").default(0),
});
