#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧹 Clearing Next.js build cache...');

const paths = [
  '.next',
  'node_modules/.cache',
  '.vercel/cache',
];

paths.forEach(cachePath => {
  const fullPath = path.join(process.cwd(), cachePath);
  if (fs.existsSync(fullPath)) {
    console.log(`Removing ${cachePath}...`);
    fs.rmSync(fullPath, { recursive: true, force: true });
  } else {
    console.log(`${cachePath} not found, skipping...`);
  }
});

console.log('✅ Cache cleared successfully!');
console.log('');
console.log('Next steps:');
console.log('1. Restart your development server');
console.log('2. The Resource import error should be resolved');
console.log('3. OpenTelemetry logging will be available for your API routes');