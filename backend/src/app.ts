import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import adminAuth from './adminAuth';
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  listOrders,
  createOrder,
  updateOrder,
  getOrderStats,
  getTableReservations,
  listCategories,
  createCategory,
  deleteCategory,
} from './dynamodb';
import { getPresignedUploadUrl } from './s3';
import heConfig from '../../shared/he.json';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

// ─── Auth middleware ──────────────────────────────────────────────────────────
function requireAdmin(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const token = authHeader.split(' ')[1];
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ─── Public routes ────────────────────────────────────────────────────────────

app.get('/api/products', async (_req, res) => {
  try {
    const products = await listProducts(false);
    res.json(products);
  } catch (error) {
    console.error('Products error:', error);
    // fall back to static data if DynamoDB is unavailable
    res.json(heConfig.foods);
  }
});

app.get('/api/categories', async (_req, res) => {
  try {
    const cats = await listCategories();
    res.json(cats);
  } catch (error) {
    console.error('Categories error:', error);
    res.json(heConfig.categories);
  }
});

// Legacy endpoint kept for backwards compatibility
app.get('/api/foods', async (_req, res) => {
  try {
    const products = await listProducts(false);
    res.json(products);
  } catch {
    res.json(heConfig.foods);
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { customer, address, email, items, total } = req.body;
    if (!customer || !items?.length) {
      res.status(400).json({ error: 'customer and items are required' });
      return;
    }
    const order = await createOrder({ customer, address, email, items, total });
    res.status(201).json(order);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// ─── Admin auth ───────────────────────────────────────────────────────────────
app.use('/api/admin', adminAuth);

// ─── Admin: products ──────────────────────────────────────────────────────────
app.get('/api/admin/products', requireAdmin, async (_req, res) => {
  try {
    const products = await listProducts(true);
    res.json(products);
  } catch (error) {
    console.error('Admin products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.post('/api/admin/products', requireAdmin, async (req, res) => {
  try {
    const product = await createProduct(req.body);
    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.put('/api/admin/products/:id', requireAdmin, async (req, res) => {
  try {
    const updated = await updateProduct(String(req.params.id), req.body);
    res.json(updated);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/admin/products/:id', requireAdmin, async (req, res) => {
  try {
    await deleteProduct(String(req.params.id));
    res.json({ ok: true });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// ─── Admin: categories ────────────────────────────────────────────────────────
app.get('/api/admin/categories', requireAdmin, async (_req, res) => {
  try {
    res.json(await listCategories());
  } catch (error) {
    console.error('Admin categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.post('/api/admin/categories', requireAdmin, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      res.status(400).json({ error: 'name is required' });
      return;
    }
    const { randomUUID } = await import('crypto');
    const cat = await createCategory({ key: randomUUID(), name, priority: 0 });
    res.status(201).json(cat);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

app.delete('/api/admin/categories/:key', requireAdmin, async (req, res) => {
  try {
    const key = String(req.params.key);
    const products = await listProducts(false);
    const inUse = products.some(p => p.category === key);
    if (inUse) {
      res.status(409).json({ error: 'לא ניתן למחוק קטגוריה עם מוצרים פעילים' });
      return;
    }
    await deleteCategory(key);
    res.json({ ok: true });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// ─── Admin: orders ────────────────────────────────────────────────────────────
app.get('/api/admin/orders', requireAdmin, async (req, res) => {
  try {
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const status = req.query.status as string | undefined;
    const orders = await listOrders(
      Array.isArray(from) ? from[0] : from,
      Array.isArray(to) ? to[0] : to,
      Array.isArray(status) ? status[0] : status,
    );
    res.json(orders);
  } catch (error) {
    console.error('List orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.put('/api/admin/orders/:id', requireAdmin, async (req, res) => {
  try {
    const updated = await updateOrder(String(req.params.id), req.body);
    res.json(updated);
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// ─── Admin: stats ─────────────────────────────────────────────────────────────
app.get('/api/admin/stats', requireAdmin, async (req, res) => {
  try {
    const fromDate = req.query.from as string | undefined;
    const toDate = req.query.to as string | undefined;
    const [products, stats] = await Promise.all([
      listProducts(true),
      getOrderStats(fromDate, toDate),
    ]);
    const statsMap = Object.fromEntries(stats.map(s => [s.foodId, s.orderCount]));
    res.json(products.map(p => ({ ...p, orderCount: statsMap[p.id] || 0 })));
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ─── Admin: tables ────────────────────────────────────────────────────────────
app.get('/api/admin/tables', requireAdmin, async (_req, res) => {
  try {
    const heTables = (heConfig as { tables?: Array<{ id: string; tableNumber: number; chairs: number }> }).tables ?? [];
    const reservations = await getTableReservations();
    const resMap = Object.fromEntries(reservations.map(r => [r.tableId, r.occupiedChairs]));
    res.json(heTables.map(t => ({ ...t, availableChairs: t.chairs - (resMap[t.id] || 0) })));
  } catch (error) {
    console.error('Tables error:', error);
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

// ─── Admin: presigned S3 upload URL ──────────────────────────────────────────
app.post('/api/admin/upload-url', requireAdmin, async (req, res) => {
  try {
    const { filename, contentType } = req.body;
    if (!filename || !contentType) {
      res.status(400).json({ error: 'filename and contentType are required' });
      return;
    }
    const result = await getPresignedUploadUrl(filename, contentType);
    res.json(result);
  } catch (error) {
    console.error('Upload URL error:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});
