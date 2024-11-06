#!/bin/bash
set -e

# Database backup
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups/${BACKUP_DATE}"

mkdir -p "${BACKUP_DIR}"

# Set PostgreSQL password environment variable
export PGPASSWORD=postgres

# Backup database
echo "Creating database backup..."
pg_dump -h localhost -p 5433 -U postgres -d ats_platform > "${BACKUP_DIR}/database.sql"

# Configure MinIO client
echo "Configuring MinIO client..."
mc alias set local http://localhost:9500 minioadmin minioadmin

# Backup MinIO data
echo "Creating MinIO backup..."
mc cp -r local/candidates-cvs "${BACKUP_DIR}/minio_backup"

echo "Backup completed successfully!"
echo "Backup location: ${BACKUP_DIR}"
