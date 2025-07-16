import { BlobServiceClient, BlockBlobClient } from '@azure/storage-blob';

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING!;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME!;

const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
const containerClient = blobServiceClient.getContainerClient(containerName);

export async function uploadFile(file: File): Promise<string> {
  const blobName = `${Date.now()}-${file.name}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  const arrayBuffer = await file.arrayBuffer();
  await blockBlobClient.upload(arrayBuffer, arrayBuffer.byteLength, {
    blobHTTPHeaders: { blobContentType: file.type },
  });

  return blockBlobClient.url;
}

export function getBlobUrl(blobName: string): string {
  const blobClient = containerClient.getBlobClient(blobName);
  return blobClient.url;
}

export async function deleteBlob(blobName: string): Promise<void> {
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.deleteIfExists();
}
