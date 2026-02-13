# 🚀 helpInMinutes

**Hyperlocal on-demand service marketplace** — connecting customers needing urgent help with nearby qualified helpers in minutes.

## Overview

helpInMinutes is an Uber-like platform for micro-tasks. A buyer posts an urgent task (fix a fuse, unclog a drain, deliver medicine), and the platform instantly matches them with the nearest available helper using H3 geospatial indexing.

## Features

- **🔐 Authentication** — JWT-based auth with email/password and Google OAuth
- **📍 H3 Geospatial Matching** — Sub-100ms helper discovery using Uber's H3 hexagonal grid
- **📋 Task Lifecycle** — Strict state machine (Created → Matching → Dispatched → Accepted → In Progress → Completed)
- **💰 Payments** — Razorpay integration (sandbox) with automatic fee splitting and social security deduction
- **👨‍💼 Admin Dashboard** — Next.js portal for KYC approval, skill management, task monitoring
- **🔄 Real-time Tracking** — Socket.io for live helper location streaming
- **🌐 i18n Ready** — English, Hindi, Telugu support in skill taxonomy
- **🐳 Docker** — One-command local setup

## Quick Start (Local Demo)

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for running tests locally)

### Option 1: Docker Compose (Recommended)

```bash
# Clone the repo
git clone <repo-url>
cd helpinminutes

# Copy environment file
cp .env.example .env

# Start all services
docker-compose up --build

# Services will be available at:
# Backend API:     http://localhost:8080
# Admin Dashboard: http://localhost:3000
# RabbitMQ UI:     http://localhost:15672 (guest/guest)
```

### Option 2: Manual Setup

```bash
# 1. Start infrastructure
docker-compose up -d postgres redis rabbitmq

# 2. Setup backend
cd backend
cp ../.env.example .env
npm install
npm run migrate
npm run seed
npm run dev

# 3. Setup frontend (new terminal)
cd frontend
npm install
npm run dev
```

### Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@helpinminutes.com | admin123 |
| Buyer | buyer@test.com | buyer123 |
| Helper | helper@test.com | helper123 |

## API Quick Reference

### Authentication
```bash
# Register
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","name":"Test User","role":"buyer"}'

# Login
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"buyer@test.com","password":"buyer123"}'
```

### Create a Task (as buyer)
```bash
curl -X POST http://localhost:8080/api/v1/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "title": "Fix leaky faucet",
    "description": "Kitchen faucet dripping",
    "lat": 17.4500,
    "lng": 78.3910,
    "subSkillId": "<sub_skill_uuid>"
  }'
```

### Get Skills
```bash
curl http://localhost:8080/api/v1/skills
curl http://localhost:8080/api/v1/skills?lang=hi  # Hindi
curl http://localhost:8080/api/v1/skills?lang=te  # Telugu
```

### Health Check
```bash
curl http://localhost:8080/health
```

## Running Tests

```bash
cd backend
npm install
npm test
```

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── index.js              # Express + Socket.io server
│   │   ├── db/
│   │   │   ├── pool.js           # PostgreSQL connection pool
│   │   │   ├── migrate.js        # Database migrations
│   │   │   └── seed.js           # Seed data (skills, test users)
│   │   ├── middleware/
│   │   │   └── auth.js           # JWT auth + RBAC middleware
│   │   ├── routes/
│   │   │   ├── auth.js           # Auth endpoints
│   │   │   ├── tasks.js          # Task CRUD + state machine
│   │   │   ├── helpers.js        # Helper registration + KYC
│   │   │   ├── skills.js         # Public skill taxonomy
│   │   │   ├── admin.js          # Admin operations
│   │   │   └── payments.js       # Razorpay integration
│   │   ├── services/
│   │   │   └── matching.js       # H3 matching engine
│   │   └── utils/
│   │       ├── geo.js            # H3 + Haversine utilities
│   │       └── logger.js         # Winston logger
│   ├── tests/
│   │   ├── auth.test.js          # Auth middleware tests
│   │   └── geo.test.js           # Geospatial utility tests
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── layout.js             # Root layout
│   │   └── page.js               # Admin dashboard SPA
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── .env.example
├── PLAN.md                        # Detailed project plan
└── README.md
```

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Monolith vs Microservices | Modular monolith | Faster MVP, easy to split later |
| H3 for matching | H3 resolution 9 | ~174m hex edge, ideal for urban matching |
| Optimistic locking for task accept | DB-level WHERE clause | Prevents double-assignment without distributed locks |
| Mock Razorpay | Local mock class | Works without API keys for demo |
| State machine in code | Explicit transition map | Prevents invalid state changes |

## Environment Variables

See [`.env.example`](.env.example) for all configuration options. Key variables:

- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — Secret for JWT signing
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` — Razorpay test keys
- `H3_RESOLUTION` — H3 grid resolution (default: 9)
- `SOCIAL_SECURITY_RATE` — Social security deduction rate (default: 0.01)

## License

MIT
