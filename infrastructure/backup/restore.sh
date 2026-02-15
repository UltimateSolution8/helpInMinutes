#!/bin/bash

# ============================================
# HelpInMinutes Database Restore Script
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
RESTORE_TYPE="${1:-full}" # full, postgres, redis, rabbitmq, minio
BACKUP_FILE="${2:-}"

# Logging
LOG_FILE="${BACKUP_DIR}/logs/restore_${DATE}.log"
mkdir -p "$(dirname "$LOG_FILE")"

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
    log_info "Running pre-flight checks for restore..."

    # Check for required tools
    for cmd in psql redis-cli rabbitmqadmin mc aws; do
        if ! command -v $cmd &> /dev/null; then
            log_warn "$cmd not found, some restore features may not work"
        fi
    done

    # Check backup directory
    if [ ! -d "$BACKUP_DIR" ]; then
        log_error "Backup directory not found: $BACKUP_DIR"
        exit 1
    fi

    log_info "Pre-flight checks completed"
}

# ============================================
# PostgreSQL Restore
# ============================================
restore_postgres() {
    log_info "Starting PostgreSQL restore..."

    if [ -z "$BACKUP_FILE" ]; then
        # Find latest backup
        BACKUP_FILE=$(find "${BACKUP_DIR}/postgres" -type f -name "*.sql.gz" -o -name "*.sql.gz.enc" | sort -r | head -1)
        if [ -z "$BACKUP_FILE" ]; then
            log_error "No PostgreSQL backup file found"
            return 1
        fi
    fi

    log_info "Using backup file: $BACKUP_FILE"

    # Handle encryption
    local restore_file="$BACKUP_FILE"
    if [[ "$BACKUP_FILE" == *.enc ]]; then
        log_info "Decrypting backup..."
        restore_file="${BACKUP_FILE%.enc}"
        gpg --decrypt --output "$restore_file" "$BACKUP_FILE" 2>/dev/null || {
            log_error "Decryption failed. Make sure GPG key is available."
            return 1
        }
    fi

    # Handle compression
    if [[ "$restore_file" == *.gz ]]; then
        log_info "Decompressing backup..."
        restore_file="${restore_file%.gz}"
        gunzip -c "$BACKUP_FILE" > "$restore_file"
    fi

    # Drop and recreate database
    log_info "Dropping and recreating database..."
    export PGPASSWORD="$POSTGRES_PASSWORD"
    psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d postgres << EOF
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$POSTGRES_DB' AND pid <> pg_backend_pid();
DROP DATABASE IF EXISTS $POSTGRES_DB;
CREATE DATABASE $POSTGRES_DB;
EOF

    # Restore database
    log_info "Restoring database..."
    psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
        --verbose --echo-errors \
        < "$restore_file" 2>> "$LOG_FILE"

    if [ $? -eq 0 ]; then
        log_info "PostgreSQL restore completed successfully"
    else
        log_error "PostgreSQL restore failed"
        return 1
    fi

    # Cleanup temp file
    if [[ "$restore_file" != "$BACKUP_FILE" ]]; then
        rm -f "$restore_file"
    fi
}

# ============================================
# Redis Restore
# ============================================
restore_redis() {
    log_info "Starting Redis restore..."

    if [ -z "$BACKUP_FILE" ]; then
        # Find latest backup
        BACKUP_FILE=$(find "${BACKUP_DIR}/redis" -type f -name "*.rdb.gz" -o -name "*.rdb.gz.enc" | sort -r | head -1)
        if [ -z "$BACKUP_FILE" ]; then
            log_error "No Redis backup file found"
            return 1
        fi
    fi

    log_info "Using backup file: $BACKUP_FILE"

    # Handle encryption
    local restore_file="$BACKUP_FILE"
    if [[ "$BACKUP_FILE" == *.enc ]]; then
        log_info "Decrypting backup..."
        restore_file="${BACKUP_FILE%.enc}"
        gpg --decrypt --output "$restore_file" "$BACKUP_FILE" 2>/dev/null || return 1
    fi

    # Handle compression
    if [[ "$restore_file" == *.gz ]]; then
        log_info "Decompressing backup..."
        restore_file="${restore_file%.gz}"
        gunzip -c "$BACKUP_FILE" > "$restore_file"
    fi

    # Stop Redis
    log_info "Stopping Redis..."
    redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" SHUTDOWN NOSAVE 2>> "$LOG_FILE" || true

    # Copy RDB file
    log_info "Copying RDB file..."
    local redis_data_dir=$(redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" CONFIG GET dir | tail -1)
    cp "$restore_file" "${redis_data_dir}/dump.rdb"

    # Start Redis
    log_info "Starting Redis..."
    redis-server --daemonize yes --requirepass "$REDIS_PASSWORD" --appendonly yes

    # Wait for Redis to be ready
    sleep 5
    if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" -a "$REDIS_PASSWORD" PING | grep -q PONG; then
        log_info "Redis restore completed successfully"
    else
        log_error "Redis restore failed"
        return 1
    fi

    # Cleanup temp file
    if [[ "$restore_file" != "$BACKUP_FILE" ]]; then
        rm -f "$restore_file"
    fi
}

# ============================================
# RabbitMQ Restore
# ============================================
restore_rabbitmq() {
    log_info "Starting RabbitMQ restore..."

    if [ -z "$BACKUP_FILE" ]; then
        # Find latest backup
        BACKUP_FILE=$(find "${BACKUP_DIR}/rabbitmq" -type f -name "*.json.gz" -o -name "*.json.gz.enc" | sort -r | head -1)
        if [ -z "$BACKUP_FILE" ]; then
            log_error "No RabbitMQ backup file found"
            return 1
        fi
    fi

    log_info "Using backup file: $BACKUP_FILE"

    # Handle encryption
    local restore_file="$BACKUP_FILE"
    if [[ "$BACKUP_FILE" == *.enc ]]; then
        log_info "Decrypting backup..."
        restore_file="${BACKUP_FILE%.enc}"
        gpg --decrypt --output "$restore_file" "$BACKUP_FILE" 2>/dev/null || return 1
    fi

    # Handle compression
    if [[ "$restore_file" == *.gz ]]; then
        log_info "Decompressing backup..."
        restore_file="${restore_file%.gz}"
        gunzip -c "$BACKUP_FILE" > "$restore_file"
    fi

    # Import definitions
    log_info "Importing RabbitMQ definitions..."
    rabbitmqadmin -H "$RABBITMQ_HOST" -u "$RABBITMQ_USER" -p "$RABBITMQ_PASSWORD" import "$restore_file" 2>> "$LOG_FILE"

    if [ $? -eq 0 ]; then
        log_info "RabbitMQ restore completed successfully"
    else
        log_error "RabbitMQ restore failed"
        return 1
    fi

    # Cleanup temp file
    if [[ "$restore_file" != "$BACKUP_FILE" ]]; then
        rm -f "$restore_file"
    fi
}

# ============================================
# MinIO Restore
# ============================================
restore_minio() {
    log_info "Starting MinIO restore..."

    if [ -z "$BACKUP_FILE" ]; then
        # Find latest backup
        BACKUP_FILE=$(find "${BACKUP_DIR}/minio" -type f -name "*.tar.gz" | sort -r | head -1)
        if [ -z "$BACKUP_FILE" ]; then
            log_error "No MinIO backup file found"
            return 1
        fi
    fi

    log_info "Using backup file: $BACKUP_FILE"

    # Configure mc
    mc alias set minio-local http://${MINIO_ENDPOINT} ${MINIO_ROOT_USER} ${MINIO_ROOT_PASSWORD} 2>> "$LOG_FILE" || true

    # Extract tarball to temp directory
    local temp_dir=$(mktemp -d)
    tar -xzf "$BACKUP_FILE" -C "$temp_dir"

    # Sync data back to MinIO
    log_info "Restoring MinIO data..."
    mc mirror --overwrite --remove "${temp_dir}/data/" minio-local/ 2>> "$LOG_FILE"

    # Cleanup
    rm -rf "$temp_dir"

    log_info "MinIO restore completed successfully"
}

# ============================================
# Rollback
# ============================================
rollback() {
    log_warn "Initiating rollback..."

    # This would restore the last known good backup
    # Implementation depends on your backup strategy

    log_error "Rollback completed. Please check logs for details."
}

# ============================================
# Send Notification
# ============================================
send_notification() {
    local status=$1
    local message=$2

    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\": \"HelpInMinutes Restore ${status}: ${message}\"}" \
            "$SLACK_WEBHOOK_URL" 2>> "$LOG_FILE" || true
    fi
}

# ============================================
# Main Function
# ============================================
main() {
    log_info "========================================="
    log_info "HelpInMinutes Restore Script"
    log_info "Restore Type: $RESTORE_TYPE"
    log_info "Date: $DATE"
    log_info "========================================="

    preflight_checks

    local start_time=$(date +%s)
    local error_count=0

    # Confirm before proceeding
    if [ "$RESTORE_TYPE" != "dry-run" ]; then
        echo -e "${YELLOW}WARNING: This will overwrite existing data!${NC}"
        read -p "Do you want to proceed? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            log_info "Restore cancelled"
            exit 0
        fi
    fi

    # Run restores based on type
    case "$RESTORE_TYPE" in
        full)
            restore_postgres || error_count=$((error_count + 1))
            restore_redis || error_count=$((error_count + 1))
            restore_rabbitmq || error_count=$((error_count + 1))
            restore_minio || error_count=$((error_count + 1))
            ;;
        postgres)
            restore_postgres || error_count=$((error_count + 1))
            ;;
        redis)
            restore_redis || error_count=$((error_count + 1))
            ;;
        rabbitmq)
            restore_rabbitmq || error_count=$((error_count + 1))
            ;;
        minio)
            restore_minio || error_count=$((error_count + 1))
            ;;
        dry-run)
            log_info "Dry run mode - no changes will be made"
            log_info "Would restore: $BACKUP_FILE"
            ;;
        *)
            log_error "Unknown restore type: $RESTORE_TYPE"
            exit 1
            ;;
    esac

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    log_info "========================================="
    log_info "Restore completed in ${duration} seconds"
    log_info "Errors: $error_count"
    log_info "========================================="

    if [ $error_count -eq 0 ]; then
        send_notification "SUCCESS" "Restore completed in ${duration} seconds"
        exit 0
    else
        send_notification "FAILED" "Restore completed with $error_count errors in ${duration} seconds"
        exit 1
    fi
}

# Run main function
main "$@"
