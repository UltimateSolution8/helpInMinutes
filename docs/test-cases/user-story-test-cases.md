# HelpInMinutes User Story Test Cases

This document contains comprehensive test cases for all user stories defined in the HelpInMinutes platform specification.

---

## Table of Contents

1. [Authentication & Identity](#1-authentication--identity)
2. [Buyer Flows](#2-buyer-flows)
3. [Helper Flows & KYC](#3-helper-flows--kyc)
4. [Matching & Geospatial](#4-matching--geospatial)
5. [Real-time & Notifications](#5-real-time--notifications)
6. [Payments & Finance](#6-payments--finance)
7. [Admin & Ops](#7-admin--ops)
8. [Localization, i18n & UX](#8-localization-i18n--ux)
9. [Security, Privacy & Compliance](#9-security-privacy--compliance)

---

## 1. Authentication & Identity

### US-AUTH-01 — OAuth + Email Login

**User Story:** As a user (buyer/helper) I want to sign up/login using Google OAuth or email/password so that onboarding is frictionless and secure.

**Acceptance Criteria:**
- [ ] Google OAuth returns a JWT issued by backend
- [ ] Email/password path supports signup+email verification
- [ ] Duplicate emails cannot be created
- [ ] JWT expires and refresh tokens exist

**Test Cases:**

| Test ID | Test Type | Description | Steps | Expected Result | Status |
|---------|-----------|-------------|-------|-----------------|--------|
| AUTH-TC-01 | Unit | Validate JWT token parsing and claim extraction | Mock JWT token, extract claims | Claims correctly parsed (userId, role, expiry) | ☐ |
| AUTH-TC-02 | Unit | JWT generation with correct claims | Create token for test user | Token contains userId, role, iat, exp | ☐ |
| AUTH-TC-03 | Integration | Google OAuth flow (test mode) | Send test Google ID token to /api/v1/auth/oauth/google | Returns valid JWT access token and refresh token | ☐ |
| AUTH-TC-04 | Integration | Email/password signup | POST /api/v1/auth/register with email/password | User created, verification email sent | ☐ |
| AUTH-TC-05 | Integration | Email/password login | POST /api/v1/auth/login with valid credentials | Returns JWT tokens | ☐ |
| AUTH-TC-06 | Integration | Duplicate email prevention | Attempt signup with existing email | Returns 409 Conflict | ☐ |
| AUTH-TC-07 | Security | Expired token rejection | Call protected API with expired JWT | Returns 401 Unauthorized | ☐ |
| AUTH-TC-08 | Security | Token replay detection | Reuse same refresh token twice | Second attempt returns 401 | ☐ |
| AUTH-TC-09 | Performance | Auth endpoint throughput | Simulate 500 req/s | All requests processed within 200ms | ☐ |
| AUTH-TC-10 | E2E | Complete buyer signup → login → profile fetch | Full user journey | User successfully authenticated and profile accessible | ☐ |

---

### US-AUTH-02 — Role Based Access Control (RBAC)

**User Story:** As an admin/devops engineer I want APIs gated by roles (admin/buyer/helper/system) so that unauthorized actions are blocked.

**Acceptance Criteria:**
- [ ] Admin endpoints require role=admin in JWT claims
- [ ] Helper-only endpoints require role=helper
- [ ] Attempt by wrong role returns 403

**Test Cases:**

| Test ID | Test Type | Description | Steps | Expected Result | Status |
|---------|-----------|-------------|-------|-----------------|--------|
| AUTH-RBAC-01 | Unit | Middleware rejects buyer on admin endpoint | Mock request with buyer role | Middleware returns 403 | ☐ |
| AUTH-RBAC-02 | Unit | Middleware allows admin on admin endpoint | Mock request with admin role | Middleware passes through | ☐ |
| AUTH-RBAC-03 | Integration | Buyer cannot access helper-only API | Call /api/v1/helpers/{id}/tasks with buyer token | Returns 403 Forbidden | ☐ |
| AUTH-RBAC-04 | Integration | Admin can access admin APIs | Call /api/v1/admin/helpers/pending with admin token | Returns 200 with pending helpers | ☐ |
| AUTH-RBAC-05 | E2E | Automated role assignment lifecycle | Create helper user, verify role=helper | Role correctly assigned | ☐ |

---

### US-AUTH-04 — Session Revocation & Device Management

**User Story:** As a user I want to view and revoke active sessions/devices so that I can terminate access if device is lost.

**Acceptance Criteria:**
- [ ] API to list sessions, devices, last seen IP, revoke token

**Test Cases:**

| Test ID | Test Type | Description | Steps | Expected Result | Status |
|---------|-----------|-------------|-------|-----------------|--------|
| AUTH-SESS-01 | Unit | Token revocation marks token invalid | Revoke access token | Token marked invalid in blacklist | ☐ |
| AUTH-SESS-02 | Integration | Revoke token and call API | Call protected endpoint with revoked token | Returns 401 Unauthorized | ☐ |
| AUTH-SESS-03 | Integration | List active sessions | GET /api/v1/auth/sessions | Returns list of active sessions with device info | ☐ |

---

## 2. Buyer Flows

### US-BUYER-01 — Create Urgent Task

**User Story:** As a buyer I want to create an urgent task with title, description, location, chosen sub-skill, photos and optional voice note so that helpers understand the job clearly.

**Acceptance Criteria:**
- [ ] Task saved with CREATED state, valid geocoordinates, and computed H3 index
- [ ] API returns task id and estimated search time

**Test Cases:**

| Test ID | Test Type | Description | Steps | Expected Result | Status |
|---------|-----------|-------------|-------|-----------------|--------|
| BUYER-CRT-01 | Unit | Validate Task DTO schema | Create TaskRequest with valid data | All fields validated correctly | ☐ |
| BUYER-CRT-02 | Unit | H3 conversion for known coordinates | geoToH3(17.4500, 78.3910, 9) | Returns expected H3 index | ☐ |
| BUYER-CRT-03 | Integration | POST /api/v1/tasks with attachments | Create task with photo attachment | DB row created, message published to queue | ☐ |
| BUYER-CRT-04 | Integration | Task creation without location | POST /api/v1/tasks without lat/lng | Returns 400 Bad Request | ☐ |
| BUYER-CRT-05 | Integration | Attachment size limit exceeded | POST with 15MB attachment | Returns 413 Payload Too Large | ☐ |
| BUYER-CRT-06 | E2E | Buyer creates task from app | Fill form and submit task | UI shows "Searching for helper..." | ☐ |
| BUYER-CRT-07 | Performance | Creation latency under load | Create 100 tasks concurrently | Average latency < 120ms | ☐ |

---

### US-BUYER-02 — Cancel Task with Reason & Fees

**User Story:** As a buyer I want to cancel task and see potential cancellation fees or penalties so that flow is transparent.

**Acceptance Criteria:**
- [ ] Cancellation allowed in certain status windows
- [ ] Recorded reason, potential refund processing

**Test Cases:**

| Test ID | Test Type | Description | Steps | Expected Result | Status |
|---------|-----------|-------------|-------|-----------------|--------|
| BUYER-CAN-01 | Integration | Cancel before match | Create task, cancel immediately | Full refund initiated | ☐ |
| BUYER-CAN-02 | Integration | Cancel after helper started | Helper accepts task, buyer cancels | Cancellation fee applied | ☐ |
| BUYER-CAN-03 | Integration | Race condition - simultaneous cancel/accept | Both buyer cancels and helper accepts at same time | Exactly one action succeeds (atomic) | ☐ |
| BUYER-CAN-04 | Integration | Cancel completed task | Attempt to cancel COMPLETED task | Returns 400 Cannot cancel | ☐ |

---

### US-BUYER-03 — Track Helper Live

**User Story:** As a buyer I want to see helper approach on map in real time (ETA + distance) so that I know when they will arrive.

**Acceptance Criteria:**
- [ ] Buyer sees helper under 5s latency updates
- [ ] Helper's ETA computed
- [ ] If tracking fails, buyer notified

**Test Cases:**

| Test ID | Test Type | Description | Steps | Expected Result | Status |
|---------|-----------|-------------|-------|-----------------|--------|
| BUYER-TRK-01 | Integration | WebSocket subscription | Buyer connects to /ws, joins task room | Connection established | ☐ |
| BUYER-TRK-02 | Integration | Location streaming | Helper emits location 1Hz | Buyer receives updates within 2s | ☐ |
| BUYER-TRK-03 | Integration | ETA calculation | Helper at known position | ETA displayed correctly | ☐ |
| BUYER-TRK-04 | Performance | 100k active map watchers | Simulate 100k concurrent connections | System remains responsive | ☐ |
| BUYER-TRK-05 | Fault | Helper disconnects | Helper socket disconnects for >30s | Buyer notified of tracking issue | ☐ |

---

### US-BUYER-04 — Payment and Receipt

**User Story:** As a buyer I want to pay via Razorpay or mark cash, see receipt and transaction status so that transaction is auditable.

**Acceptance Criteria:**
- [ ] Razorpay order created on server, order_id returned
- [ ] Webhook verifies payment and updates task status to PAID
- [ ] Receipts contain taxes, platform fee, social security reserve

**Test Cases:**

| Test ID | Test Type | Description | Steps | Expected Result | Status |
|---------|-----------|-------------|-------|-----------------|--------|
| BUYER-PAY-01 | Integration | Create payment order | POST /api/v1/payments/order | Razorpay order created, order_id returned | ☐ |
| BUYER-PAY-02 | Integration | Payment webhook success | Send valid Razorpay webhook | Payment captured, task status PAID | ☐ |
| BUYER-PAY-03 | Integration | Cash payment confirmation | Mark task as cash paid | Receipt generated | ☐ |
| BUYER-PAY-04 | Integration | Receipt generation | Request receipt after payment | Receipt with tax breakdown | ☐ |
| BUYER-PAY-05 | Security | Webhook signature verification | Send webhook with invalid signature | Returns 400 Invalid signature | ☐ |

---

### US-BUYER-05 — History & Dispute Raise

**User Story:** As a buyer I want full history of tasks and ability to raise disputes (with evidence) so that I can request refunds or support.

**Acceptance Criteria:**
- [ ] Dispute endpoint accepts attachments and links to task
- [ ] Queued for human review

**Test Cases:**

| Test ID | Test Type | Description | Steps | Expected Result | Status |
|---------|-----------|-------------|-------|-----------------|--------|
| BUYER-HIST-01 | Integration | Get task history | GET /api/v1/tasks?status=all | Returns paginated task list | ☐ |
| BUYER-DIS-01 | Integration | Raise dispute | POST /api/v1/tasks/{id}/dispute with evidence | Dispute created, queued for review | ☐ |
| BUYER-DIS-02 | Integration | Dispute escalation | Multiple disputes on same task | Flagged for priority review | ☐ |

---

### US-BUYER-06 — Localized UX & Language Fallback

**User Story:** As a buyer I want app in Telugu, Hindi, or English and maps / strings translate properly so that I can use app comfortably.

**Acceptance Criteria:**
- [ ] Strings loaded from i18n files
- [ ] Text renders without clipping

**Test Cases:**

| Test ID | Test Type | Description | Steps | Expected Result | Status |
|---------|-----------|-------------|-------|-----------------|--------|
| BUYER-I18N-01 | UI | Switch to Telugu | Change app language to te | All text appears in Telugu | ☐ |
| BUYER-I18N-02 | UI | Switch to Hindi | Change app language to hi | All text appears in Hindi | ☐ |
| BUYER-I18N-03 | UI | Telugu text no clipping | Render all screens in Telugu | No text overflow/clipping | ☐ |

---

### US-BUYER-07 — Retry if No Helpers Found

**User Story:** As a buyer I want automatic progressive widening of search radius and/or options to retry so that I get matched even in sparse areas.

**Acceptance Criteria:**
- [ ] After rings 0→1→2, if no helper found, present options

**Test Cases:**

| Test ID | Test Type | Description | Steps | Expected Result | Status |
|---------|-----------|-------------|-------|-----------------|--------|
| BUYER-TRY-01 | Functional | kRing progression | No helpers in ring 0 | Expands to ring 1 automatically | ☐ |
| BUYER-TRY-02 | Functional | Final fallback | No helpers in rings 0-2 | Shows retry/widen options | ☐ |

---

### US-BUYER-08 — Privacy: Hide Precise Helper Location

**User Story:** As a buyer I want helper's exact location obfuscated until within 100m for privacy reasons so that helper privacy is preserved.

**Acceptance Criteria:**
- [ ] Map initially shows approximate area
- [ ] Precise marker revealed when within proximity

**Test Cases:**

| Test ID | Test Type | Description | Steps | Expected Result | Status |
|---------|-----------|-------------|-------|-----------------|--------|
| BUYER-PRIV-01 | Functional | Helper at 500m | Buyer views map | Shows approximate area only | ☐ |
| BUYER-PRIV-02 | Functional | Helper at 50m | Buyer views map | Shows exact location | ☐ |

---

## 3. Helper Flows & KYC

### US-HELPER-01 — Register + Upload KYC Docs

**User Story:** As a helper I want to register and upload Aadhaar/PAN/bank details and certificates so that I can be approved and receive tasks.

**Acceptance Criteria:**
- [ ] Files stored securely, OCR attempted, profile PENDING state
- [ ] Admin sees them

**Test Cases:**

| Test ID | Test Type | Description | Steps | Expected Result | Status |
|---------|-----------|-------------|-------|-----------------|--------|
| HELP-REG-01 | Integration | Helper registration | POST /api/v1/helpers/register | Helper created with PENDING KYC status | ☐ |
| HELP-KYC-01 | Integration | Upload KYC documents | POST /api/v1/helpers/{id}/kyc/upload | Documents stored, status updated | ☐ |
| HELP-KYC-02 | Security | File type validation | Upload executable file | Rejected with 400 | ☐ |
| HELP-KYC-03 | Security | File size limit | Upload 20MB image | Rejected with 413 | ☐ |
| HELP-KYC-04 | Security | PII encryption at rest | Read KYC document from DB | Data is encrypted | ☐ |

---

### US-HELPER-03 — Go Online (Foreground Location Service)

**User Story:** As a helper I want to toggle Online and have the app stream location in foreground safely so that I receive urgent tasks.

**Acceptance Criteria:**
- [ ] When online, location updated at configurable interval (e.g., 5s)
- [ ] Background/lock screen running via Android foreground service

**Test Cases:**

| Test ID | Test Type | Description | Steps | Expected Result | Status |
|---------|-----------|-------------|-------|-----------------|--------|
| HELP-ONL-01 | Functional | Toggle online | Helper toggles "Online" | Status updated, location streaming starts | ☐ |
| HELP-ONL-02 | Functional | Toggle offline | Helper toggles "Offline" | Stops receiving new tasks | ☐ |
| HELP-ONL-03 | Integration | Location update | Helper app sends heartbeat | Location stored in Redis | ☐ |
| HELP-ONL-04 | Power | Battery optimization | Simulate poor signal | Exponential backoff applied | ☐ |

---

### US-HELPER-04 — Receive & Accept Task Reliably

**User Story:** As a helper I want urgent tasks to appear with audio/overlay and accept/reject options so that I can respond quickly.

**Acceptance Criteria:**
- [ ] Notification high priority, overlay shown
- [ ] Accepting claims task atomically (first accept wins)

**Test Cases:**

| Test ID | Test Type | Description | Steps | Expected Result | Status |
|---------|-----------|-------------|-------|-----------------|--------|
| HELP-ACC-01 | Integration | Accept task | POST /api/v1/tasks/{id}/accept | Task status updated to ACCEPTED | ☐ |
| HELP-ACC-02 | Concurrency | Multiple helpers accept same task | 10 helpers try to accept simultaneously | Only 1 succeeds, others get 409 | ☐ |
| HELP-ACC-03 | Concurrency | Race condition test | Helper A and B accept at exact same millisecond | Exactly one gets the task (DB transaction) | ☐ |
| HELP-ACC-04 | UI | Task alert overlay | Receive task alert | Full-screen overlay with Accept/Reject | ☐ |

---

### US-HELPER-05 — Earnings & Payouts

**User Story:** As a helper I want daily earnings summary and request payouts to bank with KYC checks so that I can get paid on time.

**Acceptance Criteria:**
- [ ] Wallet updated after task completion
- [ ] Payout request triggers transfer process

**Test Cases:**

| Test ID | Test Type | Description | Steps | Expected Result | Status |
|---------|-----------|-------------|-------|-----------------|--------|
| HELP-ERN-01 | Integration | View earnings | GET /api/v1/helpers/{id}/earnings | Returns daily/weekly/monthly totals | ☐ |
| HELP-PAY-01 | Integration | Request payout | POST /api/v1/payments/payout | Payout queued, status pending | ☐ |
| HELP-PAY-02 | Integration | Payout success | Mock payout provider success | Helper wallet debited | ☐ |
| HELP-PAY-03 | Integration | Payout failure | Mock payout provider failure | Payout status failed, notification sent | ☐ |

---

### US-HELPER-08 — Safety & Incident Reporting

**User Story:** As a helper I want a panic/Emergency button that alerts admin and buyer and logs location so that I can get help in unsafe situations.

**Acceptance Criteria:**
- [ ] Panic → immediate notification to admin with latest location
- [ ] Open incident ticket

**Test Cases:**

| Test ID | Test Type | Description | Steps | Expected Result | Status |
|---------|-----------|-------------|-------|-----------------|--------|
| HELP-SAF-01 | Functional | Trigger panic button | Helper taps emergency button | Incident created, admin notified | ☐ |
| HELP-SAF-02 | Integration | Incident location logged | Panic triggered | Location captured and stored | ☐ |

---

## 4. Matching & Geospatial

### US-MATCH-01 — H3 Index and kRing Based Candidate Discovery

**User Story:** As a system I want to convert buyer lat/lng to H3 and search neighboring cells (kRing) for online helpers so that matching is sub-100ms and scalable.

**Acceptance Criteria:**
- [ ] H3 resolution R9 used
- [ ] kRing(0→2) expansion sequence implemented

**Test Cases:**

| Test ID | Test Type | Description | Steps | Expected Result | Status |
|---------|-----------|-------------|-------|-----------------|--------|
| MATCH-H3-01 | Unit | H3 conversion test vectors | geoToH3 for known coords | Expected index returned | ☐ |
| MATCH-H3-02 | Unit | kRing generation | kRing(index, 2) | Returns correct neighboring cells | ☐ |
| MATCH-H3-03 | Integration | Helper discovery | Insert helpers in known cells | Correct candidates returned | ☐ |
| MATCH-H3-04 | Performance | Matching latency | Create 100 tasks | Average latency < 100ms | ☐ |
| MATCH-H3-05 | Boundary | Border cell coverage | Helper on border of two cells | Helper appears in kRing results | ☐ |

---

### US-MATCH-03 — Matching Concurrency & Atomic Locking

**User Story:** As a system I want to prevent double allocation (2 helpers assigned same task) using atomic claims so that task state stays consistent.

**Acceptance Criteria:**
- [ ] Accept action uses DB transaction or distributed lock

**Test Cases:**

| Test ID | Test Type | Description | Steps | Expected Result | Status |
|---------|-----------|-------------|-------|-----------------|--------|
| MATCH-ATOM-01 | Concurrency | 100 simultaneous accepts | 100 helpers try to accept same task | Exactly 1 succeeds | ☐ |
| MATCH-ATOM-02 | Integration | Distributed lock acquisition | Helper A acquires lock lock:task:{id} | Lock held by A only | ☐ |
| MATCH-ATOM-03 | Integration | Lock release on completion | Task completed | Lock released | ☐ |

---

### US-MATCH-05 — Cached Online Helper Index (Redis)

**User Story:** As a system I want online helpers indexed by H3 cell in Redis for sub-ms candidate retrieval so that matching avoids DB hits at scale.

**Acceptance Criteria:**
- [ ] Redis structure updated on helper location change
- [ ] Invalidation on offline

**Test Cases:**

| Test ID | Test Type | Description | Steps | Expected Result | Status |
|---------|-----------|-------------|-------|-----------------|--------|
| MATCH-RED-01 | Integration | Helper goes online | Update Redis index | Helper added to H3 cell set | ☐ |
| MATCH-RED-02 | Integration | Helper location update | Send heartbeat | Redis index updated with new cell | ☐ |
| MATCH-RED-03 | Integration | Helper goes offline | Update status | Removed from Redis index | ☐ |
| MATCH-RED-04 | Consistency | Index matches DB | Compare Redis helpers vs DB | Sets are consistent | ☐ |

---

## 5. Real-time & Notifications

### US-RT-01 — WebSocket / Socket.io Channel for Tracking

**User Story:** As a buyer/helper I want low-latency location and status updates streamed via WebSocket so that map tracking and state transitions are real-time.

**Acceptance Criteria:**
- [ ] Authenticate socket with JWT
- [ ] Broker messages only for participants of a task

**Test Cases:**

| Test ID | Test Type | Description | Steps | Expected Result | Status |
|---------|-----------|-------------|-------|-----------------|--------|
| RT-WS-01 | Integration | Socket connection | Connect with valid JWT | Connection established | ☐ |
| RT-WS-02 | Integration | Join task room | Socket joins task:{id} | Room joined successfully | ☐ |
| RT-WS-03 | Integration | Location broadcast | Helper emits location | All room members receive update | ☐ |
| RT-WS-04 | Security | Invalid token | Connect with expired JWT | Connection rejected | ☐ |
| RT-WS-05 | Fault | Network drop simulation | Disconnect and reconnect | Reconnection succeeds, missed messages minimal | ☐ |

---

### US-RT-02 — Push Notifications with FCM

**User Story:** As a helper/buyer I want push notifications for important events (task alert, payment, admin message) so that I get notified when app is backgrounded.

**Acceptance Criteria:**
- [ ] FCM tokens registered and validated
- [ ] Notifications localized

**Test Cases:**

| Test ID | Test Type | Description | Steps | Expected Result | Status |
|---------|-----------|-------------|-------|-----------------|--------|
| RT-FCM-01 | Integration | Register FCM token | POST /api/v1/notifications/token | Token stored | ☐ |
| RT-FCM-02 | Integration | Send notification | Use test FCM token | Notification delivered | ☐ |
| RT-FCM-03 | Integration | Expired token handling | Send to expired FCM token | Token marked invalid | ☐ |
| RT-FCM-04 | Localization | Localized notification | Send to Hindi user | Message in Hindi | ☐ |

---

### US-RT-04 — Delivery of Exact N Top Candidate Notifications

**User Story:** As a system I want to fan-out task notifications to top-k helpers only so that not all helpers are spammed.

**Acceptance Criteria:**
- [ ] Exactly configured number of helpers get dispatch

**Test Cases:**

| Test ID | Test Type | Description | Steps | Expected Result | Status |
|---------|-----------|-------------|-------|-----------------|--------|
| RT-FAN-01 | Integration | Task dispatch | Publish to task.dispatch queue | Exactly N consumers receive message | ☐ |
| RT-FAN-02 | Logging | Message count verification | Check consumer logs | Exactly N messages logged | ☐ |

---

## 6. Payments & Finance

### US-PAY-01 — Razorpay Order & Capture Flow

**User Story:** As a system I want to create an order on backend and capture payment after completion so that funds flow is reliable and traceable.

**Acceptance Criteria:**
- [ ] Server creates Razorpay order and returns order_id
- [ ] Webhook validates signature and marks payment CAPTURED

**Test Cases:**

| Test ID | Test Type | Description | Steps | Expected Result | Status |
|---------|-----------|-------------|-------|-----------------|--------|
| PAY-ORD-01 | Integration | Create order | POST /api/v1/payments/order | Razorpay order created | ☐ |
| PAY-ORD-02 | Integration | Order amount validation | Create order with negative amount | Returns 400 | ☐ |
| PAY-WH-01 | Integration | Successful webhook | Send valid Razorpay webhook | Payment status CAPTURED | ☐ |
| PAY-WH-02 | Security | Invalid signature | Send webhook with wrong signature | Returns 400 | ☐ |
| PAY-WH-03 | Idempotency | Duplicate webhook | Send same webhook twice | Only first processed | ☐ |

---

### US-PAY-02 — Cash Confirmation Code Flow

**User Story:** As a buyer/helper I want cash payments to be confirmed via OTP/code on completion so that platform has proof of cash settlement.

**Acceptance Criteria:**
- [ ] Helper gets one-time code buyer provides to confirm cash transfer

**Test Cases:**

| Test ID | Test Type | Description | Steps | Expected Result | Status |
|---------|-----------|-------------|-------|-----------------|--------|
| PAY-CASH-01 | Integration | Generate payment code | Task marked complete, no online payment | 6-digit code generated | ☐ |
| PAY-CASH-02 | Integration | Confirm cash payment | Helper enters buyer's code | Payment confirmed | ☐ |
| PAY-CASH-03 | Integration | Invalid code | Helper enters wrong code | Confirmation failed | ☐ |

---

### US-PAY-03 — Platform Fees, Tax, Social Security Reserve

**User Story:** As a finance admin I want fees and statutory reservations auto-calculated and recorded per transaction so that revenue and liabilities are auditable.

**Acceptance Criteria:**
- [ ] Audit logs show fee splits, platform revenue, worker reserve

**Test Cases:**

| Test ID | Test Type | Description | Steps | Expected Result | Status |
|---------|-----------|-------------|-------|-----------------|--------|
| PAY-FEE-01 | Integration | Fee calculation | Task amount ₹1000 | Platform fee ₹100, SS reserve ₹10 | ☐ |
| PAY-FEE-02 | Integration | Ledger entries | Payment captured | Multiple ledger entries created | ☐ |
| PAY-FEE-03 | Reconciliation | Financial reconciliation | Sample transactions | All amounts balance | ☐ |

---

## 7. Admin & Ops

### US-ADMIN-01 — Helper KYC Approval UI

**User Story:** As an admin I want to view KYC docs, OCR results, confidence scores and approve/reject helpers so that platform remains compliant.

**Acceptance Criteria:**
- [ ] Approve/reject buttons with reason required for reject

**Test Cases:**

| Test ID | Test Type | Description | Steps | Expected Result | Status |
|---------|-----------|-------------|-------|-----------------|--------|
| ADMIN-KYC-01 | UI | View pending helpers | Navigate to KYC queue | Shows pending helpers with docs | ☐ |
| ADMIN-KYC-02 | Integration | Approve helper | POST /api/v1/admin/helpers/{id}/kyc/approve | Helper status ACTIVE | ☐ |
| ADMIN-KYC-03 | Integration | Reject helper | POST with reason | Helper status REJECTED | ☐ |
| ADMIN-KYC-04 | Audit | Audit log created | Approve or reject action | Audit entry with admin_id, timestamp | ☐ |
| ADMIN-KYC-05 | Security | Non-admin access | Non-admin tries to approve | Returns 403 | ☐ |

---

### US-ADMIN-02 — Skill Taxonomy Editor (Tree)

**User Story:** As an admin I want to add/edit/delete categories, skills and sub-skills with translations so that marketplace can evolve.

**Acceptance Criteria:**
- [ ] Changes apply to buyer/helper UI immediately

**Test Cases:**

| Test ID | Test Type | Description | Steps | Expected Result | Status |
|---------|-----------|-------------|-------|-----------------|--------|
| ADMIN-SKL-01 | Integration | Create skill | POST /api/v1/admin/skills | Skill created | ☐ |
| ADMIN-SKL-02 | Integration | Update skill | PUT /api/v1/admin/skills | Skill updated | ☐ |
| ADMIN-SKL-03 | Integration | Delete skill | DELETE /api/v1/admin/skills | Skill deleted | ☐ |
| ADMIN-SKL-04 | Propagation | Buyer sees new skill | Create skill, refresh buyer app | New skill appears | ☐ |

---

### US-ADMIN-03 — Task Intervening & Reassignment

**User Story:** As an admin I want to view active tasks and reassign or cancel if needed so that platform can handle exceptions.

**Acceptance Criteria:**
- [ ] Admin action updates state, notifies buyer/helper, logs reason

**Test Cases:**

| Test ID | Test Type | Description | Steps | Expected Result | Status |
|---------|-----------|-------------|-------|-----------------|--------|
| ADMIN-TASK-01 | Integration | List active tasks | GET /api/v1/admin/tasks/active | Shows all active tasks | ☐ |
| ADMIN-TASK-02 | Integration | Reassign task | POST /api/v1/admin/tasks/{id}/reassign | New helper notified | ☐ |
| ADMIN-TASK-03 | Integration | Cancel task | POST /api/v1/admin/tasks/{id}/reassign (cancel) | Task cancelled, parties notified | ☐ |
| ADMIN-TASK-04 | Audit | Audit log | Reassign or cancel action | Audit entry created | ☐ |

---

### US-ADMIN-05 — Audit Logs & GDPR/DPDP Compliance

**User Story:** As compliance officer I want immutable audit logs for critical actions and data retention policy applied so that legal obligations are met.

**Acceptance Criteria:**
- [ ] Logs stored in append-only store
- [ ] Retention rules apply

**Test Cases:**

| Test ID | Test Type | Description | Steps | Expected Result | Status |
|---------|-----------|-------------|-------|-----------------|--------|
| ADMIN-AUD-01 | Integration | Audit log creation | Any admin action | Audit entry created | ☐ |
| ADMIN-AUD-02 | Security | Log immutability | Attempt to modify audit log | Modification rejected | ☐ |
| ADMIN-AUD-03 | Compliance | Data retention | Query logs older than retention period | Flagged for purge | ☐ |

---

## 8. Localization, i18n & UX

### US-I18N-01 — Dynamic Translations via API

**User Story:** As product manager I want translation strings to be updatable via admin API so copy fixes do not require app redeploys.

**Acceptance Criteria:**
- [ ] API updates translation bundles

**Test Cases:**

| Test ID | Test Type | Description | Steps | Expected Result | Status |
|---------|-----------|-------------|-------|-----------------|--------|
| I18N-API-01 | Integration | Update translation | PUT /api/v1/admin/i18n/{key} | Translation updated | ☐ |
| I18N-API-02 | E2E | App reflects change | App fetches new translations | UI shows updated text | ☐ |

---

### US-I18N-02 — Telugu/Hindi UI Accuracy & Layout Checks

**User Story:** As QA I want snapshot tests for Telugu and Hindi layouts so that no clipping or overflow happens.

**Acceptance Criteria:**
- [ ] All screens pass snapshot diff checks

**Test Cases:**

| Test ID | Test Type | Description | Steps | Expected Result | Status |
|---------|-----------|-------------|-------|-----------------|--------|
| I18N-SNAP-01 | UI | Telugu snapshot tests | Run snapshot tests with te locale | No diffs or approved diffs | ☐ |
| I18N-SNAP-02 | UI | Hindi snapshot tests | Run snapshot tests with hi locale | No diffs or approved diffs | ☐ |

---

## 9. Security, Privacy & Compliance

### US-SEC-01 — Transport + Storage Encryption

**User Story:** As security engineer I want TLS for all endpoints and encryption at rest for PII so that data is protected.

**Acceptance Criteria:**
- [ ] TLS certs applied
- [ ] DB fields for Aadhaar/PAN encrypted with KMS

**Test Cases:**

| Test ID | Test Type | Description | Steps | Expected Result | Status |
|---------|-----------|-------------|-------|-----------------|--------|
| SEC-TLS-01 | Security | HTTP redirects to HTTPS | curl http://api | Redirects to HTTPS | ☐ |
| SEC-ENC-01 | Security | Encrypted PII at rest | Read Aadhaar number from DB | Returns encrypted data | ☐ |
| SEC-ENC-02 | Security | Decrypt with KMS | Decrypt encrypted PII | Returns plaintext | ☐ |

---

### US-SEC-03 — Rate Limiting & Abuse Protection

**User Story:** As platform I want per-IP rate limits, global throttles and CAPTCHA on suspicious flows so that abuse is mitigated.

**Acceptance Criteria:**
- [ ] Rate limit enforced
- [ ] Suspicious flows flagged

**Test Cases:**

| Test ID | Test Type | Description | Steps | Expected Result | Status |
|---------|-----------|-------------|-------|-----------------|--------|
| SEC-RATE-01 | Security | Brute force protection | 100 failed login attempts from IP | Rate limited | ☐ |
| SEC-RATE-02 | Security | Global throttle | 1000 requests/second | Throttled gracefully | ☐ |
| SEC-RATE-03 | Security | CAPTCHA trigger | Suspicious activity detected | CAPTCHA presented | ☐ |

---

### US-SEC-04 — Data Deletion & Right to be Forgotten

**User Story:** As user I want data deletion request with audit trail so that my personal data can be removed per law.

**Acceptance Criteria:**
- [ ] Delete request initiates purge and anonymization

**Test Cases:**

| Test ID | Test Type | Description | Steps | Expected Result | Status |
|---------|-----------|-------------|-------|-----------------|--------|
| SEC-DEL-01 | Integration | Delete user data | POST /api/v1/users/{id}/delete | Data purged/flagged | ☐ |
| SEC-DEL-02 | Audit | Deletion audit | Check audit logs | Deletion entry present | ☐ |

---

## Test Execution Summary

| Category | Total Tests | Passed | Failed | Blocked |
|----------|-------------|--------|--------|---------|
| Authentication | 20 | 0 | 0 | 0 |
| Buyer Flows | 25 | 0 | 0 | 0 |
| Helper Flows | 22 | 0 | 0 | 0 |
| Matching & Geospatial | 12 | 0 | 0 | 0 |
| Real-time & Notifications | 12 | 0 | 0 | 0 |
| Payments & Finance | 13 | 0 | 0 | 0 |
| Admin & Ops | 14 | 0 | 0 | 0 |
| Localization | 6 | 0 | 0 | 0 |
| Security | 10 | 0 | 0 | 0 |
| **TOTAL** | **134** | **0** | **0** | **0** |

---

## Running Tests

### Unit Tests
```bash
cd mobile-app && npm test
cd services/identity-service && mvn test
```

### Integration Tests
```bash
docker-compose -f docker-compose.test.yml up -d
mvn verify -Pintegration
```

### End-to-End Tests
```bash
# Mobile app E2E
cd mobile-app && detox test

# API E2E
node ./scripts/e2e-runner.js
```

---

*Last Updated: 2026-02-03*
*Document Version: 1.0*
