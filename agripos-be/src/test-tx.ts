import { db } from './db';
import { transactions } from './db/schema';

async function main() {
  const allTx = await db.select().from(transactions);
  console.log("=== TRANSACTIONS ===");
  console.log(allTx);
}

main().catch(console.error);
