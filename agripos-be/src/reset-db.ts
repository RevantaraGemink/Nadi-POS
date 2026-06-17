import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

const sqlite = new Database("sqlite.db");
const db = drizzle(sqlite);

sqlite.exec("DELETE FROM transaction_items");
sqlite.exec("DELETE FROM transactions");
sqlite.exec("DELETE FROM products");
sqlite.exec("DELETE FROM customers");

// Reset autoincrement sequences
sqlite.exec("UPDATE sqlite_sequence SET seq = 0 WHERE name = 'transaction_items'");
sqlite.exec("UPDATE sqlite_sequence SET seq = 0 WHERE name = 'transactions'");
sqlite.exec("UPDATE sqlite_sequence SET seq = 0 WHERE name = 'products'");
sqlite.exec("UPDATE sqlite_sequence SET seq = 0 WHERE name = 'customers'");

console.log("Semua data berhasil di-reset!");
