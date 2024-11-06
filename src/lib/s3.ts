import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: 'us-east-1', // MinIO default region
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true, // Required for MinIO
});

const BUCKET_NAME = 'candidates-cvs';

export async function createPresignedUploadUrl(key: string) {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  try {
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return signedUrl;
  } catch (err) {
    console.error('Error creating presigned URL:', err);
    throw new Error('Failed to create upload URL');
  }
}

export async function getDownloadUrl(key: string) {
  return `${process.env.S3_ENDPOINT}/${BUCKET_NAME}/${key}`;
}
