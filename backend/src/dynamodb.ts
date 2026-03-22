import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: process.env.AWS_ACCESS_KEY_ID ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  } : undefined,
});

export const docClient = DynamoDBDocumentClient.from(client);

export interface AdminUser {
  username: string;
  passwordHash: string;
}

export async function getAdminByUsername(username: string): Promise<AdminUser | null> {
  const command = new GetCommand({
    TableName: 'Admins',
    Key: { username },
  });

  const result = await docClient.send(command);
  return result.Item as AdminUser | null;
}

export interface FoodStats {
  foodId: string;
  orderCount: number;
}

export async function getFoodOrderStats(fromDate?: string, toDate?: string): Promise<FoodStats[]> {
  if (!process.env.AWS_ACCESS_KEY_ID) {
    console.log('AWS credentials not configured, returning empty stats');
    return [];
  }

  try {
    const command = new ScanCommand({
      TableName: 'Orders',
    });

    const result = await docClient.send(command);
    const orders = result.Items || [];
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(toDate + 'T23:59:59') : null;

    const countMap = new Map<string, number>();
    for (const order of orders) {
      if (order.createdAt) {
        const orderDate = new Date(order.createdAt as string);
        if (from && orderDate < from) continue;
        if (to && orderDate > to) continue;
      }
      const foodId = order.foodId as string;
      countMap.set(foodId, (countMap.get(foodId) || 0) + 1);
    }

    return Array.from(countMap.entries()).map(([foodId, orderCount]) => ({
      foodId,
      orderCount,
    }));
  } catch (error) {
    console.error('DynamoDB error:', error);
    return [];
  }
}

export interface TableReservation {
  tableId: string;
  occupiedChairs: number;
}

export async function getTableReservations(): Promise<TableReservation[]> {
  if (!process.env.AWS_ACCESS_KEY_ID) {
    console.log('AWS credentials not configured, returning empty reservations');
    return [];
  }

  try {
    const command = new ScanCommand({
      TableName: 'Reservations',
    });

    const result = await docClient.send(command);
    const reservations = result.Items || [];

    const countMap = new Map<string, number>();
    for (const res of reservations) {
      const tableId = res.tableId as string;
      const chairs = (res.occupiedChairs as number) || 0;
      countMap.set(tableId, (countMap.get(tableId) || 0) + chairs);
    }

    return Array.from(countMap.entries()).map(([tableId, occupiedChairs]) => ({
      tableId,
      occupiedChairs,
    }));
  } catch (error) {
    console.error('DynamoDB error:', error);
    return [];
  }
}
