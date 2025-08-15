#!/usr/bin/env node

/**
 * CV Data Recovery Script
 * 
 * This script recovers lost candidate data by:
 * 1. Listing all CV files in Azure Blob Storage
 * 2. Downloading each CV file
 * 3. Processing them through the existing /api/cv/upload-and-process endpoint
 * 4. Handling job assignment and error recovery
 */

const { BlobServiceClient } = require('@azure/storage-blob');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const FormData = require('form-data');

// Load environment variables from parent directory
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Configuration
const CONFIG = {
  // Azure Storage
  connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
  containerName: process.env.AZURE_STORAGE_CONTAINER_NAME,
  
  // API Configuration
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  internalApiKey: process.env.INTERNAL_API_KEY,
  
  // Processing Configuration
  batchSize: 5, // Process 5 CVs at a time to avoid overwhelming Gemini API
  delayBetweenBatches: 2000, // 2 second delay between batches
  maxRetries: 3,
  
  // File Selection Configuration
  maxFiles: 150, // Limit to most recent 150 files
  sortByDate: true, // Sort by last modified date (newest first)
  
  // Job Assignment
  defaultJobId: 'wpx5injoqsa3dhtca3jh15no', // General job fallback
  
  // Temp directory for downloaded CVs
  tempDir: path.join(__dirname, '../temp/recovery'),
};

// Ensure temp directory exists
if (!fs.existsSync(CONFIG.tempDir)) {
  fs.mkdirSync(CONFIG.tempDir, { recursive: true });
}

class CvRecoveryProcessor {
  constructor() {
    // Debug environment variables
    console.log('🔍 Environment check:');
    console.log(`Connection String: ${CONFIG.connectionString ? 'SET' : 'MISSING'}`);
    console.log(`Container Name: ${CONFIG.containerName || 'MISSING'}`);
    
    if (!CONFIG.connectionString || !CONFIG.containerName) {
      throw new Error('Missing Azure Storage configuration. Check AZURE_STORAGE_CONNECTION_STRING and AZURE_STORAGE_CONTAINER_NAME in .env file');
    }
    
    this.blobServiceClient = BlobServiceClient.fromConnectionString(CONFIG.connectionString);
    this.containerClient = this.blobServiceClient.getContainerClient(CONFIG.containerName);
    this.processedCount = 0;
    this.errorCount = 0;
    this.results = [];
    this.report = {
      succeeded: [],
      failed: [],
    };
  }

  async run() {
    console.log('🚀 Starting CV Recovery Process...');
    console.log(`📁 Container: ${CONFIG.containerName}`);
    console.log(`🔧 Batch Size: ${CONFIG.batchSize}`);
    console.log(`⏱️  Delay Between Batches: ${CONFIG.delayBetweenBatches}ms`);
    console.log(`🌐 API URL: ${CONFIG.apiBaseUrl}`);
    console.log('');

    try {
      // Step 1: List all CV files in Azure Blob Storage
      console.log('📋 Listing CV files from Azure Blob Storage...');
      const allCvFiles = await this.listCvFiles();
      
      // Apply date filtering and limiting
      const cvFiles = CONFIG.maxFiles > 0 
        ? allCvFiles.slice(0, CONFIG.maxFiles)
        : allCvFiles;
      
      console.log(`✅ Found ${allCvFiles.length} total CV files, processing ${cvFiles.length} most recent`);
      
      if (cvFiles.length === 0) {
        console.log('❌ No CV files found in Azure Blob Storage');
        return;
      }
      
      // Show date range of files being processed
      if (cvFiles.length > 0) {
        const newestDate = new Date(cvFiles[0].lastModified).toLocaleDateString();
        const oldestDate = new Date(cvFiles[cvFiles.length - 1].lastModified).toLocaleDateString();
        console.log(`📅 Processing files from ${newestDate} to ${oldestDate}`);
      }

      // Step 2: Process CVs in batches
      console.log(`🔄 Processing CVs in batches of ${CONFIG.batchSize}...`);
      // Pass only the names to avoid race conditions with the file object
      const cvFileNames = cvFiles.map(f => f.name);
      await this.processCvsInBatches(cvFileNames);

      // Step 3: Generate summary report
      this.generateReport();

    } catch (error) {
      console.error('❌ Recovery process failed:', error);
      process.exit(1);
    }
  }

  async listCvFiles() {
    const cvFiles = [];
    // ONLY process PDF files - Gemini doesn't support .docx/.doc
    const allowedExtensions = ['.pdf'];
    
    console.log('🔍 Listing blobs from container (PDF files only)...');
    
    try {
      // Use the simplest possible approach - just like your working azure-storage.ts
      let blobCount = 0;
      let docxCount = 0;
      for await (const blob of this.containerClient.listBlobsFlat()) {
        blobCount++;
        if (blobCount % 100 === 0) {
          console.log(`📄 Processed ${blobCount} blobs...`);
        }
        
        const extension = path.extname(blob.name).toLowerCase();
        
        // Count skipped .docx/.doc files
        if (['.doc', '.docx'].includes(extension)) {
          docxCount++;
        }
        
        if (allowedExtensions.includes(extension)) {
          cvFiles.push({
            name: blob.name,
            lastModified: blob.properties.lastModified,
          });
        }
      }
      
      console.log(`✅ Found ${blobCount} total blobs`);
      console.log(`📝 ${cvFiles.length} PDF files (will process)`);
      if (docxCount > 0) {
        console.log(`⚠️  ${docxCount} Word documents (skipped - Gemini doesn't support .docx/.doc)`);
      }

    } catch (error) {
      console.error('❌ Failed to list blobs from Azure:', error);
      throw error; // Rethrow to stop the script
    }

    // Sort by date and take the most recent ones as defined by maxFiles
    return cvFiles.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
  }

  async processCvsInBatches(cvFileNames) {
    for (let i = 0; i < cvFileNames.length; i += CONFIG.batchSize) {
      const batch = cvFileNames.slice(i, i + CONFIG.batchSize);
      const batchNum = Math.floor(i / CONFIG.batchSize) + 1;
      const totalBatches = Math.ceil(cvFileNames.length / CONFIG.batchSize);

      console.log(`\n📦 Processing Batch ${batchNum}/${totalBatches} (${batch.length} files)`);

      const promises = batch.map(fileName => this.processSingleCv(fileName));
      const batchResults = await Promise.all(promises);

      // Process results atomically after each batch to avoid race conditions
      batchResults.forEach(result => {
        if (result.status === 'success') {
          this.processedCount++;
          this.report.succeeded.push({ name: result.fileName });
        } else {
          this.errorCount++;
          this.report.failed.push({ name: result.fileName, reason: result.reason });
        }
        this.results.push(result);
      });

      if (i + CONFIG.batchSize < cvFileNames.length) {
        console.log(`⏳ Waiting ${CONFIG.delayBetweenBatches}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenBatches));
      }
    }
  }

  async processSingleCv(fileName, attempt = 1) {
    if (attempt > CONFIG.maxRetries) {
      console.error(`  ❌ ${fileName} - Failed after ${CONFIG.maxRetries} attempts.`);
      return { status: 'error', fileName, reason: 'Max retries reached' };
    }

    let tempFilePath = null;
    try {
      // Step 1: Download the file from Azure
      tempFilePath = path.join(CONFIG.tempDir, fileName);
      const blobClient = this.containerClient.getBlobClient(fileName);
      await blobClient.downloadToFile(tempFilePath);
      const fileBuffer = fs.readFileSync(tempFilePath);

      // Step 2: Create FormData for API call
      const formData = new FormData();
      formData.append('file', fileBuffer, { filename: fileName });
      formData.append('jobId', CONFIG.defaultJobId);

      // Step 3: Call the upload-and-process endpoint
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

      const response = await fetch(`${CONFIG.apiBaseUrl}/api/cv/upload-and-process?apiKey=${CONFIG.internalApiKey}`, {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders(),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorBody = await response.text();
        const error = new Error(`API call failed: ${response.status} - ${errorBody}`);
        error.status = response.status;
        throw error;
      }

      const result = await response.json();
      console.log(`  ✅ ${fileName} - Processed successfully`);
      return { status: 'success', fileName, candidate: result };

    } catch (error) {
      console.log(`  🔍 ${fileName} - Debug: Error type: ${error.constructor.name}, Status: ${error.status}, Message: ${error.message}`);

      // Don't retry certain errors that won't be fixed by retrying
      const nonRetryableErrors = [400, 401, 403, 415, 422]; // Bad Request, Unauthorized, Forbidden, Unsupported Media Type, Unprocessable Entity
      if (error.status && nonRetryableErrors.includes(error.status)) {
        const reason = `Non-retryable error: ${error.status}`;
        console.error(`  ⚠️  ${fileName} - ${reason}, skipping.`);
        return { status: 'error', fileName, reason };
      }

      // Retry for other errors
      console.log(`  🔄 ${fileName} - Retrying... (${attempt}/${CONFIG.maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
      return this.processSingleCv(fileName, attempt + 1);
    } finally {
      // Clean up temp file
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  }

  determineJobId(fileName) {
    // You can implement custom logic here to determine job ID based on filename
    // For now, we'll use the default job ID
    return CONFIG.defaultJobId;
  }

  getMimeType(fileName) {
    const extension = path.extname(fileName).toLowerCase();
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
    return mimeTypes[extension] || 'application/octet-stream';
  }

  createBatches(array, batchSize) {
    const batches = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RECOVERY PROCESS SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully Processed: ${this.processedCount}`);
    console.log(`❌ Errors: ${this.errorCount}`);
    
    const totalProcessed = this.processedCount + this.errorCount;
    if (totalProcessed > 0) {
      const successRate = ((this.processedCount / totalProcessed) * 100).toFixed(1);
      console.log(`📈 Success Rate: ${successRate}%`);
    }
    
    if (this.errorCount > 0) {
      console.log('\n❌ FAILED FILES:');
      this.report.failed.forEach(r => console.log(`  • ${r.name}: ${r.reason}`));
    }

    // Save detailed report to file
    const reportPath = path.join(__dirname, '../temp/recovery-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        processed: this.processedCount,
        errors: this.errorCount,
        total: totalProcessed,
        successRate: totalProcessed > 0 ? `${((this.processedCount / totalProcessed) * 100).toFixed(1)}%` : 'N/A',
      },
      results: this.results,
    }, null, 2));
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    console.log('='.repeat(60));
  }
}

// CLI Interface
async function main() {
  // Validate environment variables
  const requiredEnvVars = [
    'AZURE_STORAGE_CONNECTION_STRING',
    'AZURE_STORAGE_CONTAINER_NAME',
    'INTERNAL_API_KEY',
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(`  • ${varName}`));
    process.exit(1);
  }

  // Parse command line arguments
  const args = process.argv.slice(2);
  const options = {};
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    options[key] = value;
  }

  // Override config with CLI options
  if (options.batchSize) CONFIG.batchSize = parseInt(options.batchSize);
  if (options.delay) CONFIG.delayBetweenBatches = parseInt(options.delay);
  if (options.jobId) CONFIG.defaultJobId = options.jobId;
  if (options.maxFiles) CONFIG.maxFiles = parseInt(options.maxFiles);

  // Show help
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
CV Recovery Script Usage:

node scripts/recover-candidates.js [options]

Options:
  --batchSize <number>    Number of CVs to process in parallel (default: 5)
  --delay <number>        Delay between batches in ms (default: 2000)
  --maxFiles <number>     Limit number of files to process (default: 150, 0 = all files)
  --jobId <string>        Default job ID for CV processing (default: wpx5injoqsa3dhtca3jh15no)
  --help, -h              Show this help message

Examples:
  node scripts/recover-candidates.js
  node scripts/recover-candidates.js --maxFiles 50 --batchSize 3
  node scripts/recover-candidates.js --maxFiles 0  # Process all files
  node scripts/recover-candidates.js --jobId your-job-id-here
`);
    return;
  }

  // Run the recovery process
  const processor = new CvRecoveryProcessor();
  await processor.run();
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { CvRecoveryProcessor };
