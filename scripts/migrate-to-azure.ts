import { db } from '../src/db';
import { candidates as candidatesTable } from '../src/db/schema';
import { list } from '@vercel/blob';
import { uploadFile } from '../src/lib/azure-storage';
import { isNotNull, eq } from 'drizzle-orm';

async function migrateCVs() {
  try {
    // Get all candidates with CVs
    const candidates = await db.query.candidates.findMany({
      where: isNotNull(candidatesTable.cvId), // Assuming cvFileKey is now cvId or similar
      columns: {
        id: true,
        cvId: true,
      },
    });

    console.log(`Found ${candidates.length} candidates with CVs to migrate`);

    // List all blobs from Vercel
    const { blobs } = await list();
    const blobMap = new Map(blobs.map(blob => [blob.pathname, blob]));

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    // Process each candidate
    for (const candidate of candidates) {
      try {
        if (!candidate.cvId) { // Adjusted from cvFileKey
          console.log(`Skipping candidate ${candidate.id} - no cvId`);
          skipCount++;
          continue;
        }

        // Check if blob exists in Vercel
        const blob = blobMap.get(candidate.cvId);
        if (!blob) {
          console.log(`Skipping candidate ${candidate.id} - blob not found: ${candidate.cvId}`);
          skipCount++;
          continue;
        }

        console.log(`Migrating CV for candidate ${candidate.id}...`);
        
        // Download the file from Vercel
        const response = await fetch(blob.downloadUrl);
        if (!response.ok) {
          throw new Error(`Failed to download blob: ${blob.downloadUrl}`);
        }
        
        const fileData = await response.blob();
        
        // Upload to Azure
        const newBlobName = await uploadFile(
          new File([fileData], blob.pathname.split('/').pop() || 'cv.pdf', {
            type: (blob as any).contentType || 'application/octet-stream',
          })
        );

        // Update the candidate record
        await db.update(candidatesTable)
          .set({ cvId: newBlobName })
          .where(eq(candidatesTable.id, candidate.id));

        console.log(`Migrated CV for candidate ${candidate.id} to ${newBlobName}`);
        successCount++;
      } catch (error) {
        console.error(`Error migrating candidate ${candidate.id}:`, error);
        errorCount++;
      }
    }

    console.log('\nMigration Summary:');
    console.log(`- Total candidates: ${candidates.length}`);
    console.log(`- Successfully migrated: ${successCount}`);
    console.log(`- Skipped: ${skipCount}`);
    console.log(`- Errors: ${errorCount}`);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    // Drizzle's postgres.js driver manages connections, so no need to disconnect.
    process.exit(0);
  }
}

migrateCVs();
