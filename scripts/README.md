# CV Data Recovery Scripts

This directory contains scripts to recover lost candidate data by reprocessing CVs from Azure Blob Storage.

## Quick Start

1. **Install dependencies:**
   ```bash
   cd scripts
   npm install
   ```

2. **Run the recovery script:**
   ```bash
   npm run recover
   ```

## Recovery Process

The script performs the following steps:

1. **Lists all CV files** from Azure Blob Storage (PDF, DOC, DOCX)
2. **Downloads each CV** to a temporary directory
3. **Processes CVs in batches** through your existing `/api/cv/upload-and-process` endpoint
4. **Handles job assignment** (defaults to General job: `wpx5injoqsa3dhtca3jh15no`)
5. **Generates a detailed report** with success/failure statistics

## What Gets Recovered

- ✅ **Personas** (name, email, phone, location, LinkedIn)
- ✅ **Candidates** (linked to correct jobs with ratings)
- ✅ **CV Records** (parsed content, file URLs)
- ✅ **Process Steps** (initial step created for new candidates)
- ✅ **Referees** (extracted from CVs)
- ✅ **CV Embeddings** (created asynchronously)

## Configuration

### Environment Variables (Required)
```env
AZURE_STORAGE_CONNECTION_STRING=your_connection_string
AZURE_STORAGE_CONTAINER_NAME=your_container_name
INTERNAL_API_KEY=your_internal_api_key
NEXT_PUBLIC_API_URL=http://localhost:3000  # Optional, defaults to localhost:3000
```

### Command Line Options
```bash
# Custom batch size (default: 5)
npm run recover -- --batchSize 3

# Custom delay between batches (default: 2000ms)
npm run recover -- --delay 3000

# Custom default job ID
npm run recover -- --jobId your-job-id-here

# Show help
npm run recover:help
```

## Safety Features

- **Batch Processing**: Processes CVs in small batches to respect API rate limits
- **Error Handling**: Continues processing even if individual CVs fail
- **Retry Logic**: Automatically retries failed API calls up to 3 times
- **Deduplication**: Existing candidates won't be duplicated (will be updated with new CVs)
- **Detailed Logging**: Shows progress and saves detailed report to `temp/recovery-report.json`

## Example Output

```
🚀 Starting CV Recovery Process...
📁 Container: cv-storage
🔧 Batch Size: 5
⏱️  Delay Between Batches: 2000ms

📋 Listing CV files from Azure Blob Storage...
✅ Found 47 CV files to process

📦 Processing Batch 1/10 (5 files)
  ✅ john-doe-cv.pdf - Processed successfully
  ✅ jane-smith-resume.docx - Processed successfully
  ❌ corrupted-file.pdf - Error: Failed to parse CV
  ✅ mike-johnson-cv.pdf - Processed successfully
  ✅ sarah-wilson-resume.doc - Processed successfully

⏳ Waiting 2000ms before next batch...

============================================================
📊 RECOVERY PROCESS SUMMARY
============================================================
✅ Successfully Processed: 43
❌ Errors: 4
📈 Success Rate: 91.5%

📄 Detailed report saved to: ../temp/recovery-report.json
============================================================
```

## Troubleshooting

### Common Issues

1. **"Missing required environment variables"**
   - Ensure all required env vars are set in your `.env` file

2. **"API call failed: 401"**
   - Check your `INTERNAL_API_KEY` is correct

3. **"Error listing blobs"**
   - Verify Azure storage connection string and container name

4. **High error rate**
   - Try reducing batch size: `--batchSize 2`
   - Increase delay: `--delay 5000`

### Manual Recovery

If you need to process specific files only:

1. Modify the `listCvFiles()` method to filter by filename patterns
2. Or create a custom job ID mapping in `determineJobId()` method

## Files Created

- `temp/recovery/` - Temporary CV downloads (cleaned up automatically)
- `temp/recovery-report.json` - Detailed processing report
