import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import bcrypt from 'bcryptjs';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: process.env.AWS_ACCESS_KEY_ID ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  } : undefined,
});

const docClient = DynamoDBDocumentClient.from(client);

async function seedAdmin() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  if (!process.env.AWS_ACCESS_KEY_ID) {
    console.error('AWS_ACCESS_KEY_ID not set. Please set environment variables.');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await docClient.send(new PutCommand({
    TableName: 'Admins',
    Item: {
      username,
      passwordHash,
    },
  }));

  console.log(`Admin user "${username}" created successfully!`);
}

seedAdmin().catch(console.error);
