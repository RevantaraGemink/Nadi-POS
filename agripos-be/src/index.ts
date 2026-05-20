import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { db } from './db';
import { products, customers, transactions, transactionItems } from './db/schema';
import { eq, desc, asc, sql, count, and, like, isNull } from 'drizzle-orm';

const app = new Hono();

app.use('*', cors());

app.get('/', (c) => {
  return c.text('AgriPOS API is running!');
});

// ─── SKU HELPER ──────────────────────────────────────────────────────────────

const CATEGORY_CODES: Record<string, string> = {
  'Insektisida': 'INS',
  'Herbisida':   'HRB',
  'Pupuk':       'PPK',
  'Fungisida':   'FNG',
  'Benih':       'BNH',
  'Alat':        'ALT',
};

async function generateSku(category: string): Promise<string> {
  const kode = CATEGORY_CODES[category] ?? 'LNN';
  const prefix = `AG-${kode}-`;

  // Cari nomor urut tertinggi untuk kategori ini (berdasarkan urutan SKU)
  const existing = await db.select({ sku: products.sku })
    .from(products)
    .where(like(products.sku, `${prefix}%`))
    .orderBy(desc(products.sku))
    .limit(1);

  let nextNum = 1;
  if (existing.length > 0 && existing[0].sku) {
    const lastNum = parseInt(existing[0].sku.replace(prefix, ''), 10);
    if (!isNaN(lastNum)) nextNum = lastNum + 1;
  }

  return `${prefix}${String(nextNum).padStart(3, '0')}`;
}

// ─── Pagination helper ───────────────────────────────────────────────────────

const getPaginationParams = (c: any) => {
  const page = Math.max(1, parseInt(c.req.query('page') || '1'));
  const limit = Math.max(1, parseInt(c.req.query('limit') || '10'));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

// ─── PRODUCTS ────────────────────────────────────────────────────────────────

// Preview SKU sebelum simpan
app.get('/api/products/preview-sku', async (c) => {
  const category = c.req.query('category');
  if (!category) return c.json({ error: 'category required' }, 400);
  const sku = await generateSku(category);
  return c.json({ sku });
});

// Backfill SKU untuk semua produk yang belum punya SKU (urut by id = urut input)
app.post('/api/products/backfill-sku', async (c) => {
  const productsWithoutSku = await db.select()
    .from(products)
    .where(isNull(products.sku))
    .orderBy(asc(products.id)); // urut dari yang pertama diinput

  let count_updated = 0;
  for (const p of productsWithoutSku) {
    const sku = await generateSku(p.category);
    await db.update(products).set({ sku }).where(eq(products.id, p.id));
    count_updated++;
  }

  return c.json({ success: true, updated: count_updated });
});

app.get('/api/products', async (c) => {
  const { page, limit, offset } = getPaginationParams(c);
  const letter = c.req.query('letter');
  const search = c.req.query('search');

  // Build WHERE conditions
  const conditions = [eq(products.isActive, true)];
  if (letter) {
    conditions.push(like(products.name, `${letter}%`));
  }
  if (search) {
    conditions.push(like(products.name, `%${search}%`));
  }
  const whereClause = and(...conditions);

  const [totalRes] = await db.select({ value: count() }).from(products).where(whereClause);
  const total = totalRes.value;

  const data = await db.select().from(products).where(whereClause).limit(limit).offset(offset);

  return c.json({
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  });
});

app.get('/api/products/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const [product] = await db.select().from(products).where(eq(products.id, id));
  if (!product) return c.json({ error: 'Product not found' }, 404);
  return c.json(product);
});

app.post('/api/products', async (c) => {
  const body = await c.req.json();
  // Auto-generate SKU jika tidak disertakan
  if (!body.sku) {
    body.sku = await generateSku(body.category);
  }
  const newProduct = await db.insert(products).values(body).returning();
  return c.json(newProduct[0], 201);
});

app.put('/api/products/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json();
  const updatedProduct = await db.update(products).set(body).where(eq(products.id, id)).returning();
  return c.json(updatedProduct[0]);
});

app.delete('/api/products/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    // Soft delete: set isActive to false
    await db.update(products).set({ isActive: false }).where(eq(products.id, id));
    return c.json({ success: true });
  } catch (error: any) {
    console.error("DELETE PRODUCT ERROR:", error);
    return c.json({ error: "Failed to delete product", details: error.message }, 500);
  }
});

// --- CUSTOMERS ---
app.get('/api/customers', async (c) => {
  const { page, limit, offset } = getPaginationParams(c);
  const search = c.req.query('search');

  const conditions: any[] = [];
  if (search) {
    conditions.push(sql`(${customers.name} LIKE ${'%' + search + '%'} OR ${customers.phone} LIKE ${'%' + search + '%'})`);
  }
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalRes] = await db.select({ value: count() }).from(customers).where(whereClause);
  const total = totalRes.value;
  
  const data = await db.select().from(customers).where(whereClause).limit(limit).offset(offset);

  // Enrich with lastTransaction and totalTransactions
  const enriched = await Promise.all(data.map(async (cust) => {
    const txStats = await db.select({
      lastDate: sql<string>`MAX(${transactions.createdAt})`,
      totalAmount: sql<number>`SUM(${transactions.debit})`,
    }).from(transactions).where(eq(transactions.customerId, cust.id));

    return {
      ...cust,
      lastTransaction: txStats[0]?.lastDate || null,
      totalTransactions: txStats[0]?.totalAmount || 0,
    };
  }));
  
  return c.json({
    data: enriched,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  });
});

app.get('/api/customers/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const [customer] = await db.select().from(customers).where(eq(customers.id, id));
  if (!customer) return c.json({ error: 'Customer not found' }, 404);
  return c.json(customer);
});

app.post('/api/customers', async (c) => {
  const body = await c.req.json();
  const newCustomer = await db.insert(customers).values(body).returning();
  return c.json(newCustomer[0], 201);
});

app.put('/api/customers/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json();
  const updatedCustomer = await db.update(customers).set(body).where(eq(customers.id, id)).returning();
  return c.json(updatedCustomer[0]);
});

app.delete('/api/customers/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  await db.delete(customers).where(eq(customers.id, id));
  return c.json({ success: true });
});

// --- TRANSACTIONS ---
app.get('/api/transactions', async (c) => {
  const { page, limit, offset } = getPaginationParams(c);
  
  const [totalRes] = await db.select({ value: count() }).from(transactions);
  const total = totalRes.value;
  
  const data = await db.select().from(transactions).orderBy(desc(transactions.createdAt)).limit(limit).offset(offset);
  
  return c.json({
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  });
});

app.get('/api/transactions/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
  if (!transaction) return c.json({ error: 'Not found' }, 404);

  const items = await db.select({
    id: transactionItems.id,
    productId: transactionItems.productId,
    quantity: transactionItems.quantity,
    price: transactionItems.price,
    discount: transactionItems.discount,
    productName: products.name,
  }).from(transactionItems)
    .leftJoin(products, eq(transactionItems.productId, products.id))
    .where(eq(transactionItems.transactionId, id));

  return c.json({ ...transaction, items });
});

app.post('/api/transactions', async (c) => {
  const body = await c.req.json();
  // Expecting { transactionType, description, debit, credit, items: [{ productId, quantity, price, discount }] }

  try {
    const newTx = db.transaction((tx) => {
      const insertedTx = tx.insert(transactions).values({
        transactionType: body.transactionType,
        description: body.description,
        debit: body.debit || 0,
        credit: body.credit || 0,
        customerId: body.customerId || null,
      }).returning().get();

      if (body.items && body.items.length > 0) {
        const itemsToInsert = body.items.map((item: any) => ({
          transactionId: insertedTx.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount || 0,
        }));
        tx.insert(transactionItems).values(itemsToInsert).run();

        // Update stock if it's a sale
        if (body.transactionType === 'Penjualan' || body.transactionType === 'Penjualan Grosir') {
          for (const item of body.items) {
            const product = tx.select().from(products).where(eq(products.id, item.productId)).get();
            if (product) {
              tx.update(products)
                .set({ stock: product.stock - item.quantity })
                .where(eq(products.id, item.productId))
                .run();
            }
          }
        }
      }
      return insertedTx;
    });

    return c.json(newTx, 201);
  } catch (error: any) {
    console.error("TRANSACTION ERROR:", error);
    return c.json({ error: "Failed to create transaction", details: error.message }, 500);
  }
});

app.get('/api/customers/:id/transactions', async (c) => {
  const id = parseInt(c.req.param('id'));
  const { page, limit, offset } = getPaginationParams(c);

  // Assuming transactions description format: "Penjualan ke [Nama Pelanggan]"
  // To keep MVP simple, we just search by description LIKE %CustomerName%
  const [customer] = await db.select().from(customers).where(eq(customers.id, id));
  if (!customer) return c.json({ error: 'Customer not found' }, 404);

  const searchParam = `%${customer.name}%`;

  const [totalRes] = await db.select({ value: count() })
    .from(transactions)
    .where(sql`${transactions.description} LIKE ${searchParam}`);
  const total = totalRes.value;

  const data = await db.select()
    .from(transactions)
    .where(sql`${transactions.description} LIKE ${searchParam}`)
    .orderBy(desc(transactions.createdAt))
    .limit(limit)
    .offset(offset);

  return c.json({
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  });
});

// ─── REPORTS ─────────────────────────────────────────────────────────────────

// Helper: build date range dari period param
function getDateRange(period: string, year?: string): { startDate: string; endDate: string } {
  const now = new Date();
  const y = year ? parseInt(year) : now.getFullYear();

  let start: Date;
  let end: Date;

  switch (period) {
    case 'hari_ini':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      end   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      break;
    case 'minggu_ini': {
      const day = now.getDay(); // 0=Sun..6=Sat
      const diffToMon = (day === 0 ? -6 : 1 - day);
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMon, 0, 0, 0);
      end   = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
      end.setHours(23, 59, 59);
      break;
    }
    case 'bulan_ini':
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      break;
    case 'tahun_ini':
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
      end   = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      break;
    case 'tahun':
      start = new Date(y, 0, 1, 0, 0, 0);
      end   = new Date(y, 11, 31, 23, 59, 59);
      break;
    default: // 'semua'
      start = new Date(2000, 0, 1);
      end   = new Date(2099, 11, 31);
  }

  return {
    startDate: start.toISOString(),
    endDate:   end.toISOString(),
  };
}

app.get('/api/reports/summary', async (c) => {
  try {
    const period = c.req.query('period') || 'semua';
    const year   = c.req.query('year');
    const { startDate, endDate } = getDateRange(period, year);

    const dateFilter = sql`${transactions.createdAt} >= ${startDate} AND ${transactions.createdAt} <= ${endDate}`;

    const res = await db.select({
      totalDebit:  sql<number>`SUM(${transactions.debit})`,
      totalCredit: sql<number>`SUM(${transactions.credit})`,
      totalTx:     sql<number>`COUNT(*)`,
    }).from(transactions).where(dateFilter);

    const totalDebit  = res[0].totalDebit  || 0;
    const totalCredit = res[0].totalCredit || 0;
    const totalTx     = res[0].totalTx     || 0;

    // Hitung COGS hanya untuk transaksi Penjualan dalam rentang
    const cogsRes = await db.select({
      totalCogs: sql<number>`SUM(${transactionItems.quantity} * ${products.costPrice})`
    })
    .from(transactionItems)
    .innerJoin(products, eq(transactionItems.productId, products.id))
    .innerJoin(transactions, eq(transactionItems.transactionId, transactions.id))
    .where(sql`${transactions.transactionType} LIKE 'Penjualan%' AND ${transactions.createdAt} >= ${startDate} AND ${transactions.createdAt} <= ${endDate}`);

    const totalCogs  = cogsRes[0].totalCogs || 0;
    const labaBersih = totalDebit - totalCogs - totalCredit;

    return c.json({
      period,
      year:             year || null,
      startDate,
      endDate,
      totalPemasukan:   totalDebit,
      totalPengeluaran: totalCredit,
      totalCogs,
      labaBersih,
      totalTransaksi:   totalTx,
    });
  } catch (error) {
    console.error('REPORT ERROR:', error);
    return c.json({ error: "Failed to generate report" }, 500);
  }
});

// Endpoint: Arus Kas dengan filter periode
app.get('/api/reports/cashflow', async (c) => {
  const { page, limit, offset } = getPaginationParams(c);
  const period = c.req.query('period') || 'semua';
  const year   = c.req.query('year');
  const { startDate, endDate } = getDateRange(period, year);

  const dateFilter = sql`${transactions.createdAt} >= ${startDate} AND ${transactions.createdAt} <= ${endDate}`;

  const [totalRes] = await db.select({ value: count() }).from(transactions).where(dateFilter);
  const total = totalRes.value;

  const data = await db.select().from(transactions)
    .where(dateFilter)
    .orderBy(desc(transactions.createdAt))
    .limit(limit)
    .offset(offset);

  return c.json({
    data,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
  });
});



const port = 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port
});
