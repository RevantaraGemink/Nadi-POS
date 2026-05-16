import { db } from './src/db';
import { transactions } from './src/db/schema';

try {
  const result = db.transaction((tx) => {
    const inserted = tx.insert(transactions).values({
      transactionType: 'Test',
      description: 'Test Tx',
      debit: 0,
      credit: 0
    }).returning().get();
    
    return inserted;
  });
  console.log('Success:', result);
} catch (e) {
  console.error('Error:', e);
}
