
import 'dotenv/config';
import { BlobServiceClient } from '@azure/storage-blob';
import * as fs from 'fs';
import * as path from 'path';

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = process.env.AZURE_STORAGE_CONTAINER_NAME || 'cvs';
const CV_DIRECTORY = '/home/byte-rose/Documents/Cvs';

async function main() {
  console.log('Starting CV upload process...');
  if (!AZURE_STORAGE_CONNECTION_STRING) {
    throw new Error('AZURE_STORAGE_CONNECTION_STRING environment variable not set');
  }

  const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
  const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
  
  console.log(`Ensuring container '${CONTAINER_NAME}' exists...`);
  await containerClient.createIfNotExists();
  console.log('Container check complete.');

  console.log(`Scanning for PDF files in '${CV_DIRECTORY}'...`);
  const files = await getPdfFiles(CV_DIRECTORY);
  const totalFiles = files.length;
  console.log(`Found ${totalFiles} PDF files to process.`);

  let uploadedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (let index = 0; index < files.length; index++) {
    const file = files[index];
    const blobName = path.basename(file);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const progress = `(${(index + 1)}/${totalFiles})`;

    try {
      const exists = await blockBlobClient.exists();
      if (exists) {
        console.log(`${progress} Skipping '${blobName}' - already exists in the container.`);
        skippedCount++;
      } else {
        console.log(`${progress} Uploading '${blobName}'...`);
        await blockBlobClient.uploadFile(file);
        console.log(`${progress} Successfully uploaded '${blobName}'.`);
        uploadedCount++;
      }
    } catch (error) {
      console.error(`${progress} Failed to upload '${blobName}':`, error);
      failedCount++;
    }
  }

  console.log('\n--- Upload Summary ---');
  console.log(`Total files processed: ${totalFiles}`);
  console.log(`Successfully uploaded: ${uploadedCount}`);
  console.log(`Skipped (already exist): ${skippedCount}`);
  console.log(`Failed to upload: ${failedCount}`);
  console.log('----------------------\n');
}

async function getPdfFiles(dir: string): Promise<string[]> {
  let pdfFiles: string[] = [];
  const files = await fs.promises.readdir(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = await fs.promises.stat(filePath);

    if (stat.isDirectory()) {
      pdfFiles = pdfFiles.concat(await getPdfFiles(filePath));
    } else if (path.extname(filePath).toLowerCase() === '.pdf') {
      pdfFiles.push(filePath);
    }
  }

  return pdfFiles;
}

main().catch((err) => {
  console.error('Error uploading files:', err);
  process.exit(1);
});
