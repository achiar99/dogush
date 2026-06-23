/**
 * Creates or updates the admin user in DynamoDB.
 * Usage:  ADMIN_USERNAME=admin ADMIN_PASSWORD=secret npm run seed-admin -w backend
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import bcrypt from 'bcryptjs';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'eu-north-1' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE    = process.env.ADMINS_TABLE || 'pet-store-dev-Admins';
const username = process.env.ADMIN_USERNAME || 'admin';
const password = process.env.ADMIN_PASSWORD;
if (!password) {
  console.error('ERROR: ADMIN_PASSWORD environment variable is required');
  process.exit(1);
}

async function seed() {
  const passwordHash = await bcrypt.hash(password!, 10);
  await docClient.send(new PutCommand({ TableName: TABLE, Item: { username, passwordHash } }));
  console.log(`✓ Admin "${username}" upserted in ${TABLE}`);
}

seed().catch(err => { console.error(err); process.exit(1); });
