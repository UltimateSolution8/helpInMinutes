# Architecture Documentation

## System Architecture

HelpInMinutes follows a microservices architecture pattern with event-driven communication.

## Design Principles

1. **Separation of Concerns**: Each service has a single responsibility
2. **Loose Coupling**: Services communicate through well-defined APIs and events
3. **High Availability**: Multiple instances of each service behind load balancer
4. **Scalability**: Horizontal scaling with stateless services
5. **Resilience**: Circuit breakers, retries, and fallback mechanisms

## Service Communication

### Synchronous Communication

- REST APIs for client-facing operations
- gRPC for inter-service communication (optional)

### Asynchronous Communication

- RabbitMQ for event-driven messaging
- Topics: `task-events`, `payment-events`, `matching-events`

## Database Design

### PostgreSQL

Each service owns its database schema:

| Service | Database | Tables |
|---------|----------|--------|
| Identity | `identity_db` | users, refresh_tokens, audit_logs |
| Task | `task_db` | tasks, task_history, disputes |
| Matching | `matching_db` | helper_profiles, locations |
| Payment | `payment_db` | payments, payouts, ledger_entries |

### Redis

- Session storage
- Rate limiting
- Geospatial indices (H3)
- Cache for frequently accessed data

## Event Schema

### Task Events

```json
{
  "eventId": "uuid",
  "eventType": "TASK_CREATED",
  "timestamp": "2024-01-15T10:30:00Z",
  "payload": {
    "taskId": "task-123",
    "category": "CLEANING",
    "location": {
      "latitude": 40.7128,
      "longitude": -74.0060
    }
  }
}
```

### Payment Events

```json
{
  "eventId": "uuid",
  "eventType": "PAYMENT_COMPLETED",
  "timestamp": "2024-01-15T10:30:00Z",
  "payload": {
    "paymentId": "payment-123",
    "amount": 50.0,
    "taskId": "task-123"
  }
}
```

## Security Architecture

### Authentication Flow

```
┌──────────┐     ┌──────────────┐     ┌─────────────────┐
│  Client  │────▶│  Identity    │────▶│  JWT Token      │
│          │     │  Service     │     │  (Access+Refresh)│
└──────────┘     └──────────────┘     └─────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │  Redis Session  │
              │  (Blacklisting) │
              └─────────────────┘
```

### JWT Token Structure

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user-123",
    "email": "user@example.com",
    "roles": ["ROLE_USER"],
    "iat": 1705315800,
    "exp": 1705319400
  }
}
```

## Matching Algorithm

### H3 Geospatial Indexing

```
Resolution 9: ~0.5km² hexagons
Resolution 10: ~0.2km² hexagons
Resolution 11: ~0.08km² hexagons
```

### Ranking Formula

```
CompositeScore = w1 × RatingScore + 
                 w2 × DistanceScore + 
                 w3 × AvailabilityScore +
                 w4 × ExperienceScore

Where:
- RatingScore = (rating / 5.0)
- DistanceScore = 1 - (distance / max_distance)
- AvailabilityScore = is_available ? 1 : 0
- ExperienceScore = min(completed_tasks / 100, 1)
```

## Payment Flow

```
Customer          Task Svc       Matching Svc    Payment Svc    Razorpay
   │                 │                │               │              │
   │─Create Task──▶  │                │               │              │
   │                 │─Publish Event▶│               │              │
   │                 │                │─Find Helper──▶│              │
   │◀─Task Created──│                │               │              │
   │                 │                │               │              │
   │─Accept Helper──▶│                │               │              │
   │                 │─Dispatch──────▶│               │              │
   │                 │                │               │              │
   │─Payment────────▶│                │               │─Create Order▶│
   │                 │                │               │◀─Order ID────│
   │◀─Payment Link───│                │               │              │
   │                 │                │               │              │
   │─────────────────│────────────────│──────────────▶│─Capture─────▶│
   │                 │                │               │◀─Success─────│
   │◀─Task Start─────│────────────────│───────────────│              │
   │                 │                │               │              │
   │─Complete────────▶│                │               │              │
   │                 │                │               │─Payout──────▶│
   │◀─Task Complete──│────────────────│───────────────│              │
```

## Scalability Patterns

### Horizontal Scaling

```
                    Load Balancer
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
   [Identity]         [Identity]        [Identity]
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
                    Shared Redis
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
   [PostgreSQL]      [PostgreSQL]      [PostgreSQL]
     (Primary)        (Replica)          (Replica)
```

### Caching Strategy

| Data | Cache Key | TTL | Strategy |
|------|-----------|-----|----------|
| User Profile | `user:{id}` | 1 hour | Write-through |
| Task List | `tasks:{user}:{page}` | 5 min | Read-through |
| Helper Location | `location:{id}` | 30 sec | Write-behind |

## Monitoring Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                      Prometheus Server                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐   │
│  │Service 1│  │Service 2│  │Service 3│  │ Infrastructure  │   │
│  └────┬────┘  └────┬────┘  └────┬────┘  └─────────────────┘   │
│       └────────────┼────────────┘            │                  │
│                    │                         │                  │
└────────────────────┼─────────────────────────┼──────────────────┘
                     │                         │
              ┌──────┴──────┐                 │
              │  Grafana    │◀────────────────┘
              │  Dashboard  │
              └─────────────┘
                     │
              ┌──────┴──────┐
              │  Alertmanager│
              └─────────────┘
```

## Disaster Recovery

### Backup Strategy

| Data | Frequency | Retention | Storage |
|------|-----------|-----------|---------|
| Database | Hourly + WAL | 30 days | S3 |
| Redis RDB | Every 5 min | 7 days | S3 |
| Logs | Real-time | 90 days | S3 + Loki |

### Recovery Procedures

1. **Database Recovery**: Point-in-time recovery from WAL logs
2. **Service Recovery**: Auto-scaling and health checks
3. **Data Corruption**: Restore from latest backup

## Security Measures

### Network Security

- TLS 1.3 for all communications
- VPC isolation for internal services
- WAF for API protection
- Rate limiting per IP/user

### Data Security

- AES-256 encryption at rest
- PII masking in logs
- GDPR compliance
- Regular security audits
