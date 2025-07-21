import { db } from '../src/db';
import { legacyCandidates } from '../src/db/schema';
import { parse } from 'csv-parse';
import * as fs from 'fs';
import * as path from 'path';

const BATCH_SIZE = 100;

// Define the mapping from CSV headers to database columns
// This makes the script robust to column order changes.
const columnMapping: { [key: string]: keyof typeof legacyCandidates.$inferInsert } = {
    'NAME': 'name',
    'PHONE NO': 'phoneNo',
    'EMAIL': 'email',
    'PAID/NOT PAID': 'paymentStatus',
    'GENDER': 'gender',
    'YEARS OF EXPERIENCE': 'yearsOfExperience',
    'POSITION APPLYING 1': 'positionApplying1',
    'POSITION APPLYING 2': 'positionApplying2',
    'POSITION APPLYING 3': 'positionApplying3',
    'DATE OF RECEIVING CV': 'dateOfReceivingCv',
    'HIGHEST EDUCATION': 'highestEducation',
    'QUALIFICATIONS': 'qualifications',
    'UNIVERSITY / INSTITUTION': 'universityOrInstitution',
    'INTERVIEWS': 'interviews',
};

async function main() {
    console.log('Starting legacy candidate import...');

    const csvFilePath = path.resolve(process.cwd(), 'legacy_data.csv');

    if (!fs.existsSync(csvFilePath)) {
        console.error(`Error: CSV file not found at ${csvFilePath}`);
        console.error('Please export your Excel data as "legacy_data.csv" and place it in the project root directory.');
        process.exit(1);
    }

    const parser = fs
        .createReadStream(csvFilePath)
        .pipe(parse({
            columns: true, // Use the first row as headers
            trim: true,
            skip_empty_lines: true,
        }));

    let recordsToInsert: (typeof legacyCandidates.$inferInsert)[] = [];
    let totalImported = 0;

    for await (const row of parser) {
        const newRecord: typeof legacyCandidates.$inferInsert = {};

        for (const csvHeader in columnMapping) {
            if (row[csvHeader] !== undefined) {
                const dbColumn = columnMapping[csvHeader];
                newRecord[dbColumn] = row[csvHeader] || null;
            }
        }

        // Only add if there is an email, as it's a key identifier
        if (newRecord.email) {
            recordsToInsert.push(newRecord);
        }

        if (recordsToInsert.length >= BATCH_SIZE) {
            await db.insert(legacyCandidates).values(recordsToInsert);
            totalImported += recordsToInsert.length;
            console.log(`Imported batch of ${recordsToInsert.length} records. Total: ${totalImported}`);
            recordsToInsert = [];
        }
    }

    // Insert any remaining records
    if (recordsToInsert.length > 0) {
        await db.insert(legacyCandidates).values(recordsToInsert);
        totalImported += recordsToInsert.length;
        console.log(`Imported final batch of ${recordsToInsert.length} records. Total: ${totalImported}`);
    }

    console.log(`\nImport complete! Total legacy candidates imported: ${totalImported}`);
    process.exit(0);
}

main().catch((err) => {
    console.error('An error occurred during the import process:', err);
    process.exit(1);
});
