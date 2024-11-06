import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT || 'http://localhost:9500',
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || 'minioadmin',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || 'minioadmin',
  },
  forcePathStyle: true,
});

const BUCKET_NAME = 'candidates-cvs';
const TEST_FILE_KEY = 'test/test-file.txt';
const TEST_CONTENT = 'This is a test file for MinIO connectivity check.';

async function testMinioConnection() {
  try {
    console.log('Testing MinIO connection...');

    // Test file upload
    console.log('Uploading test file...');
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: TEST_FILE_KEY,
      Body: TEST_CONTENT,
    }));

    // Test file download
    console.log('Downloading test file...');
    const response = await s3Client.send(new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: TEST_FILE_KEY,
    }));

    const content = await response.Body.transformToString();
    console.log('Downloaded content:', content);

    if (content === TEST_CONTENT) {
      console.log('MinIO test completed successfully!');
    } else {
      throw new Error('Content mismatch');
    }
  } catch (error) {
    console.error('MinIO test failed:', error);
    process.exit(1);
  }
}

testMinioConnection();
