# Azure Blob Storage Migration Guide

This document outlines the steps to migrate from Vercel Blob Storage to Azure Blob Storage.

## Prerequisites

1. Azure Storage Account with a container created
2. Storage Account connection string
3. `@azure/storage-blob` package installed

## Configuration

Update your `.env` file with the following Azure Storage settings:

```env
# Azure Storage
AZURE_STORAGE_ACCOUNT_NAME=your_storage_account_name
AZURE_STORAGE_ACCOUNT_KEY=your_storage_account_key
AZURE_STORAGE_CONNECTION_STRING=your_connection_string
AZURE_STORAGE_CONTAINER_NAME=your_container_name
```

## Migration Steps

1. **Install Dependencies**
   ```bash
   npm install @azure/storage-blob
   ```

2. **Run the Migration Script**
   ```bash
   npx tsx scripts/migrate-to-azure.ts
   ```

   This will:
   - Find all candidates with CVs
   - Download each CV from Vercel Blob Storage
   - Upload to Azure Blob Storage
   - Update the candidate records with the new blob references

3. **Verify Migration**
   - Check the console output for any errors
   - Verify files in the Azure Storage container
   - Test file uploads and downloads in the application

## Rollback Plan

If you need to roll back:

1. Revert your code changes
2. Update the database to point back to the original blob references
3. Ensure Vercel Blob Storage still has the original files

## Post-Migration

After successful migration, you can:

1. Remove the `@vercel/blob` package if not used elsewhere
2. Clean up old Vercel Blob Storage files
3. Monitor Azure Storage metrics for performance and costs

## Troubleshooting

- **Missing Files**: If files are missing from Azure after migration, check the migration script logs for any errors.
- **Permissions**: Ensure the Azure Storage account has the correct permissions for read/write operations.
- **Connection Issues**: Verify the connection string and container name in your environment variables.
