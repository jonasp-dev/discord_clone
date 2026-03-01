#!/usr/bin/env bash
# =============================================================================
# Discord Clone — Database Backup to S3
# =============================================================================
# Runs daily via cron (set up by EC2 user data).
# Dumps PostgreSQL, compresses, uploads to S3, cleans up.
#
# Manual run:
#   /opt/discord-clone/scripts/backup-db.sh
# =============================================================================

set -euo pipefail

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="/tmp/discord-backup-${TIMESTAMP}.sql.gz"
CONTAINER_NAME="discord-prod-postgres"
DB_USER="discord"
DB_NAME="discord_clone"

# Discover the S3 bucket (tagged by Terraform)
BACKUP_BUCKET=$(aws s3 ls | grep discord-clone-backups | awk '{print $3}' | head -1)

if [[ -z "$BACKUP_BUCKET" ]]; then
  echo "ERROR: Could not find backup S3 bucket (discord-clone-backups-*)"
  exit 1
fi

echo "[$(date)] Starting database backup..."
echo "  Container: $CONTAINER_NAME"
echo "  Bucket:    $BACKUP_BUCKET"

# Dump database from Docker container
docker exec "$CONTAINER_NAME" \
  pg_dump -U "$DB_USER" -d "$DB_NAME" --no-owner --no-privileges \
  | gzip > "$BACKUP_FILE"

FILESIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "  Dump size: $FILESIZE"

# Upload to S3
aws s3 cp "$BACKUP_FILE" "s3://${BACKUP_BUCKET}/backups/${TIMESTAMP}.sql.gz" --quiet
echo "  Uploaded to s3://${BACKUP_BUCKET}/backups/${TIMESTAMP}.sql.gz"

# Clean up local file
rm -f "$BACKUP_FILE"

echo "[$(date)] Backup complete."
