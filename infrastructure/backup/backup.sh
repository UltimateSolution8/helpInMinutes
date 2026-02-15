#!/bin/bash

# ============================================
# HelpInMinutes Database Backup Script
# ============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_TYPE="${1:-full}" # full, incremental, differential
COMPRESSION="${COMPRESSION:-gzip}"
ENCRYPTION="${ENCRYPTION:-yes}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
S3_BUCKET="${AWS_S3_BUCKET:-him-backups}"
S3_REGION="${AWS_REGION:-ap-south-1}"

# Logging
LOG_FILE="${BACKUP_DIR}/logs/backup_${DATE}.log"
mkdir -p "$(dirname "$LOG_FILE")"
mkdir -p "${BACKUP_DIR}/postgres"
mkdir -p "${BACKUP_DIR}/redis"
mkdir -p "${BACKUP_DIR}/rabbitmq"
mkdir -p "${BACKUP_DIR}/minio"

log() {
    local level=$1
    shift
    local message="[$(date '+%Y-%m-%d %H:%M:%S')] [$level] $*"
    echo -e "$message" | tee -a "$LOG_FILE"
}

log_info() {
    log "INFO" "${GREEN}$*${NC}"
}

log_warn() {
    log "WARN" "${YELLOW}$*${NC}"
}

log_error() {
    log "ERROR" "${RED}$*${NC}"
}

# Database connection
POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-helpinminutes}"
POSTGRES_DB="${POSTGRES_DB:-helpinminutes}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD}"

# Redis connection
REDIS_HOST="${REDIS_HOST:-redis}"
REDIS_PORT="${REDIS_PORT:-6379}"
REDIS_PASSWORD="${REDIS_PASSWORD}"

# RabbitMQ connection
RABBITMQ_HOST="${RABBITMQ_HOST:-rabbitmq}"
RABBITMQ_USER="${RABBITMQ_USER:-helpinminutes}"
RABBITMQ_PASSWORD="${RABBITMQ_PASSWORD}"

# MinIO connection
MINIO_ENDPOINT="${MINIO_ENDPOINT:-minio:9000}"
MINIO_ROOT_USER="${MINIO_ROOT_USER:-minioadmin}"
MINIO_ROOT_PASSWORD="${MINIO_ROOT_PASSWORD}"

# ============================================
# Pre-flight Checks
# ============================================
preflight_checks() {
    log_info "Running pre-flight checks..."

    # Check for required tools
    for cmd in pg_dump redis-cli mc aws date; do
        if ! command -v $cmd &> /dev/null; then
            log_warn "$cmd not found, some backup features may not work"
        fi
    done

    # Check backup directory
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        log_info "Created backup directory: $BACKUP_DIR"
    fi

    log_info "Pre-flight checks completed"
}

# ============================================
# PostgreSQL Backup
# ============================================
backup_postgres() {
    log_info "Starting PostgreSQL backup..."

    local backup_file="${BACKUP_DIR}/postgres/postgres_${POSTGRES_DB}_${DATE}.sql"
    local compressed_file="${backup_file}.${COMPRESSION}"
    local encrypted_file="${compressed_file}.enc"

    # Export password for pg_dump
    export PGPASSWORD="$POSTGRES_PASSWORD"

    # Create SQL dump
    log_info "Creating PostgreSQL dump..."
    pg_dump \
        -h "$POSTGRES_HOST" \
        -p "$POSTGRES_PORT" \
        -U "$POSTGRES_USER" \
        -d "$POSTGRES_DB" \
        --verbose \
        --no-owner \
        --no-privileges \
        --clean \
        --if-exists \
        > "$backup_file" 2>> "$LOG_FILE"

    if [ $? -eq 0 ]; then
        log_info "PostgreSQL dump created: $backup_file"
    else
        log_error "PostgreSQL dump failed"
        return 1
    fi

    # Compress
    if [ "$COMPRESSION" = "gzip" ]; then
        log_info "Compressing PostgreSQL backup..."
        gzip "$backup_file"
        backup_file="$compressed_file"
    fi

    # Encrypt
    if [ "$ENCRYPTION" = "yes" ]; then
        log_info "Encrypting PostgreSQL backup..."
        local gpg_recipient="${GPG_RECIPIENT:-backup@helpinminutes.com}"
        gpg --encrypt --recipient "$gpg_recipient" "$backup_file" 2>/dev/null && rm "$backup_file"
        backup_file="${backup_file}.enc"
    fi

    # Upload to S3
    if [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
        log_info "Uploading PostgreSQL backup to S3..."
        aws s3 cp "$backup_file" "s3://${S3_BUCKET}/postgres/" \
            --region "$S3_REGION" \
            --storage-class STANDARD_IA \
            2>> "$LOG_FILE"
    fi

    # Calculate checksum
    local checksum_file="${backup_file}.sha256"
    sha256sum "$backup_file" > "$checksum_file"
    log_info "Checksum created: $checksum_file"

    log_info "PostgreSQL backup completed: $backup_file"
}

# ============================================
# Redis Backup
# ============================================
backup_redis() {
    log_info "Starting Redis backup..."

    local backup_file="${BACKUP_DIR}/redis/redis_backup_${DATE}.rdb"
    local compressed_file="${backup_file}.${COMPRESSION}"
    local encrypted_file="${compressed_file}.enc"

    # Trigger BGSAVE and wait
    log_info "Triggering Redis BGSAVE..."
    redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" BGSAVE 2>> "$LOG_FILE"

    # Wait for BGSAVE to complete
    while [ $(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" LASTSAVE) == $(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" LASTSAVE) ]; do
        sleep 1
    done

    # Copy RDB file
    log_info "Copying Redis RDB file..."
    redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" BGREWRITEAOF 2>> "$LOG_FILE" || true

    # Download RDB file
    redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" --rdb "$backup_file" 2>> "$LOG_FILE"

    if [ $? -eq 0 ]; then
        log_info "Redis backup created: $backup_file"
    else
        log_error "Redis backup failed"
        return 1
    fi

    # Compress
    if [ "$COMPRESSION" = "gzip" ]; then
        log_info "Compressing Redis backup..."
        gzip "$backup_file"
        backup_file="$compressed_file"
    fi

    # Upload to S3
    if [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
        log_info "Uploading Redis backup to S3..."
        aws s3 cp "$backup_file" "s3://${S3_BUCKET}/redis/" \
            --region "$S3_REGION" \
            --storage-class STANDARD_IA \
            2>> "$LOG_FILE"
    fi

    log_info "Redis backup completed: $backup_file"
}

# ============================================
# RabbitMQ Backup
# ============================================
backup_rabbitmq() {
    log_info "Starting RabbitMQ backup..."

    local backup_file="${BACKUP_DIR}/rabbitmq/rabbitmq_backup_${DATE}.json"
    local compressed_file="${backup_file}.${COMPRESSION}"
    local encrypted_file="${compressed_file}.enc"

    # Export exchanges, queues, bindings, and policies
    log_info "Exporting RabbitMQ definitions..."
    rabbitmqadmin -H "$RABBITMQ_HOST" -u "$RABBITMQ_USER" -p "$RABBITMQ_PASSWORD" export "$backup_file" 2>> "$LOG_FILE"

    if [ $? -eq 0 ]; then
        log_info "RabbitMQ backup created: $backup_file"
    else
        log_error "RabbitMQ backup failed"
        return 1
    fi

    # Compress
    if [ "$COMPRESSION" = "gzip" ]; then
        log_info "Compressing RabbitMQ backup..."
        gzip "$backup_file"
        backup_file="$compressed_file"
    fi

    # Upload to S3
    if [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
        log_info "Uploading RabbitMQ backup to S3..."
        aws s3 cp "$backup_file" "s3://${S3_BUCKET}/rabbitmq/" \
            --region "$S3_REGION" \
            --storage-class STANDARD_IA \
            2>> "$LOG_FILE"
    fi

    log_info "RabbitMQ backup completed: $backup_file"
}

# ============================================
# MinIO Backup
# ============================================
backup_minio() {
    log_info "Starting MinIO backup..."

    local backup_file="${BACKUP_DIR}/minio/minio_backup_${DATE}.tar.gz"
    local timestamp_file="${BACKUP_DIR}/minio/last_sync_${DATE}.txt"

    # Configure mc
    mc alias set minio-local http://${MINIO_ENDPOINT} ${MINIO_ROOT_USER} ${MINIO_ROOT_PASSWORD} 2>> "$LOG_FILE" || true

    # Sync buckets to local directory
    log_info "Syncing MinIO buckets..."
    mc mirror --overwrite --remove minio-local/ "${BACKUP_DIR}/minio/data/" 2>> "$LOG_FILE"

    # Create tarball
    log_info "Creating MinIO backup archive..."
    tar -czf "$backup_file" -C "${BACKUP_DIR}/minio" data/ 2>> "$LOG_FILE"

    # Record sync timestamp
    echo "$DATE" > "$timestamp_file"

    # Upload to S3
    if [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
        log_info "Uploading MinIO backup to S3..."
        aws s3 cp "$backup_file" "s3://${S3_BUCKET}/minio/" \
            --region "$S3_REGION" \
            --storage-class STANDARD_IA \
            2>> "$LOG_FILE"
    fi

    log_info "MinIO backup completed: $backup_file"
}

# ============================================
# Cleanup Old Backups
# ============================================
cleanup_old_backups() {
    log_info "Cleaning up backups older than ${RETENTION_DAYS} days..."

    # Find and delete old backup files
    find "$BACKUP_DIR" -type f -name "*.sql*" -mtime +$RETENTION_DAYS -delete 2>> "$LOG_FILE" || true
    find "$BACKUP_DIR" -type f -name "*.rdb*" -mtime +$RETENTION_DAYS -delete 2>> "$LOG_FILE" || true
    find "$BACKUP_DIR" -type f -name "*.json*" -mtime +$RETENTION_DAYS -delete 2>> "$LOG_FILE" || true
    find "$BACKUP_DIR" -type f -name "*.tar.gz*" -mtime +$RETENTION_DAYS -delete 2>> "$LOG_FILE" || true

    # Cleanup empty directories
    find "$BACKUP_DIR" -type d -empty -delete 2>> "$LOG_FILE" || true

    log_info "Cleanup completed"
}

# ============================================
# Send Notification
# ============================================
send_notification() {
    local status=$1
    local message=$2

    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\": \"HelpInMinutes Backup ${status}: ${message}\"}" \
            "$SLACK_WEBHOOK_URL" 2>> "$LOG_FILE" || true
    fi
}

# ============================================
# Main Function
# ============================================
main() {
    log_info "========================================="
    log_info "HelpInMinutes Backup Script"
    log_info "Backup Type: $BACKUP_TYPE"
    log_info "Date: $DATE"
    log_info "========================================="

    preflight_checks

    local start_time=$(date +%s)
    local error_count=0

    # Run backups based on type
    case "$BACKUP_TYPE" in
        full)
            backup_postgres || error_count=$((error_count + 1))
            backup_redis || error_count=$((error_count + 1))
            backup_rabbitmq || error_count=$((error_count + 1))
            backup_minio || error_count=$((error_count + 1))
            ;;
        incremental)
            backup_postgres || error_count=$((error_count + 1))
            backup_redis || error_count=$((error_count + 1))
            ;;
        differential)
            backup_postgres || error_count=$((error_count + 1))
            ;;
        *)
            log_error "Unknown backup type: $BACKUP_TYPE"
            exit 1
            ;;
    esac

    # Cleanup old backups
    cleanup_old_backups

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    log_info "========================================="
    log_info "Backup completed in ${duration} seconds"
    log_info "Errors: $error_count"
    log_info "========================================="

    if [ $error_count -eq 0 ]; then
        send_notification "SUCCESS" "Backup completed in ${duration} seconds"
        exit 0
    else
        send_notification "FAILED" "Backup completed with $error_count errors in ${duration} seconds"
        exit 1
    fi
}

# Run main function
main "$@"
