import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({ region: process.env.AWS_REGION || 'eu-north-1' });

const BUCKET = process.env.IMAGES_BUCKET || '';
const BASE_URL = process.env.IMAGES_BASE_URL || '';

export async function getPresignedUploadUrl(
  filename: string,
  contentType: string,
): Promise<{ uploadUrl: string; imageUrl: string }> {
  if (!BUCKET) {
    throw new Error('IMAGES_BUCKET env var not set');
  }

  const key = `products/${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
  const imageUrl = `${BASE_URL}/${key}`;

  return { uploadUrl, imageUrl };
}
