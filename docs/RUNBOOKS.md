# HelpInMinutes - Operations Runbook

## Table of Contents
1. [Getting Started](#getting-started)
2. [Environment Setup](#environment-setup)
3. [Common Operations](#common-operations)
4. [Troubleshooting](#troubleshooting)
5. [Incident Response](#incident-response)
6. [Disaster Recovery](#disaster-recovery)

---

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 20+
- Java 21
- PostgreSQL 15 client
- Redis CLI

### Quick Start
```bash
# Clone the repository
git clone https://github.com/helpinminutes/backend.git
cd helpinminutes

# Start all services
docker-compose up -d

# Verify services
docker-compose ps

# Check health
curl http://localhost:8081/actuator/health
```

### Service Ports
| Service | Port | Health Endpoint |
|---------|------|-----------------|
| Identity Service | 8081 | `/actuator/health` |
| Task Service | 8082 | `/actuator/health` |
| Matching Service | 8083 | `/actuator/health` |
| Payment Service | 8084 | `/actuator/health` |
| Realtime Service | 3001 | `/health` |
| Admin Portal | 3000 | - |
| Prometheus | 9090 | - |
| Grafana | 3002 | - |
| RabbitMQ | 15672 | - |

---

## Environment Setup

### Development Environment
```bash
# Copy environment template
cp .env.example .env

# Configure your settings
# Required:
# - JWT_SECRET (256-bit secret)
# - RAZORPAY_KEY_ID
# - RAZORPAY_KEY_SECRET
# - DATABASE_URL
```

### Production Environment
```bash
# Set required environment variables
export JWT_SECRET="your-256-bit-secret-key"
export RAZORPAY_KEY_ID="your-key-id"
export RAZORPAY_KEY_SECRET="your-key-secret"
export DATABASE_URL="jdbc:postgresql://prod-db:5432/helpinminutes"

# Use production profile
export SPRING_PROFILES_ACTIVE=production
```

### Database Setup
```bash
# Run migrations
docker-compose exec postgres psql -U helpinminutes -d helpinminutes \
  -f /docker-entrypoint-initdb.d/01-seed-taxonomy.sql

# Verify data
docker-compose exec postgres psql -U helpinminutes -d helpinminutes \
  -c "SELECT COUNT(*) FROM categories;"
```

---

## Common Operations

### 1. Restarting Services

#### Single Service
```bash
# Restart identity service
docker-compose restart identity-service

# With rebuild
docker-compose up -d --force-recreate identity-service
```

#### All Services
```bash
# Graceful restart
docker-compose restart

# Full rebuild
docker-compose down && docker-compose up -d
```

### 2. Viewing Logs

#### All Services
```bash
# Follow all logs
docker-compose logs -f

# Single service
docker-compose logs -f identity-service

# Last 100 lines
docker-compose logs --tail 100 identity-service

# With timestamps
docker-compose logs -f -t identity-service
```

#### Filter by Level
```bash
# View only errors
docker-compose logs identity-service 2>&1 | grep -i error

# View with ANSI colors
docker-compose logs --no-color identity-service
```

### 3. Database Operations

#### Connect to Database
```bash
docker-compose exec postgres psql -U helpinminutes -d helpinminutes
```

#### Common Queries
```sql
-- View active tasks
SELECT * FROM tasks WHERE status NOT IN ('COMPLETED', 'CANCELLED');

-- View helpers by status
SELECT kyc_status, COUNT(*) FROM helper_profiles GROUP BY kyc_status;

-- View recent payments
SELECT * FROM payments ORDER BY created_at DESC LIMIT 10;

-- View audit logs
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 20;
```

#### Backup
```bash
# Create backup
docker-compose exec postgres pg_dump -U helpinminutes helpinminutes > backup.sql

# With compression
docker-compose exec postgres pg_dump -U helpinminutes helpinminutes | gzip > backup.sql.gz
```

#### Restore
```bash
# Restore from backup
docker-compose exec -T postgres psql -U helpinminutes helpinminutes < backup.sql
```

### 4. Cache Management

#### Redis Commands
```bash
# Connect to Redis
docker-compose exec redis redis-cli

# Common commands
KEYS *task*           # List task-related keys
DEL key_name          # Delete specific key
FLUSHDB               # Clear current database (use carefully!)
INFO memory           # Check memory usage
```

### 5. Message Queue Management

#### RabbitMQ Management
```bash
# Access management UI
open http://localhost:15672

# Credentials: helpinminutes / helpinminutes_secret

# CLI commands
docker-compose exec rabbitmq rabbitmqctl list_queues
docker-compose exec rabbitmq rabbitmqctl list_exchanges
```

#### Queue Statistics
```bash
# Check queue depth
docker-compose exec rabbitmq rabbitmqctl list_queues name messages

# Purge a queue (careful!)
docker-compose exec rabbitmq rabbitmqctl purge_queue helpinminutes_task_created
```

---

## Troubleshooting

### 1. Service Won't Start

#### Check logs
```bash
docker-compose logs identity-service
```

#### Common Issues
- **Port already in use**: `docker-compose ps` to check, then `docker-compose stop <service>`
- **Database not ready**: Wait for postgres health check
- **Memory issues**: `docker stats` to check memory usage

#### Recovery
```bash
# Remove stuck containers
docker-compose down -v

# Rebuild and start
docker-compose up -d
```

### 2. Authentication Failures

#### Symptoms
- 401 Unauthorized responses
- Token refresh errors

#### Diagnosis
```bash
# Check JWT configuration
curl http://localhost:8081/actuator/env | grep jwt

# Verify database users
docker-compose exec postgres psql -U helpinminutes -d helpinminutes \
  -c "SELECT id, email, role FROM users;"
```

#### Resolution
```bash
# Recreate tokens (requires database access)
docker-compose exec identity-service java -jar app.jar --recreate-tokens
```

### 3. Payment Issues

#### Webhook Failures
```bash
# Check webhook logs
docker-compose logs payment-service | grep webhook

# Verify Razorpay configuration
curl http://localhost:8084/actuator/env | grep razorpay
```

#### Common Fixes
```bash
# Restart payment service
docker-compose restart payment-service

# Verify webhook endpoint is accessible
curl -I https://your-domain.com/api/webhooks/razorpay
```

### 4. Matching Service Issues

#### No Helpers Found
```bash
# Check helper locations
docker-compose exec postgres psql -U helpinminutes -d helpinminutes \
  -c "SELECT id, is_online, is_available, ST_AsText(location) FROM helper_profiles LIMIT 10;"

# Check H3 indexing
docker-compose exec postgres psql -U helpinminutes -d helpinminutes \
  -c "SELECT COUNT(*) FROM helper_locations WHERE h3_index = '8a52e6492b7ffff';"
```

#### Recovery
```bash
# Rebuild location index
docker-compose exec matching-service java -jar app.jar --rebuild-h3-index
```

### 5. Database Connection Issues

#### Symptoms
- Connection timeouts
- "Too many connections" errors

#### Diagnosis
```bash
# Check connection pool
curl http://localhost:8081/actuator/metrics/datasource.pool.active

# Check PostgreSQL connections
docker-compose exec postgres psql -U helpinminutes -d helpinminutes \
  -c "SELECT count(*) FROM pg_stat_activity;"
```

#### Resolution
```bash
# Increase connection pool (application.yml)
# Restart services
docker-compose restart
```

---

## Incident Response

### Incident Severity Levels

| Level | Description | Response Time | Examples |
|-------|-------------|---------------|----------|
| P1 - Critical | Complete outage | 15 min | All services down, data loss |
| P2 - High | Major functionality broken | 1 hour | Payment processing down |
| P3 - Medium | Partial degradation | 4 hours | Matching service slow |
| P4 - Low | Minor issues | 24 hours | UI glitches, logging issues |

### Incident Checklist

#### P1/P2 Response
```bash
# 1. Acknowledge incident
# 2. Check service health
docker-compose ps

# 3. Check recent logs
docker-compose logs --since 1h | tail -100

# 4. Check metrics
curl http://localhost:9090/api/v1/query?query=up

# 5. Start incident channel
# 6. Document timeline
```

#### Common Recovery Actions
```bash
# Restart all services
docker-compose restart

# Rollback to previous version
git checkout previous-tag
docker-compose up -d --build

# Scale up services
docker-compose up -d --scale identity-service=3
```

### Post-Incident Review
- Document root cause
- Identify contributing factors
- Create action items
- Update runbook if needed

---

## Disaster Recovery

### Backup Schedule
| Data | Frequency | Retention | Location |
|------|-----------|-----------|----------|
| Database | Daily + WAL | 30 days | S3 + local |
| Redis | Hourly | 7 days | Local |
| RabbitMQ | Daily | 7 days | Local |
| Configs | On change | Forever | Git |

### Recovery Procedures

#### Database Recovery
```bash
# Stop all services
docker-compose down

# Remove old data
rm -rf postgres_data/

# Restore from backup
gunzip -c backup.sql.gz | docker-compose exec -T postgres psql -U helpinminutes -d helpinminutes

# Start services
docker-compose up -d
```

#### Point-in-Time Recovery
```bash
# Find recovery point
docker-compose exec postgres psql -U helpinminutes -d helpinminutes \
  -c "SELECT pg_recovery_confirm_time();"

# Restore to specific time
docker-compose exec -e PITR_TARGET="2024-02-15 14:30:00" postgres restore_to_point
```

### DR Test Procedure
```bash
# Run quarterly
./scripts/dr-test.sh

# Steps:
# 1. Take backup
# 2. Simulate data center failure
# 3. Restore from backup
# 4. Verify functionality
# 5. Document results
```

---

## Monitoring & Alerts

### Key Metrics to Watch
- **API Latency**: P95 < 200ms
- **Error Rate**: < 1%
- **Task Completion Rate**: > 95%
- **Payment Success Rate**: > 99%
- **Helper Online Rate**: > 80%

### Alert Thresholds
| Metric | Warning | Critical |
|--------|---------|----------|
| API latency | > 500ms | > 1s |
| Error rate | > 1% | > 5% |
| Queue depth | > 1000 | > 10000 |
| Memory usage | > 70% | > 90% |
| Disk usage | > 80% | > 95% |

### Checking Dashboards
```bash
# Access Grafana
open http://localhost:3002

# Default credentials: admin / helpinminutes_admin

# Key dashboards:
# - HelpInMinutes Overview
# - API Performance
# - Payment Metrics
# - Infrastructure Health
```

---

## Useful Commands

### Health Checks
```bash
# All services
for port in 8081 8082 8083 8084 3001; do
  echo "Service on $port: $(curl -s -o /dev/null -w '%{http_code}' http://localhost:$port/actuator/health || echo 'DOWN')"
done
```

### Database Query Script
```bash
# Quick status check
docker-compose exec postgres psql -U helpinminutes -d helpinminutes <<EOF
SELECT 'Users' as table, COUNT(*) FROM users
UNION ALL
SELECT 'Helpers', COUNT(*) FROM helper_profiles
UNION ALL
SELECT 'Tasks', COUNT(*) FROM tasks
UNION ALL
SELECT 'Payments', COUNT(*) FROM payments;
EOF
```

### Service Restart with Health Wait
```bash
docker-compose restart identity-service
sleep 10
curl -f http://localhost:8081/actuator/health || echo "Health check failed!"
```

---

## Support Contacts

| Role | Contact | Responsibility |
|------|---------|----------------|
| On-call Engineer | See PagerDuty | Incidents |
| Backend Lead | engineering-lead@helpinminutes.com | Technical decisions |
| DevOps | devops@helpinminutes.com | Infrastructure |
| Security | security@helpinminutes.com | Security incidents |

---

**Document Owner**: DevOps Team
**Last Updated**: 2024-02-02
**Next Review**: 2024-05-02
