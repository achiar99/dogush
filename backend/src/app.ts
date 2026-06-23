import bcrypt from 'bcryptjs';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
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
  updateCategory,
  deleteCategory,
  getUserByEmail,
  getUserById,
  createUser,
  updateUser,
  listUsers,
  listOrdersByUser,
  getOrder,
  OutOfStockError,
  recordPageView,
  listPageViews,
} from './dynamodb';
import { getPresignedUploadUrl } from './s3';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import heConfig from '../../shared/he.json';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set');
  process.exit(1);
}
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '463119481219-u3u4o1ciif29aeus545hiibs7fhd98dt.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const snsClient = new SNSClient({ region: process.env.AWS_REGION || 'eu-north-1' });

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

async function sendTelegram(text: string) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) return;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: 'HTML' }),
    });
  } catch (e) {
    console.error('Telegram notify error:', e);
  }
}

async function notifyNewOrder(order: { orderId: string; customer: string; total: number; items: unknown[] }) {
  const topicArn = process.env.NEW_ORDER_TOPIC_ARN;
  if (topicArn) {
    try {
      await snsClient.send(new PublishCommand({
        TopicArn: topicArn,
        Subject: `הזמנה חדשה #${order.orderId}`,
        Message: `הזמנה חדשה התקבלה!\n\nמספר: #${order.orderId}\nלקוח: ${order.customer}\nסכום: ₪${order.total}\nפריטים: ${order.items.length}`,
      }));
    } catch (e) {
      console.error('SNS notify error:', e);
    }
  }
  await sendTelegram(`🛒 <b>הזמנה חדשה!</b>\n\n📦 מספר: <code>#${order.orderId}</code>\n👤 לקוח: ${order.customer}\n💰 סכום: ₪${order.total}\n🔢 פריטים: ${order.items.length}`);
}

async function notifyNewUser(name: string, email: string) {
  await sendTelegram(`👤 <b>משתמש חדש נרשם!</b>\n\n🙋 שם: ${name}\n📧 אימייל: ${email}`);
}

export const app = express();

const ALLOWED_ORIGINS = [
  'https://dogush.co.il',
  'https://www.dogush.co.il',
  'https://dev.dogush.co.il',
  'http://localhost:5173',
  'http://localhost:5174',
];

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '100kb' }));

// ─── Input validation helpers ─────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;
const isValidEmail = (v: unknown) => typeof v === 'string' && EMAIL_RE.test(v) && v.length <= 254;
const isValidPassword = (v: unknown) => typeof v === 'string' && v.length >= 6 && v.length <= 128;
const isValidStr = (v: unknown, max = 200) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
const isValidPhone = (v: unknown) => !v || (typeof v === 'string' && v.length <= 20);
const isValidPrice = (v: unknown) => typeof v === 'number' && v >= 0 && v <= 100000 && Number.isFinite(v);

// ─── Rate limiter for auth routes — DynamoDB-backed (works across Lambda instances) ──
import { UpdateCommand as RLUpdateCommand, GetCommand as RLGetCommand } from '@aws-sdk/lib-dynamodb';
const RL_TABLE = process.env.RATE_LIMIT_TABLE || `pet-store-${process.env.NODE_ENV === 'production' ? 'prod' : 'dev'}-RateLimit`;
const RL_MAX = 10;
const RL_WINDOW_SEC = 15 * 60;

async function authRateLimit(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
  const windowKey = Math.floor(Date.now() / 1000 / RL_WINDOW_SEC); // changes every 15 min
  const pk = `${ip}#${windowKey}`;
  const ttl = Math.floor(Date.now() / 1000) + RL_WINDOW_SEC * 2;
  try {
    const { docClient } = await import('./dynamodb');
    const result = await docClient.send(new RLUpdateCommand({
      TableName: RL_TABLE,
      Key: { pk },
      UpdateExpression: 'ADD #c :one SET #ttl = if_not_exists(#ttl, :ttl)',
      ExpressionAttributeNames: { '#c': 'count', '#ttl': 'ttl' },
      ExpressionAttributeValues: { ':one': 1, ':ttl': ttl },
      ReturnValues: 'UPDATED_NEW',
    }));
    const count = result.Attributes?.count as number;
    if (count > RL_MAX) {
      res.status(429).json({ error: 'יותר מדי ניסיונות. נסה שוב בעוד 15 דקות.' });
      return;
    }
  } catch {
    // If DynamoDB is unreachable, fail open (don't block legitimate traffic)
  }
  next();
}

// ─── Auth middleware ──────────────────────────────────────────────────────────
function getRequestUser(req: express.Request): { userId: string } | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET!) as { userId?: string; username?: string };
    if (decoded.userId) return { userId: decoded.userId };
    return null;
  } catch {
    return null;
  }
}

function requireUser(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  const user = getRequestUser(req);
  if (!user) { res.status(401).json({ error: 'Unauthorized' }); return; }
  (req as any).userId = user.userId;
  next();
}

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
    const decoded = jwt.verify(token, JWT_SECRET!) as { username?: string; role?: string };
    if (!decoded.username && decoded.role !== 'admin') {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ─── Public routes ────────────────────────────────────────────────────────────

const TRACKING_BLACKLIST = new Set(['147.235.221.45']);

app.post('/api/track', async (req, res) => {
  try {
    const ip = (req.headers['x-forwarded-for'] as string || '').split(',')[0].trim() || req.socket.remoteAddress || '';
    if (TRACKING_BLACKLIST.has(ip)) { res.status(204).end(); return; }
    const { page, source, sessionId, referrer, userAgent, screenWidth, language } = req.body;

    let city: string | undefined;
    let country: string | undefined;
    let region: string | undefined;

    const IPV4_RE = /^(\d{1,3}\.){3}\d{1,3}$/;
    const isPublicIp = ip && IPV4_RE.test(ip) && ip !== '127.0.0.1' && !ip.startsWith('10.') && !ip.startsWith('192.168.') && !ip.startsWith('172.');
    if (isPublicIp) {
      try {
        const geo = await fetch(`http://ip-api.com/json/${ip}?fields=city,country,regionName`);
        if (geo.ok) {
          const g = await geo.json() as { city?: string; country?: string; regionName?: string };
          city = g.city;
          country = g.country;
          region = g.regionName;
        }
      } catch { /* geo lookup is best-effort */ }
    }

    await recordPageView({
      timestamp: new Date().toISOString(),
      page: page || '/',
      source: source || 'direct',
      sessionId: sessionId || '',
      referrer: referrer || '',
      userAgent: userAgent || '',
      screenWidth: Number(screenWidth) || 0,
      language: language || '',
      ip,
      city,
      country,
      region,
    });

    res.status(204).end();
  } catch (error) {
    console.error('Track error:', error);
    res.status(204).end();
  }
});

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
    if (!isValidStr(customer, 100)) { res.status(400).json({ error: 'שם לקוח לא תקין' }); return; }
    if (!Array.isArray(items) || items.length === 0 || items.length > 100) { res.status(400).json({ error: 'פריטים לא תקינים' }); return; }
    if (!isValidPrice(total)) { res.status(400).json({ error: 'סכום לא תקין' }); return; }
    if (email && !isValidEmail(email)) { res.status(400).json({ error: 'אימייל לא תקין' }); return; }
    if (address && !isValidStr(address, 200)) { res.status(400).json({ error: 'כתובת לא תקינה' }); return; }
    const userClaim = getRequestUser(req);
    const order = await createOrder({ customer, address, email, items, total, ...(userClaim ? { userId: userClaim.userId } : {}) });
    notifyNewOrder(order);
    res.status(201).json(order);
  } catch (error) {
    if (error instanceof OutOfStockError) {
      res.status(409).json({ error: 'out_of_stock', productId: error.productId });
      return;
    }
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// ─── User auth ────────────────────────────────────────────────────────────────
app.post('/api/auth/register', authRateLimit, async (req, res) => {
  try {
    const { email, password, name, phone, address } = req.body;
    if (!isValidEmail(email)) { res.status(400).json({ error: 'אימייל לא תקין' }); return; }
    if (!isValidPassword(password)) { res.status(400).json({ error: 'סיסמה חייבת להיות 6-128 תווים' }); return; }
    if (!isValidStr(name, 100)) { res.status(400).json({ error: 'שם לא תקין' }); return; }
    if (!isValidPhone(phone)) { res.status(400).json({ error: 'מספר טלפון לא תקין' }); return; }
    const existing = await getUserByEmail(email.toLowerCase());
    if (existing) { res.status(409).json({ error: 'כתובת האימייל כבר בשימוש' }); return; }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser({ email: email.toLowerCase(), passwordHash, name, phone, address });
    const token = jwt.sign({ userId: user.userId }, JWT_SECRET!, { expiresIn: '30d' });
    await notifyNewUser(user.name, user.email);
    res.status(201).json({ token, user: { userId: user.userId, email: user.email, name: user.name, phone: user.phone, address: user.address } });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/google', async (req, res) => {
  try {
    const { accessToken, email: emailFromClient, name: nameFromClient } = req.body;
    if (!accessToken) { res.status(400).json({ error: 'accessToken required' }); return; }
    // Verify access token with Google and validate audience
    const tokenInfoRes = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(accessToken)}`);
    const tokenInfo = await tokenInfoRes.json() as { error?: string; email?: string; aud?: string; azp?: string };
    if (tokenInfo.error || !tokenInfo.email) {
      res.status(401).json({ error: 'Invalid Google token' }); return;
    }
    const tokenAudience = tokenInfo.aud || tokenInfo.azp;
    if (tokenAudience !== GOOGLE_CLIENT_ID) {
      res.status(401).json({ error: 'Invalid Google token audience' }); return;
    }
    const email = tokenInfo.email.toLowerCase();
    let user = await getUserByEmail(email);
    const isNew = !user;
    if (!user) {
      user = await createUser({
        email,
        passwordHash: '',
        name: nameFromClient || emailFromClient?.split('@')[0] || email.split('@')[0],
        phone: '',
        address: '',
      });
    }
    if (isNew) await notifyNewUser(user.name, user.email);
    const token = jwt.sign({ userId: user.userId }, JWT_SECRET!, { expiresIn: '30d' });
    res.json({ token, user: { userId: user.userId, email: user.email, name: user.name, phone: user.phone, address: user.address } });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ error: 'Google authentication failed' });
  }
});

app.post('/api/auth/login', authRateLimit, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!isValidEmail(email) || !isValidPassword(password)) { res.status(400).json({ error: 'אימייל או סיסמה לא תקינים' }); return; }
    const user = await getUserByEmail(email.toLowerCase());
    if (!user) { res.status(401).json({ error: 'אימייל או סיסמה שגויים' }); return; }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) { res.status(401).json({ error: 'אימייל או סיסמה שגויים' }); return; }
    const token = jwt.sign({ userId: user.userId }, JWT_SECRET!, { expiresIn: '30d' });
    res.json({ token, user: { userId: user.userId, email: user.email, name: user.name, phone: user.phone, address: user.address } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/me', requireUser, async (req, res) => {
  try {
    const user = await getUserById((req as any).userId);
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    res.json({ userId: user.userId, email: user.email, name: user.name, phone: user.phone, address: user.address });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/auth/me', requireUser, async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    if (!isValidStr(name, 100)) { res.status(400).json({ error: 'שם לא תקין' }); return; }
    if (!isValidPhone(phone)) { res.status(400).json({ error: 'מספר טלפון לא תקין' }); return; }
    if (address && !isValidStr(address, 200)) { res.status(400).json({ error: 'כתובת לא תקינה' }); return; }
    const updated = await updateUser((req as any).userId, { name, phone, address });
    res.json({ userId: updated.userId, email: updated.email, name: updated.name, phone: updated.phone, address: updated.address });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/orders/my', requireUser, async (req, res) => {
  try {
    const orders = await listOrdersByUser((req as any).userId);
    res.json(orders);
  } catch (error) {
    console.error('My orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await getOrder(String(req.params.id));
    if (!order) { res.status(404).json({ error: 'Not found' }); return; }
    const userClaim = getRequestUser(req);
    // Allow only the order owner (or guest orders with no userId)
    if (order.userId && (!userClaim || userClaim.userId !== order.userId)) {
      res.status(403).json({ error: 'Forbidden' }); return;
    }
    const { email: _email, userId: _userId, ...safe } = order as any;
    res.json(safe);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order' });
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

app.put('/api/admin/categories/:key', requireAdmin, async (req, res) => {
  try {
    const key = String(req.params.key);
    const { name, priority } = req.body;
    const updated = await updateCategory(key, {
      ...(name !== undefined ? { name } : {}),
      ...(priority !== undefined ? { priority: Number(priority) } : {}),
    });
    res.json(updated);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Failed to update category' });
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

// ─── Admin: users ────────────────────────────────────────────────────────────
app.get('/api/admin/users', requireAdmin, async (_req, res) => {
  try {
    const users = await listUsers();
    res.json(users.map(({ passwordHash: _, ...u }) => u));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/admin/users/:id/orders', requireAdmin, async (req, res) => {
  try {
    const orders = await listOrdersByUser(String(req.params.id));
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user orders' });
  }
});

// ─── Admin: analytics ────────────────────────────────────────────────────────
app.get('/api/admin/analytics', requireAdmin, async (req, res) => {
  try {
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const views = await listPageViews(from, to);
    res.json(views);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
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
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);

app.post('/api/admin/upload-url', requireAdmin, async (req, res) => {
  try {
    const { filename, contentType } = req.body;
    if (!filename || !contentType) {
      res.status(400).json({ error: 'filename and contentType are required' });
      return;
    }
    if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
      res.status(400).json({ error: 'סוג קובץ לא מורשה. ניתן להעלות תמונות בלבד.' });
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
