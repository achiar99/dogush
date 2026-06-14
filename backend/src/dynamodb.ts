import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'eu-north-1',
});

export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

const ENV            = process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
const ADMINS_TABLE   = process.env.ADMINS_TABLE   || `pet-store-${ENV}-Admins`;
const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || `pet-store-${ENV}-Products`;
const ORDERS_TABLE   = process.env.ORDERS_TABLE   || `pet-store-${ENV}-Orders`;

// ─── Admin ────────────────────────────────────────────────────────────────────
export interface AdminUser {
  username: string;
  passwordHash: string;
}

export async function getAdminByUsername(username: string): Promise<AdminUser | null> {
  const result = await docClient.send(
    new GetCommand({ TableName: ADMINS_TABLE, Key: { username } }),
  );
  return (result.Item as AdminUser) ?? null;
}

// ─── Products ─────────────────────────────────────────────────────────────────
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  active: boolean;
  imageFile?: string;
}

export async function listProducts(includeInactive = false): Promise<Product[]> {
  const result = await docClient.send(new ScanCommand({ TableName: PRODUCTS_TABLE }));
  const items = (result.Items || []) as Product[];
  return includeInactive ? items : items.filter(p => p.active);
}

export async function getProduct(id: string): Promise<Product | null> {
  const result = await docClient.send(
    new GetCommand({ TableName: PRODUCTS_TABLE, Key: { id } }),
  );
  return (result.Item as Product) ?? null;
}

export async function createProduct(data: Omit<Product, 'id'>): Promise<Product> {
  const product: Product = { ...data, id: randomUUID() };
  await docClient.send(new PutCommand({ TableName: PRODUCTS_TABLE, Item: product }));
  return product;
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
  const fields = Object.entries(updates).filter(([k]) => k !== 'id');
  const exprParts = fields.map(([k], i) => `#f${i} = :v${i}`);
  const names: Record<string, string> = {};
  const values: Record<string, unknown> = {};
  fields.forEach(([k, v], i) => {
    names[`#f${i}`] = k;
    values[`:v${i}`] = v;
  });

  const result = await docClient.send(
    new UpdateCommand({
      TableName: PRODUCTS_TABLE,
      Key: { id },
      UpdateExpression: `SET ${exprParts.join(', ')}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: 'ALL_NEW',
    }),
  );
  return result.Attributes as Product;
}

export async function deleteProduct(id: string): Promise<void> {
  await docClient.send(new DeleteCommand({ TableName: PRODUCTS_TABLE, Key: { id } }));
}

// ─── Orders ───────────────────────────────────────────────────────────────────
export interface OrderItem {
  id: string;
  quantity: number;
}

export interface Order {
  orderId: string;
  customer: string;
  address?: string;
  email?: string;
  items: OrderItem[];
  total: number;
  status: 'open' | 'inProgress' | 'completed' | 'cancelled';
  createdAt: string;
}

export async function createOrder(data: Omit<Order, 'orderId' | 'status' | 'createdAt'>): Promise<Order> {
  const n = await nextCounter('orders');
  const order: Order = {
    ...data,
    orderId: formatOrderId(n),
    status: 'open',
    createdAt: new Date().toISOString(),
  };
  await docClient.send(new PutCommand({ TableName: ORDERS_TABLE, Item: order }));
  return order;
}

export async function listOrders(fromDate?: string, toDate?: string, status?: string): Promise<Order[]> {
  const result = await docClient.send(new ScanCommand({ TableName: ORDERS_TABLE }));
  let orders = (result.Items || []) as Order[];

  if (fromDate) {
    orders = orders.filter(o => o.createdAt >= fromDate);
  }
  if (toDate) {
    orders = orders.filter(o => o.createdAt <= toDate + 'T23:59:59.999Z');
  }
  if (status) {
    orders = orders.filter(o => o.status === status);
  }

  return orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getOrder(orderId: string): Promise<Order | null> {
  const result = await docClient.send(
    new GetCommand({ TableName: ORDERS_TABLE, Key: { orderId } }),
  );
  return (result.Item as Order) ?? null;
}

export async function updateOrder(orderId: string, updates: Partial<Order>): Promise<Order> {
  const fields = Object.entries(updates).filter(([k]) => k !== 'orderId');
  const exprParts = fields.map(([k], i) => `#f${i} = :v${i}`);
  const names: Record<string, string> = {};
  const values: Record<string, unknown> = {};
  fields.forEach(([k, v], i) => {
    names[`#f${i}`] = k;
    values[`:v${i}`] = v;
  });

  const result = await docClient.send(
    new UpdateCommand({
      TableName: ORDERS_TABLE,
      Key: { orderId },
      UpdateExpression: `SET ${exprParts.join(', ')}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: 'ALL_NEW',
    }),
  );
  return result.Attributes as Order;
}

// ─── Counters ─────────────────────────────────────────────────────────────────
const COUNTERS_TABLE = process.env.COUNTERS_TABLE || `pet-store-${ENV}-Counters`;

async function nextCounter(name: string): Promise<number> {
  const result = await docClient.send(new UpdateCommand({
    TableName: COUNTERS_TABLE,
    Key: { name },
    UpdateExpression: 'ADD #val :one',
    ExpressionAttributeNames: { '#val': 'value' },
    ExpressionAttributeValues: { ':one': 1 },
    ReturnValues: 'UPDATED_NEW',
  }));
  return result.Attributes!.value as number;
}

function formatOrderId(n: number): string {
  return String(n).padStart(7, '0');
}

// ─── Categories ───────────────────────────────────────────────────────────────
const CATEGORIES_TABLE = process.env.CATEGORIES_TABLE || `pet-store-${ENV}-Categories`;

export interface Category {
  key: string;
  name: string;
  priority: number;
}

export async function listCategories(): Promise<Category[]> {
  const result = await docClient.send(new ScanCommand({ TableName: CATEGORIES_TABLE }));
  const items = (result.Items || []) as Category[];
  return items.sort((a, b) => a.priority - b.priority);
}

export async function createCategory(data: Category): Promise<Category> {
  await docClient.send(new PutCommand({ TableName: CATEGORIES_TABLE, Item: data }));
  return data;
}

export async function deleteCategory(key: string): Promise<void> {
  await docClient.send(new DeleteCommand({ TableName: CATEGORIES_TABLE, Key: { key } }));
}

// ─── Legacy stats (for dashboard) ────────────────────────────────────────────
export interface OrderStats {
  foodId: string;
  orderCount: number;
}

export async function getOrderStats(fromDate?: string, toDate?: string): Promise<OrderStats[]> {
  try {
    const orders = await listOrders(fromDate, toDate);
    const countMap = new Map<string, number>();
    for (const order of orders) {
      for (const item of order.items || []) {
        countMap.set(item.id, (countMap.get(item.id) || 0) + 1);
      }
    }
    return Array.from(countMap.entries()).map(([foodId, orderCount]) => ({ foodId, orderCount }));
  } catch (error) {
    console.error('DynamoDB error:', error);
    return [];
  }
}

// ─── Reservations (legacy) ────────────────────────────────────────────────────
export interface TableReservation {
  tableId: string;
  occupiedChairs: number;
}

export async function getTableReservations(): Promise<TableReservation[]> {
  const RESERVATIONS_TABLE = 'pet-store-Reservations';
  try {
    const result = await docClient.send(new ScanCommand({ TableName: RESERVATIONS_TABLE }));
    const countMap = new Map<string, number>();
    for (const res of result.Items || []) {
      const tableId = res.tableId as string;
      countMap.set(tableId, (countMap.get(tableId) || 0) + ((res.occupiedChairs as number) || 0));
    }
    return Array.from(countMap.entries()).map(([tableId, occupiedChairs]) => ({ tableId, occupiedChairs }));
  } catch {
    return [];
  }
}
