import { S3Client, ListBucketsCommand, CreateBucketCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: "auto",
  endpoint: "http://localhost:9010",
  credentials: {
    accessKeyId: "minioadmin",
    secretAccessKey: "minioadmin"
  },
  forcePathStyle: true
});

async function testMinIO() {
  try {
    // Try to create the bucket
    await s3Client.send(new CreateBucketCommand({ Bucket: "cvs" }));
    console.log("Bucket 'cvs' created successfully");

    // List buckets to verify
    const { Buckets } = await s3Client.send(new ListBucketsCommand({}));
    console.log("Available buckets:", Buckets);
  } catch (error) {
    console.error("Error:", error);
  }
}

testMinIO();
