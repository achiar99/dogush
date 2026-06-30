import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';

// ── Mock DynamoDB so no AWS calls are made ────────────────────────────────────
const mockDb: Record<string, any> = {};

vi.mock('../dynamodb', () => ({
  get docClient() { return {}; },
  listProducts: vi.fn(),
  getProduct: vi.fn(),
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
  listOrders: vi.fn(),
  createOrder: vi.fn(),
  updateOrder: vi.fn(),
  getOrderStats: vi.fn(),
  getTableReservations: vi.fn(),
  listCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
  getUserByEmail: vi.fn(),
  getUserById: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  listUsers: vi.fn(),
  listOrdersByUser: vi.fn(),
  getOrder: vi.fn(),
  recordPageView: vi.fn(),
  listPageViews: vi.fn(),
  getAdminByUsername: vi.fn(),
  OutOfStockError: class OutOfStockError extends Error {
    productId: string;
    constructor(productId: string) { super('out of stock'); this.productId = productId; }
  },
}));

vi.mock('../s3', () => ({
  getPresignedUploadUrl: vi.fn(),
}));

// Import app after mocks are set up
import { app } from '../app';
import * as db from '../dynamodb';

// ── Health ────────────────────────────────────────────────────────────────────
describe('GET /health', () => {
  it('returns 200 ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

// ── Input validation — /api/auth/register ─────────────────────────────────────
describe('POST /api/auth/register — input validation', () => {
  beforeEach(() => {
    vi.mocked(db.getUserByEmail).mockResolvedValue(null);
    vi.mocked(db.createUser).mockResolvedValue({
      userId: 'u1',
      email: 'test@example.com',
      name: 'Test User',
      phone: '',
      address: '',
      passwordHash: '',
      createdAt: new Date().toISOString(),
    });
  });

  it('rejects missing email', async () => {
    const res = await request(app).post('/api/auth/register').send({ password: 'abc123', name: 'Test' });
    expect(res.status).toBe(400);
  });

  it('rejects invalid email format', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'not-an-email', password: 'abc123', name: 'Test' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/אימייל/);
  });

  it('rejects password shorter than 6 chars', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'a@b.com', password: '123', name: 'Test' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/סיסמה/);
  });

  it('rejects empty name', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'a@b.com', password: 'abc123', name: '' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/שם/);
  });

  it('returns 409 when email already exists', async () => {
    vi.mocked(db.getUserByEmail).mockResolvedValue({
      userId: 'existing', email: 'a@b.com', name: 'Existing', passwordHash: '', phone: '', address: '', createdAt: '',
    });
    const res = await request(app).post('/api/auth/register').send({ email: 'a@b.com', password: 'abc123', name: 'Test' });
    expect(res.status).toBe(409);
  });

  it('returns 201 with token on success', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'new@example.com', password: 'abc123', name: 'New User' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('test@example.com');
  });
});

// ── Input validation — /api/auth/login ───────────────────────────────────────
describe('POST /api/auth/login — input validation', () => {
  it('rejects missing credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });

  it('rejects invalid email', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'bad', password: 'abc123' });
    expect(res.status).toBe(400);
  });

  it('returns 401 when user not found', async () => {
    vi.mocked(db.getUserByEmail).mockResolvedValue(null);
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.com', password: 'abc123' });
    expect(res.status).toBe(401);
  });

  it('returns 401 on wrong password', async () => {
    vi.mocked(db.getUserByEmail).mockResolvedValue({
      userId: 'u1', email: 'a@b.com', name: 'A', passwordHash: await bcrypt.hash('correct123', 10), phone: '', address: '', createdAt: '',
    });
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.com', password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });

  it('returns token on correct credentials', async () => {
    vi.mocked(db.getUserByEmail).mockResolvedValue({
      userId: 'u1', email: 'a@b.com', name: 'A', passwordHash: await bcrypt.hash('abc123', 10), phone: '', address: '', createdAt: '',
    });
    const res = await request(app).post('/api/auth/login').send({ email: 'a@b.com', password: 'abc123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });
});

// ── Admin middleware ──────────────────────────────────────────────────────────
describe('Admin routes — requireAdmin middleware', () => {
  it('returns 401 with no token', async () => {
    const res = await request(app).get('/api/admin/products');
    expect(res.status).toBe(401);
  });

  it('returns 401 with invalid token', async () => {
    const res = await request(app).get('/api/admin/products').set('Authorization', 'Bearer garbage');
    expect(res.status).toBe(401);
  });

  it('returns 403 when token is not admin role', async () => {
    const jwt = await import('jsonwebtoken');
    const token = jwt.sign({ userId: 'u1' }, process.env.JWT_SECRET!);
    const res = await request(app).get('/api/admin/products').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('passes through with valid admin token', async () => {
    vi.mocked(db.listProducts).mockResolvedValue([]);
    const jwt = await import('jsonwebtoken');
    const token = jwt.sign({ username: 'admin', role: 'admin' }, process.env.JWT_SECRET!);
    const res = await request(app).get('/api/admin/products').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});

// ── Orders — validation & price calculation ───────────────────────────────────
describe('POST /api/orders', () => {
  it('rejects empty items array', async () => {
    const res = await request(app).post('/api/orders').send({ customer: 'Test', items: [] });
    expect(res.status).toBe(400);
  });

  it('rejects missing customer', async () => {
    const res = await request(app).post('/api/orders').send({ customer: '', items: [{ id: 'p1', quantity: 1 }] });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/לקוח/);
  });

  it('rejects invalid email', async () => {
    vi.mocked(db.getProduct).mockResolvedValue({ id: 'p1', name: 'Burger', price: 50, category: 'food', active: true, description: '' });
    const res = await request(app).post('/api/orders').send({ customer: 'Test', email: 'bad-email', items: [{ id: 'p1', quantity: 1 }] });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/אימייל/);
  });

  it('rejects non-existent product', async () => {
    vi.mocked(db.getProduct).mockResolvedValue(null);
    const res = await request(app).post('/api/orders').send({ customer: 'Test', items: [{ id: 'nonexistent', quantity: 1 }] });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/מוצר/);
  });

  it('calculates total server-side and creates order', async () => {
    vi.mocked(db.getProduct).mockResolvedValue({ id: 'p1', name: 'Burger', price: 50, category: 'food', active: true, description: '' });
    vi.mocked(db.createOrder).mockResolvedValue({
      orderId: 'ord1', customer: 'Test', items: [{ id: 'p1', quantity: 2 }], total: 100, status: 'pending', createdAt: new Date().toISOString(),
    } as any);
    const res = await request(app).post('/api/orders').send({ customer: 'Test', items: [{ id: 'p1', quantity: 2 }] });
    expect(res.status).toBe(201);
    expect(db.createOrder).toHaveBeenCalledWith(expect.objectContaining({ total: 100 }));
  });
});

// ── 404 catch-all ─────────────────────────────────────────────────────────────
describe('unknown routes', () => {
  it('returns 404', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
  });
});
