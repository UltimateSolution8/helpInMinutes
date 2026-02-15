# HelpInMinutes - Canonical Truth Document

## Overview
This document establishes the single source of truth for the HelpInMinutes platform. All services, components, and integrations must adhere to these canonical definitions.

## 1. Domain Model Canonical Truths

### 1.1 User Identifiers
- **Format**: UUID v4 (e.g., `550e8400-e29b-41d4-a716-446655440000`)
- **All services must use**: `user.id` as the primary identifier
- **No service should generate its own user ID** - always use the ID from Identity Service
- **Reference**: [`User.java`](services/identity-service/src/main/java/com/helpinminutes/identity/entity/User.java)

### 1.2 Task Identifiers
- **Format**: ULID (Universally Unique Lexicographically Sortable ID)
- **Pattern**: `TASK-{timestamp}-{random}` for external display
- **Internal format**: 26-character ULID (e.g., `01h5d5f2x8dva4v9z5q2a7x`)
- **All services must use**: `task.id` as the primary identifier
- **Reference**: [`Task.java`](services/task-service/src/main/java/com/helpinminutes/task/entity/Task.java)

### 1.3 Helper Identifiers
- **Format**: UUID v4 with `HLP-` prefix for display
- **Mapping**: `helper.userId` → `user.id`
- **No duplicate helpers**: One helper profile per user
- **Reference**: [`HelperProfile.java`](services/identity-service/src/main/java/com/helpinminutes/identity/entity/HelperProfile.java)

### 1.4 Payment Identifiers
- **Format**: `PAY-{uuid}` (e.g., `PAY-550e8400-e29b-41d4-a716`)
- **Razorpay integration**: Payment Service maps `payment.id` → `razorpay_payment_id`
- **All amounts stored in**: Paise (₹1 = 100 paise) - **CRITICAL**
- **Reference**: [`Payment.java`](services/payment-service/src/main/java/com/helpinminutes/payment/entity/Payment.java)

## 2. Status Enums - Single Source of Truth

### 2.1 Task Status (State Machine)
```
CREATED → MATCHING → DISPATCHED → ACCEPTED → IN_PROGRESS → COMPLETED
                          ↓
                    CANCELLED
                          ↓
                    DISPUTED
```

| Status | Meaning | Allowed Transitions |
|--------|---------|---------------------|
| CREATED | Task created by customer | MATCHING, CANCELLED |
| MATCHING | Searching for helpers | DISPATCHED, CANCELLED |
| DISPATCHED | Helper claimed | ACCEPTED, CANCELLED |
| ACCEPTED | Helper accepted task | IN_PROGRESS, CANCELLED |
| IN_PROGRESS | Work started | COMPLETED, DISPUTED, CANCELLED |
| COMPLETED | Task finished | - |
| CANCELLED | Task cancelled | - |
| DISPUTED | Customer/helper raised issue | RESOLVED |

**Source**: [`TaskStatus.java`](shared/src/main/java/com/helpinminutes/shared/enums/TaskStatus.java)

### 2.2 KYC Status
```
PENDING → UNDER_REVIEW → APPROVED | REJECTED | DOCUMENTS_REQUESTED
```

| Status | Meaning |
|--------|---------|
| PENDING | Documents not uploaded |
| UNDER_REVIEW | Admin reviewing |
| APPROVED | Helper verified |
| REJECTED | Documents invalid |
| DOCUMENTS_REQUESTED | Additional docs needed |

### 2.3 Payment Status
```
PENDING → AUTHORIZED → CAPTURED
              ↓
        FAILED | REFUNDED
```

| Status | Meaning |
|--------|---------|
| PENDING | Awaiting payment |
| AUTHORIZED | Payment hold created |
| CAPTURED | Amount charged |
| FAILED | Payment rejected |
| REFUNDED | Amount returned |

## 3. Geospatial Canonical Truth

### 3.1 H3 Index Resolution
- **Resolution**: 10 (average cell edge length: ~0.58 m²)
- **Function**: `lat_lng_to_cell(lat, lng, res=10)`
- **Helper lookup**: k-ring with k=3 (~30m radius)

### 3.2 Hyderabad Coverage
- **Center**: 17.3850° N, 78.4867° E
- **H3 Cell**: `8a52e6492b7ffff`
- **Bounding Box**:
  - North: 17.5° N
  - South: 17.25° N
  - East: 78.65° E
  - West: 78.35° E

### 3.3 Location Data Model
```typescript
interface GeoLocation {
  latitude: number;   // WGS84, 6 decimal places
  longitude: number;  // WGS84, 6 decimal places
  address: string;    // Formatted address
  city: string;       // "Hyderabad"
  state: string;      // "Telangana"
  pincode: string;    // 6-digit Indian PIN
  h3Index: string;    // H3 cell at resolution 10
}
```

## 4. Currency & Pricing

### 4.1 Currency Standard
- **Currency**: INR (Indian Rupees)
- **Symbol**: ₹
- **Code**: INR
- **Decimal places**: 2 (stored as 100 paise = ₹1)

### 4.2 Platform Fee Structure
| Component | Rate |
|-----------|------|
| Platform fee (customer) | 15% of task price |
| Payment gateway fee | 2.9% + ₹3 per transaction |
| GST on fees | 18% of platform fee |

### 4.3 Price Display Rules
- All prices shown to users must be in ₹ (INR)
- No decimal prices (round to nearest ₹10)
- Minimum task price: ₹50
- Maximum task price: ₹10,000

## 5. Time & Date Standards

### 5.1 Time Zone
- **Default**: Asia/Kolkata (IST, UTC+5:30)
- **Storage**: UTC in database
- **Display**: Convert to user's timezone

### 5.2 Date Format
- **API**: ISO 8601 with timezone (e.g., `2024-02-15T14:30:00+05:30`)
- **Database**: `TIMESTAMP WITH TIME ZONE`
- **Display**: DD MMM YYYY, HH:MM

### 5.3 Scheduling Windows
- **Minimum**: 30 minutes before task
- **Maximum**: 7 days in advance
- **Rescheduling**: Up to 2 hours before scheduled time

## 6. Language & Localization

### 6.1 Supported Languages
| Code | Name | Status |
|------|------|--------|
| en | English | Full |
| te | Telugu | Full |
| hi | Hindi | Full |

### 6.2 Content Priority
1. User's preferred language (stored in profile)
2. Device locale
3. English (fallback)

### 6.3 Localization Keys
- Format: `[{module}].{component}.{key}`
- Examples:
  - `auth.login.title`
  - `task.category.plumbing`
  - `common.save`

## 7. ID Generation Service

### 7.1 ID Types
| Prefix | Description | Format |
|--------|-------------|--------|
| USR | User | USR-{uuid} |
| HLP | Helper | HLP-{uuid} |
| TSK | Task | TSK-{timestamp}-{random} |
| PAY | Payment | PAY-{uuid} |
| PTR | Payout | PTR-{uuid} |
| DIS | Dispute | DIS-{uuid} |
| LDG | Ledger | LDG-{uuid} |

### 7.2 ULID Generation
All services must use the `IdGeneratorService` for ID generation:
```java
@Autowired
private IdGeneratorService idGeneratorService;

public String generateTaskId() {
    return idGeneratorService.generateUlid("TSK");
}
```

## 8. Audit Log Canonical Structure

### 8.1 Required Fields
```json
{
  "id": "UUID",
  "userId": "UUID",
  "action": "CREATE|UPDATE|DELETE|APPROVE|REJECT|CANCEL",
  "resourceType": "TASK|PAYMENT|USER|HELPER",
  "resourceId": "UUID",
  "oldValue": { /* optional */ },
  "newValue": { /* optional */ },
  "ipAddress": "IP",
  "userAgent": "User-Agent string",
  "timestamp": "ISO8601 UTC"
}
```

### 8.2 Audit Events (Non-negotiable)
- User login/logout
- KYC status change
- Task creation/cancellation
- Payment capture/refund
- Payout request/process
- Admin role changes
- Dispute resolution

## 9. Error Codes

### 9.1 Error Format
```json
{
  "code": "ERROR_CODE",
  "message": "Human readable message",
  "details": { /* optional */ }
}
```

### 9.2 Canonical Error Codes
| Code | HTTP Status | Meaning |
|------|-------------|---------|
| AUTH_001 | 401 | Invalid token |
| AUTH_002 | 401 | Token expired |
| AUTH_003 | 403 | Insufficient permissions |
| TASK_001 | 404 | Task not found |
| TASK_002 | 409 | Task already assigned |
| TASK_003 | 422 | Invalid task state |
| PAY_001 | 402 | Payment failed |
| PAY_002 | 404 | Payment not found |
| KYC_001 | 422 | Invalid documents |
| KYC_002 | 403 | KYC not verified |
| SYS_001 | 500 | Internal error |
| SYS_002 | 503 | Service unavailable |

## 10. SLA Budgets

| Operation | SLA | Measurement |
|-----------|-----|-------------|
| Matching | <100ms | P99 latency |
| Task accept | <500ms | P99 latency |
| Payment webhook | <200ms | P99 latency |
| Location update | <100ms | P99 latency |
| WebSocket push | <50ms | P99 latency |
| API response | <200ms | P95 latency |
| Database query | <50ms | P95 latency |

## 11. Canonical Data Types

### 11.1 Phone Numbers
- **Format**: E.164 (e.g., `+919876543210`)
- **Validation**: Regex `^\+[1-9]\d{1,14}$`
- **Storage**: VARCHAR(15)

### 11.2 Email
- **Format**: RFC 5322
- **Validation**: RFC 5322 compliant regex
- **Storage**: VARCHAR(255), lowercase

### 11.3 Aadhaar
- **Format**: 12 digits with space (XXXX XXXX XXXX)
- **Storage**: Encrypted string
- **Masking**: Show only last 4 digits

### 11.4 PAN
- **Format**: 10 characters (AAAAA0000A)
- **Storage**: Uppercase string
- **Validation**: Regex `^[A-Z]{5}[0-9]{4}[A-Z]$`

## 12. Versioning

### 12.1 API Versioning
- **Header**: `X-API-Version: 1`
- **URL prefix**: `/api/v1/`
- **Breaking changes**: New major version

### 12.2 Schema Versioning
- **Flyway migrations**: V{number}__{description}.sql
- **Service version**: In `application.yml` as `app.version`

---

**Document Owner**: Engineering Team
**Last Updated**: 2024-02-02
**Next Review**: 2024-05-02
