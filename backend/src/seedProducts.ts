/**
 * Seeds the Products DynamoDB table from shared/he.json.
 * Safe to re-run — PutItem overwrites existing items.
 * Usage:  PRODUCTS_TABLE=pet-store-dev-Products npm run seed-products -w backend
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import heConfig from '../../shared/he.json';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'eu-north-1' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE = process.env.PRODUCTS_TABLE || 'pet-store-dev-Products';

async function seed() {
  const foods = (heConfig as { foods: Array<{ id: string; name: string; description: string; price: number; category: string; active: boolean; imageFile?: string }> }).foods;
  console.log(`Seeding ${foods.length} products into ${TABLE}...`);
  for (const food of foods) {
    await docClient.send(new PutCommand({ TableName: TABLE, Item: food }));
    console.log(`  ✓ ${food.name} (${food.id})`);
  }
  console.log('Done!');
}

seed().catch(err => { console.error(err); process.exit(1); });
