# Deployment Guide

## Prerequisites
1. Vercel account
2. PostgreSQL database
3. S3-compatible storage (AWS S3 or MinIO)

## Environment Variables
Copy `.env.production.template` to `.env.production` and fill in your production values.

## Deployment Steps
1. Install Vercel CLI: `npm i -g vercel`
2. Login to Vercel: `vercel login`
3. Deploy: `vercel --prod`

## Database Migration
Run migrations in production:
```bash
DATABASE_URL=your-production-url npx prisma migrate deploy
```

## Backup
Use the provided backup script:
```bash
./scripts/backup.sh
```

## Monitoring
Monitor the application using Vercel's dashboard.
