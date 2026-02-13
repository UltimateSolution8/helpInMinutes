# helpInMinutes — Project Plan

## 1. Vision & Overview

**helpInMinutes** is a hyperlocal on-demand service marketplace connecting customers needing urgent help with nearby qualified helpers. Think "Uber for micro-tasks" — a buyer posts an urgent task (e.g., unclog a drain, fix a fuse, deliver medicine), and the platform instantly matches them with the nearest available helper who has the right skills.

### Key Differentiators
- **Sub-minute matching** using Uber's H3 hexagonal grid system
- **Micro-task focus** — small, urgent tasks that major players don't serve
- **India-first** — KYC compliance, Razorpay payments, Telugu/Hindi/English i18n
- **Professional UX** — Uber/Ola quality experience for service marketplace

---

## 2. Architecture

### System Architecture
```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│  Mobile App  │────▶│   API Gateway │────▶│  Auth Service    │
│  (React      │     │   (Express)   │     │  (JWT + OAuth)   │
│   Native)    │     └──────┬───────┘     └─────────────────┘
└─────────────┘            │
                           ├──────────────▶ Task Service
┌─────────────┐            ├──────────────▶ Matching Engine (H3)
│  Admin Web   │            ├──────────────▶ Helper Service
│  (Next.js)   │────────────┤              ├──────────────▶ Payment Service
└─────────────┘            │              └──────────────▶ Real-time (Socket.io)
                           │
                    ┌──────┴───────┐
                    │  PostgreSQL   │
                    │  Redis Cache  │
                    │  RabbitMQ     │
                    └──────────────┘
```

### Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Backend API | Node.js + Express | Fast development, excellent ecosystem |
| Database | PostgreSQL | ACID compliance, JSON support, extensible |
| Cache | Redis | Sub-ms lookups for H3 helper index |
| Message Queue | RabbitMQ | Reliable event-driven task dispatch |
| Real-time | Socket.io | Low-latency location streaming |
| Admin Frontend | Next.js | SSR, React ecosystem |
| Mobile (future) | React Native | Cross-platform, shared logic |
| Geospatial | H3 (Uber) | O(1) proximity matching |
| Payments | Razorpay | India-native, UPI support |
| Auth | JWT + bcrypt | Stateless, scalable |
| Containerization | Docker Compose | One-command local setup |

---

## 3. Database Schema

### Core Entities
- **users** — Buyers, helpers, admins (role-based)
- **helper_profiles** — KYC status, location, skills, wallet
- **categories → skills → sub_skills** — 3-level skill taxonomy
- **tasks** — Task lifecycle with strict state machine
- **payments** — Razorpay integration with ledger entries
- **audit_logs** — Immutable audit trail

### Task State Machine
```
CREATED → MATCHING → DISPATCHED → ACCEPTED → IN_PROGRESS → COMPLETED
                                                            ↓
                        (any state) ──────────────────▶ CANCELLED
                                                        FAILED
```

---

## 4. API Design

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register buyer/helper |
| POST | `/api/v1/auth/login` | Email/password login |
| POST | `/api/v1/auth/oauth/google` | Google OAuth login |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Revoke refresh token |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/tasks` | Create task (buyer) |
| GET | `/api/v1/tasks` | List tasks |
| GET | `/api/v1/tasks/:id` | Get task details |
| POST | `/api/v1/tasks/:id/accept` | Accept task (helper, atomic) |
| POST | `/api/v1/tasks/:id/start` | Start task |
| POST | `/api/v1/tasks/:id/complete` | Complete task |
| DELETE | `/api/v1/tasks/:id` | Cancel task |

### Helpers
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/helpers/register` | Register helper |
| POST | `/api/v1/helpers/:id/kyc/upload` | Upload KYC docs |
| PATCH | `/api/v1/helpers/:id/status` | Toggle online/offline |
| POST | `/api/v1/helpers/:id/heartbeat` | Location heartbeat |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/payments/order` | Create Razorpay order |
| POST | `/api/v1/payments/webhook` | Razorpay webhook |
| POST | `/api/v1/payments/cash` | Confirm cash payment |
| POST | `/api/v1/payments/refund` | Issue refund (admin) |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/helpers/pending` | Pending KYC list |
| POST | `/api/v1/admin/helpers/:id/kyc` | Approve/reject KYC |
| GET/POST/DELETE | `/api/v1/admin/skills` | Skill CRUD |
| GET | `/api/v1/admin/tasks/active` | Active tasks |
| POST | `/api/v1/admin/tasks/:id/reassign` | Reassign/cancel |
| GET | `/api/v1/admin/dashboard` | Platform metrics |

---

## 5. Milestones

### Milestone 1: Foundation (Week 1-2)
- [x] Project structure and Docker setup
- [x] Database schema and migrations
- [x] Authentication (JWT + email/password + Google OAuth mock)
- [x] Role-based access control (buyer/helper/admin)
- [x] Skill taxonomy with seed data

### Milestone 2: Core Task Flow (Week 3-4)
- [x] Task creation with H3 geospatial indexing
- [x] Matching engine (H3 kRing + weighted scoring)
- [x] Atomic task acceptance (optimistic locking)
- [x] Task state machine with audit trail
- [x] Helper onboarding and KYC flow

### Milestone 3: Payments & Admin (Week 5-6)
- [x] Razorpay order creation (mock/sandbox)
- [x] Webhook verification and ledger entries
- [x] Cash payment flow
- [x] Social security fund deduction (1%)
- [x] Admin dashboard (Next.js)

### Milestone 4: Real-time & Polish (Week 7-8)
- [x] Socket.io real-time tracking
- [x] Helper location streaming
- [ ] Push notifications (FCM)
- [ ] i18n (Telugu, Hindi, English)
- [ ] Mobile app (React Native)

### Milestone 5: Production Readiness (Week 9-10)
- [ ] Load testing (500 RPS matching)
- [ ] Security audit (OWASP)
- [ ] Monitoring (Prometheus/Grafana)
- [ ] CI/CD pipeline
- [ ] Kubernetes deployment

---

## 6. Skill Taxonomy (Seed Data)

### Categories
1. **Emergency Home Services** — Plumbing, Electrical, Locksmith
2. **Appliance Repair & IT** — AC, WiFi, Printer
3. **Handyman & Carpentry** — Furniture, Shelving
4. **Logistics & Errands** — Medicine pickup, Document delivery
5. **Senior & Child Assistance** — Companion, Babysitter
6. **Pet Care** — Dog walking, Vet transport
7. **Automotive** — Jump start, Tyre puncture
8. **Cleaning & Housekeeping** — Quick clean, Pest control

### Sub-skill Examples
- `plumbing.drain_unclog` — Drain Unclogging (₹300)
- `electrical.socket_replace` — Socket/Switch Replace (₹350)
- `errand.medicine_pickup` — Medicine Pickup (₹150)
- `auto.jump_start` — Vehicle Jump Start (₹300)

---

## 7. Compliance & Business Rules

- **KYC**: Aadhaar + PAN verification required for helpers
- **Social Security**: 1% deduction from each transaction
- **Platform Fee**: 10% commission
- **Data Privacy**: DPDP Act compliance, PII encryption
- **Payment**: Razorpay (UPI/cards) + Cash with OTP confirmation

---

## 8. Testing Strategy

| Level | Tools | Coverage |
|-------|-------|----------|
| Unit | Jest | Geo utils, auth middleware, scoring |
| Integration | Supertest + Testcontainers | API endpoints, DB operations |
| E2E | Cypress | Admin dashboard flows |
| Performance | k6/Gatling | Matching engine <100ms |
