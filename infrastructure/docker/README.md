# ============================================
# HelpInMinutes Docker Deployment Guide
# ============================================

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Quick Start](#quick-start)
4. [Production Deployment](#production-deployment)
5. [Monitoring](#monitoring)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.20+
- At least 16GB RAM
- At least 100GB disk space
- Git

## Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/helpinminutes.git
cd helpinminutes
```

### 2. Configure Environment

Copy the example environment file and configure it for your environment:

```bash
# For Development
cp infrastructure/docker/development.env .env

# For Staging
cp infrastructure/docker/staging.env .env

# For Production
cp infrastructure/docker/production.env .env
```

### 3. Update Sensitive Values

Edit the `.env` file and update all sensitive values:

```bash
# Generate secure passwords
POSTGRES_PASSWORD=$(openssl rand -base64 32)
REDIS_PASSWORD=$(openssl rand -base64 32)
RABBITMQ_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 64)

# Update .env file
sed -i "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$POSTGRES_PASSWORD/" .env
# ... repeat for other secrets
```

### 4. Generate SSL Certificates

For production, you'll need valid SSL certificates:

```bash
# Using Let's Encrypt (for production)
sudo certbot certonly --standalone -d api.helpinminutes.com
sudo certbot certonly --standalone -d admin.helpinminutes.com

# Copy certificates
sudo cp /etc/letsencrypt/live/api.helpinminutes.com/fullchain.pem infrastructure/docker/nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/api.helpinminutes.com/privkey.pem infrastructure/docker/nginx/ssl/key.pem

# For development/testing, generate self-signed certificates
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout infrastructure/docker/nginx/ssl/key.pem \
    -out infrastructure/docker/nginx/ssl/cert.pem \
    -subj "/C=IN/ST=Maharashtra/L=Mumbai/O=HelpInMinutes/CN=*.helpinminutes.com"
```

## Quick Start

### Development Environment

```bash
# Start all services
docker-compose -f infrastructure/docker/docker-compose.yml up -d

# View logs
docker-compose -f infrastructure/docker/docker-compose.yml logs -f

# Check service health
curl http://localhost:8080/health
```

### Services Available

| Service | URL | Description |
|---------|-----|-------------|
| API Gateway | http://localhost:8080 | Main API endpoint |
| Admin Portal | http://localhost:3000 | Admin dashboard |
| Grafana | http://localhost:3000/grafana | Monitoring dashboards |
| Prometheus | http://localhost:9090 | Metrics collection |
| Jaeger | http://localhost:16686/jaeger | Distributed tracing |
| RabbitMQ Management | http://localhost:15672 | Message queue UI |
| MinIO Console | http://localhost:9001 | File storage UI |

## Production Deployment

### 1. Prepare the Server

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Configure Docker for production
sudo mkdir -p /etc/docker
cat > /etc/docker/daemon.json << EOF
{
  "storage-driver": "overlay2",
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "10"
  },
  "metrics-addr": "0.0.0.0:9323",
  "experimental": true
}
EOF

sudo systemctl restart docker
```

### 2. Configure System Resources

```bash
# Increase file descriptors
echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf

# Configure kernel parameters
cat >> /etc/sysctl.conf << EOF
net.core.somaxconn=65535
net.ipv4.tcp_max_syn_backlog=65535
vm.swappiness=10
EOF
sudo sysctl -p
```

### 3. Deploy with Docker Compose

```bash
# Create data directories
mkdir -p data/postgres data/redis data/rabbitmq data/minio data/prometheus data/grafana backups

# Load environment variables
source production.env

# Pull latest images
docker-compose -f infrastructure/docker/docker-compose.yml pull

# Start services
docker-compose -f infrastructure/docker/docker-compose.yml up -d

# Verify health
docker-compose -f infrastructure/docker/docker-compose.yml ps
```

### 4. Setup SSL/TLS with Nginx

```bash
# Create SSL directory
mkdir -p infrastructure/docker/nginx/ssl

# Install certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificates
sudo certbot --nginx -d api.helpinminutes.com -d admin.helpinminutes.com -d console.helpinminutes.com -d s3.helpinminutes.com -d monitoring.helpinminutes.com

# Reload nginx
docker-compose -f infrastructure/docker/docker-compose.yml exec nginx nginx -s reload
```

## Monitoring

### Access Grafana Dashboards

1. Navigate to http://monitoring.helpinminutes.com/grafana
2. Login with credentials from environment variables
3. Pre-configured dashboards:
   - [Service Overview](http://monitoring.helpinminutes.com/grafana/d/service-overview)
   - [API Performance](http://monitoring.helpinminutes.com/grafana/d/api-performance)
   - [Database Metrics](http://monitoring.helpinminutes.com/grafana/d/database-metrics)
   - [Infrastructure](http://monitoring.helpinminutes.com/grafana/d/infrastructure)

### Key Metrics to Monitor

- **API Response Time**: P95 < 500ms
- **Error Rate**: < 1%
- **CPU Usage**: < 80%
- **Memory Usage**: < 85%
- **Disk Usage**: < 80%
- **Queue Length**: < 1000 messages

### Alerting

Alerts are configured in Prometheus and sent to:
- Slack: #alerts-helpinminutes
- PagerDuty: Critical alerts

## Troubleshooting

### View Logs

```bash
# All services
docker-compose -f infrastructure/docker/docker-compose.yml logs

# Specific service
docker-compose -f infrastructure/docker/docker-compose.yml logs identity-service

# Last 100 lines
docker-compose -f infrastructure/docker/docker-compose.yml logs --tail 100

# Follow logs
docker-compose -f infrastructure/docker/docker-compose.yml logs -f
```

### Check Service Health

```bash
# Check all containers
docker-compose -f infrastructure/docker/docker-compose.yml ps

# Check specific service
curl http://localhost:8081/actuator/health

# Check database connectivity
docker-compose -f infrastructure/docker/docker-compose.yml exec postgres psql -U helpinminutes -d helpinminutes -c "SELECT 1"

# Check Redis connectivity
docker-compose -f infrastructure/docker/docker-compose.yml exec redis redis-cli -a redis123 ping
```

### Restart Services

```bash
# Restart all services
docker-compose -f infrastructure/docker/docker-compose.yml restart

# Restart specific service
docker-compose -f infrastructure/docker/docker-compose.yml restart identity-service

# Full restart (stop + start)
docker-compose -f infrastructure/docker/docker-compose.yml down
docker-compose -f infrastructure/docker/docker-compose.yml up -d
```

### Database Issues

```bash
# Connect to database
docker-compose -f infrastructure/docker/docker-compose.yml exec postgres psql -U helpinminutes -d helpinminutes

# Check database size
SELECT pg_size_pretty(pg_database_size('helpinminutes'));

# Check active connections
SELECT count(*) FROM pg_stat_activity;

# Kill idle connections
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND datname = 'helpinminutes';
```

### Performance Tuning

```bash
# Check Docker stats
docker stats

# Check container resource usage
docker-compose -f infrastructure/docker/docker-compose.yml top

# Analyze slow queries
docker-compose -f infrastructure/docker/docker-compose.yml exec postgres psql -U helpinminutes -d helpinminutes -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query FROM pg_stat_activity WHERE state != 'idle' ORDER BY duration DESC LIMIT 5;"
```

### Emergency Procedures

```bash
# Full backup before major changes
./infrastructure/backup/backup.sh --type=full

# Restore from backup
./infrastructure/backup/restore.sh --type=full /backups/postgres/backup_file.sql.gz

# Scale down services (for maintenance)
docker-compose -f infrastructure/docker/docker-compose.yml scale identity-service=1

# Rollback to previous version
docker-compose -f infrastructure/docker/docker-compose.yml pull
docker-compose -f infrastructure/docker/docker-compose.yml up -d
```

## Security Checklist

- [ ] Change all default passwords
- [ ] Enable SSL/TLS for all services
- [ ] Configure firewall rules
- [ ] Enable audit logging
- [ ] Set up network segmentation
- [ ] Configure rate limiting
- [ ] Enable CORS policies
- [ ] Rotate secrets regularly
- [ ] Backup encryption keys
- [ ] Set up WAF rules
- [ ] Configure DDoS protection
