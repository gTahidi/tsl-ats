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
      await this.processCvsInBatches(cvFiles);

      // Step 3: Generate summary report
      this.generateReport();

    } catch (error) {
      console.error('❌ Recovery process failed:', error);
      process.exit(1);
    }
  }

  async listCvFiles() {
    const cvFiles = [];
    const allowedExtensions = ['.pdf', '.doc', '.docx'];
    
    console.log('🔍 Listing blobs from container...');
    
    try {
      // Use the simplest possible approach - just like your working azure-storage.ts
      let blobCount = 0;
      for await (const blob of this.containerClient.listBlobsFlat()) {
        blobCount++;
        if (blobCount % 100 === 0) {
          console.log(`📄 Processed ${blobCount} blobs...`);
        }
        
        const extension = path.extname(blob.name).toLowerCase();
        if (allowedExtensions.includes(extension)) {
          cvFiles.push({
            name: blob.name,
            url: this.containerClient.getBlobClient(blob.name).url,
            size: blob.properties.contentLength || 0,
            lastModified: blob.properties.lastModified || new Date(),
          });
        }
      }
      
      console.log(`✅ Found ${blobCount} total blobs, ${cvFiles.length} CV files`);
      
    } catch (error) {
      console.error('❌ Error listing blobs:', error);
      throw error;
    }

    return cvFiles.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
  }

  async processCvsInBatches(cvFiles) {
    const batches = this.createBatches(cvFiles, CONFIG.batchSize);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`\n📦 Processing Batch ${i + 1}/${batches.length} (${batch.length} files)`);
      
      // Process batch in parallel
      const batchPromises = batch.map(cvFile => this.processSingleCv(cvFile));
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Handle batch results
      batchResults.forEach((result, index) => {
        const cvFile = batch[index];
        if (result.status === 'fulfilled') {
          this.processedCount++;
          this.results.push({
            file: cvFile.name,
            status: 'success',
            candidate: result.value,
          });
          console.log(`  ✅ ${cvFile.name} - Processed successfully`);
        } else {
          this.errorCount++;
          this.results.push({
            file: cvFile.name,
            status: 'error',
            error: result.reason.message,
          });
          console.log(`  ❌ ${cvFile.name} - Error: ${result.reason.message}`);
        }
      });

      // Delay between batches to respect rate limits
      if (i < batches.length - 1) {
        console.log(`⏳ Waiting ${CONFIG.delayBetweenBatches}ms before next batch...`);
        await this.delay(CONFIG.delayBetweenBatches);
      }
    }
  }

  async processSingleCv(cvFile) {
    let tempFilePath = null;
    
    try {
      // Step 1: Download CV file from Azure
      tempFilePath = await this.downloadCvFile(cvFile);
      
      // Step 2: Create FormData for API call
      const formData = new FormData();
      const fileBuffer = fs.readFileSync(tempFilePath);
      
      formData.append('file', fileBuffer, {
        filename: cvFile.name,
        contentType: this.getMimeType(cvFile.name),
      });
      formData.append('jobId', this.determineJobId(cvFile.name));

      // Step 3: Call the upload-and-process endpoint
      const response = await this.callProcessingEndpoint(formData, cvFile.name);
      
      return response;
      
    } catch (error) {
      console.error(`Error processing ${cvFile.name}:`, error);
      throw error;
    } finally {
      // Clean up temp file
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  }

  async downloadCvFile(cvFile) {
    const tempFilePath = path.join(CONFIG.tempDir, cvFile.name);
    
    try {
      const blobClient = this.containerClient.getBlobClient(cvFile.name);
      await blobClient.downloadToFile(tempFilePath);
      return tempFilePath;
    } catch (error) {
      console.error(`Error downloading ${cvFile.name}:`, error);
      throw error;
    }
  }

  async callProcessingEndpoint(formData, fileName = 'unknown', retryCount = 0) {
    try {
      const url = `${CONFIG.apiBaseUrl}/api/cv/upload-and-process?apiKey=${CONFIG.internalApiKey}`;
      
      // CV processing can take 30-60 seconds with Gemini API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout
      
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: {
          ...formData.getHeaders(),
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(`API call failed: ${response.status} - ${errorText}`);
        error.status = response.status;
        error.responseText = errorText;
        throw error;
      }

      const result = await response.json();
      return result;
      
    } catch (error) {
      // Add debug logging to see what's actually happening
      console.log(`  🔍 ${fileName} - Debug: Error type: ${error.name}, Status: ${error.status}, Message: ${error.message}`);
      
      // Don't retry certain errors that won't be fixed by retrying
      const nonRetryableErrors = [400, 401, 403, 415, 422]; // Bad Request, Unauthorized, Forbidden, Unsupported Media Type, Unprocessable Entity
      
      if (error.status && nonRetryableErrors.includes(error.status)) {
        console.log(`  ⚠️  ${fileName} - Non-retryable error (${error.status}), skipping...`);
        throw error;
      }
      
      if (retryCount < CONFIG.maxRetries) {
        console.log(`  🔄 ${fileName} - Retrying... (${retryCount + 1}/${CONFIG.maxRetries})`);
        await this.delay(1000 * (retryCount + 1)); // Exponential backoff
        return this.callProcessingEndpoint(formData, fileName, retryCount + 1);
      }
      
      console.log(`  ❌ ${fileName} - Max retries exceeded, giving up`);
      throw error;
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
    console.log(`📈 Success Rate: ${((this.processedCount / (this.processedCount + this.errorCount)) * 100).toFixed(1)}%`);
    
    if (this.errorCount > 0) {
      console.log('\n❌ ERRORS:');
      this.results
        .filter(r => r.status === 'error')
        .forEach(r => console.log(`  • ${r.file}: ${r.error}`));
    }

    // Save detailed report to file
    const reportPath = path.join(__dirname, '../temp/recovery-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        processed: this.processedCount,
        errors: this.errorCount,
        successRate: ((this.processedCount / (this.processedCount + this.errorCount)) * 100).toFixed(1) + '%',
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
