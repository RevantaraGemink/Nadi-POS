import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Parser } from 'json2csv';
import { db } from './db';
import { products, customers, transactions, transactionItems } from './db/schema';
import { eq, desc, asc, sql, count, and, like, isNull } from 'drizzle-orm';

const app = new Hono();

app.use('*', cors());

// Global error handler
app.onError((err, c) => {
  console.error('SERVER ERROR:', err);
  return c.json({ error: err.message, stack: err.stack }, 500);
});

// Serve API health check
app.get('/api', (c) => {
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
    conditions.push(
      sql`(${products.name} LIKE ${`%${search}%`} OR ${products.barcode} = ${search})`
    );
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
  try {
    const body = await c.req.json();
    console.log('POST /api/products body:', JSON.stringify(body));
    // Auto-generate SKU jika tidak disertakan
    if (!body.sku) {
      body.sku = await generateSku(body.category);
    }
    // Ensure required defaults
    const productData = {
      name: body.name,
      sku: body.sku || null,
      barcode: body.barcode || null,
      category: body.category,
      unit: body.unit || 'Pcs',
      costPrice: Number(body.costPrice) || 0,
      sellingPrice: Number(body.sellingPrice) || 0,
      stock: Number(body.stock) || 0,
      parentProductId: body.parentProductId || null,
      conversionQty: body.conversionQty || null,
      isActive: true,
    };
    console.log('Inserting product:', JSON.stringify(productData));
    const newProduct = await db.insert(products).values(productData).returning();
    console.log('Product created:', JSON.stringify(newProduct[0]));
    return c.json(newProduct[0], 201);
  } catch (error: any) {
    console.error('CREATE PRODUCT ERROR:', error);
    return c.json({ error: 'Failed to create product', details: error.message }, 500);
  }
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
              if (product.parentProductId && product.conversionQty) {
                // Fitur Eceran: Kurangi stok produk grosir (parent)
                const parentProduct = tx.select().from(products).where(eq(products.id, product.parentProductId)).get();
                if (parentProduct) {
                  tx.update(products)
                    .set({ stock: parentProduct.stock - (item.quantity * product.conversionQty) })
                    .where(eq(products.id, product.parentProductId))
                    .run();
                }
              } else {
                // Produk normal
                tx.update(products)
                  .set({ stock: product.stock - item.quantity })
                  .where(eq(products.id, item.productId))
                  .run();
              }
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

    // 1. Hitung Total Penjualan Murni (Revenue)
    const salesRes = await db.select({
      totalSales: sql<number>`SUM(${transactions.debit})`
    }).from(transactions)
      .where(sql`${transactions.transactionType} LIKE 'Penjualan%' AND ${transactions.createdAt} >= ${startDate} AND ${transactions.createdAt} <= ${endDate}`);
    const totalSales = salesRes[0].totalSales || 0;

    // 2. Hitung COGS (Harga Modal Barang Terjual)
    const cogsRes = await db.select({
      totalCogs: sql<number>`SUM(${transactionItems.quantity} * ${products.costPrice})`
    })
    .from(transactionItems)
    .innerJoin(products, eq(transactionItems.productId, products.id))
    .innerJoin(transactions, eq(transactionItems.transactionId, transactions.id))
    .where(sql`${transactions.transactionType} LIKE 'Penjualan%' AND ${transactions.createdAt} >= ${startDate} AND ${transactions.createdAt} <= ${endDate}`);
    const totalCogs  = cogsRes[0].totalCogs || 0;

    // 3. Hitung Pengeluaran Operasional (Hanya tipe 'Operasional' dan bukan '[Stok]')
    const opsExpenseRes = await db.select({
      totalOpsExpense: sql<number>`SUM(${transactions.credit})`
    }).from(transactions)
      .where(sql`${transactions.transactionType} = 'Operasional' AND ${transactions.description} NOT LIKE '[Stok]%' AND ${transactions.createdAt} >= ${startDate} AND ${transactions.createdAt} <= ${endDate}`);
    const totalOpsExpense = opsExpenseRes[0].totalOpsExpense || 0;

    // 4. Hitung Produk Terjual dan Jumlah Transaksi Penjualan
    const productsSoldRes = await db.select({
      totalItems: sql<number>`SUM(${transactionItems.quantity})`
    }).from(transactionItems)
      .innerJoin(transactions, eq(transactionItems.transactionId, transactions.id))
      .where(sql`${transactions.transactionType} LIKE 'Penjualan%' AND ${transactions.createdAt} >= ${startDate} AND ${transactions.createdAt} <= ${endDate}`);
    const totalProductsSold = productsSoldRes[0].totalItems || 0;

    const salesTxRes = await db.select({
      totalSalesTx: sql<number>`COUNT(*)`
    }).from(transactions)
      .where(sql`${transactions.transactionType} LIKE 'Penjualan%' AND ${transactions.createdAt} >= ${startDate} AND ${transactions.createdAt} <= ${endDate}`);
    const totalSalesTx = salesTxRes[0].totalSalesTx || 0;

    // Laba Bersih yang akurat
    const labaBersih = totalSales - totalCogs - totalOpsExpense;

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
      totalSalesTx,
      totalProductsSold,
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

// Endpoint: Export CSV Laporan Penjualan
app.get('/api/reports/export-sales', async (c) => {
  try {
    const period = c.req.query('period') || 'semua';
    const year   = c.req.query('year');
    const { startDate, endDate } = getDateRange(period, year);

    const data = await db.select({
      id: transactions.id,
      tanggal: transactions.createdAt,
      tipe: transactions.transactionType,
      keterangan: transactions.description,
      pemasukan: transactions.debit,
      pengeluaran: transactions.credit,
    })
    .from(transactions)
    .where(sql`${transactions.createdAt} >= ${startDate} AND ${transactions.createdAt} <= ${endDate}`)
    .orderBy(desc(transactions.createdAt));

    const fields = ['id', 'tanggal', 'tipe', 'keterangan', 'pemasukan', 'pengeluaran'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(data);

    c.header('Content-Type', 'text/csv');
    c.header('Content-Disposition', `attachment; filename="Laporan_Penjualan_${period}.csv"`);
    return c.text(csv);
  } catch (error) {
    console.error('EXPORT SALES ERROR:', error);
    return c.json({ error: "Failed to export sales report" }, 500);
  }
});

// Endpoint: Export CSV Laporan Sisa Stok
app.get('/api/reports/export-stock', async (c) => {
  try {
    const data = await db.select({
      sku: products.sku,
      barcode: products.barcode,
      nama: products.name,
      kategori: products.category,
      stok: products.stock,
      satuan: products.unit,
      harga_modal: products.costPrice,
      harga_jual: products.sellingPrice,
    })
    .from(products)
    .where(eq(products.isActive, true))
    .orderBy(asc(products.name));

    const fields = ['sku', 'barcode', 'nama', 'kategori', 'stok', 'satuan', 'harga_modal', 'harga_jual'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(data);

    c.header('Content-Type', 'text/csv');
    c.header('Content-Disposition', `attachment; filename="Laporan_Stok_${new Date().toISOString().split('T')[0]}.csv"`);
    return c.text(csv);
  } catch (error) {
    console.error('EXPORT STOCK ERROR:', error);
    return c.json({ error: "Failed to export stock report" }, 500);
  }
});



// ─── STATIC FRONTEND SERVING ──────────────────────────────────────────────────
const fs = require('fs');
const path = require('path');
const publicDir = path.join(__dirname, 'public');

// Serve frontend if it exists
if (fs.existsSync(publicDir)) {
  const relativeRoot = path.relative(process.cwd(), publicDir);
  app.use('/*', serveStatic({ root: relativeRoot || '.' }));
}

// Fallback for SPA routing
app.get('*', (c) => {
  if (c.req.path.startsWith('/api/')) return c.json({ error: 'API route not found' }, 404);
  try {
    const html = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf-8');
    return c.html(html);
  } catch (err) {
    return c.text('Frontend not built yet.', 503);
  }
});

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port
});
