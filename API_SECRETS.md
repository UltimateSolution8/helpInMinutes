# HelpInMinutes API Secrets & Configuration Guide

This document provides comprehensive guidance on API keys, secrets, and credentials required for the HelpInMinutes platform. It covers both **free/demo testing** (no cost) and **production-ready** credentials.

---

## Table of Contents

1. [Secrets Management Overview](#secrets-management-overview)
2. [Free/Demo Testing Credentials](#freedemo-testing-credentials)
3. [Production Credentials Guide](#production-credentials-guide)
4. [Environment Variables Configuration](#environment-variables-configuration)
5. [Vendor Setup Instructions](#vendor-setup-instructions)
6. [Security Best Practices](#security-best-practices)

---

## Secrets Management Overview

### Required External Providers

| Service | Purpose | Free Tier | Cost (Production) |
|---------|---------|-----------|-------------------|
| Google Cloud | OAuth, Maps, FCM | ✅ Yes | Pay-as-you-go |
| Razorpay | Payment processing | ✅ Test mode | 2% per transaction |
| Twilio | SMS/OTP | ✅ Trial available | ₹0.50/SMS |
| Firebase | Authentication | ✅ Spark plan | Pay-as-you-go |
| Redis Cloud | Cache | ✅ 30MB free | ₹400+/month |
| PostGIS | Database | ✅ Self-hosted | Server costs |
| RabbitMQ | Message broker | ✅ Self-hosted | Server costs |

### Never commit secrets to version control

```bash
# Add to .gitignore
.env
.env.local
.env.*.local
*.pem
*.key
secrets/
```

---

## Free/Demo Testing Credentials

### 1. Google OAuth & Maps API

**For Testing (No Cost):**

```bash
# Get test credentials from Google Cloud Console
# 1. Go to: https://console.cloud.google.com/
# 2. Create new project or select existing
# 3. Enable APIs:
#    - Google Maps SDK for Android
#    - Google Maps JavaScript API
#    - Google OAuth 2.0
#    - Firebase Cloud Messaging
# 4. Create OAuth 2.0 credentials (Test mode - add test emails)
```

**Test Configuration:**

```env
# mobile-app/.env
GOOGLE_CLIENT_ID=your-test-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-test-client-secret
GOOGLE_WEB_CLIENT_ID=your-test-web-client-id.apps.googleusercontent.com

# For Android (SHA-1 from debug keystore)
GOOGLE_ANDROID_CLIENT_ID=your-test-android-client-id.apps.googleusercontent.com

# Maps API
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-test-maps-api-key
```

**How to Get Free Credentials:**

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project: `helpinminutes-dev`
3. Enable **Maps SDK for Android** (free tier: $200/month credit)
4. Enable **OAuth 2.0** (free for up to 100 users)
5. Download OAuth config JSON
6. Add test emails in OAuth consent screen for development

---

### 2. Razorpay Payment Gateway (India)

**Test Mode (Free):**

```bash
# 1. Sign up at: https://razorpay.com/
# 2. Complete KYC (required even for test mode)
# 3. Get test credentials from Dashboard → Settings → API Keys
```

**Test Configuration:**

```env
# services/payment-service/.env
RAZORPAY_KEY_ID=rzp_test_your_test_key_id
RAZORPAY_KEY_SECRET=your_test_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Mobile app
EXPO_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_test_key_id
```

**Test Cards:**

| Card Number | Result | CVV | Expiry |
|-------------|--------|-----|--------|
| 4111 1111 1111 1111 | Success | Any | Any future date |
| 4111 1111 1111 1112 | Failure | Any | Any future date |

**Test UPI IDs:**

- `success@razorpay` - Payment succeeds
- `failed@razorpay` - Payment fails

---

### 3. Firebase Authentication

**Free Spark Plan (Enough for Demo):**

```bash
# 1. Go to: https://console.firebase.google.com/
# 2. Create new project (links to Google Cloud)
# 3. Add Android app → download google-services.json
# 4. Enable Authentication → Google sign-in provider
```

**Test Configuration:**

```env
# mobile-app/.env
FIREBASE_API_KEY=your-test-firebase-api-key
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id
```

**Google-services.json placement:**

```bash
mobile-app/
├── google-services.json  # Download from Firebase Console
└── app/
```

---

### 4. Firebase Cloud Messaging (FCM)

**Free Tier Includes:**

- Unlimited free notifications
- 10GB storage/month
- 1GB downloads/month

**Setup:**

```bash
# 1. In Firebase Console → Project Settings → Cloud Messaging
# 2. Download FCM vAPNs certificate (for iOS)
# 3. Server key shown for reference
```

**Test Configuration:**

```env
# services/notification-service/.env
FCM_SERVER_KEY=your-fcm-server-key
FCM_SENDER_ID=your-fcm-sender-id
```

---

### 5. Twilio SMS (Trial Account)

**Trial Benefits:**

- ₹100 free credits
- Send SMS to verified numbers only

**Setup:**

```bash
# 1. Sign up: https://www.twilio.com/try-twilio
# 2. Verify caller ID (for SMS)
# 3. Get credentials from Console
```

**Test Configuration:**

```env
# services/notification-service/.env
TWILIO_ACCOUNT_SID=your-test-account-sid
TWILIO_AUTH_TOKEN=your-test-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

**Verify phone number:**

```bash
# In Twilio Console → Phone Numbers → Manage → Verified Caller IDs
# Add your personal number for testing
```

---

### 6. Redis (Free Cloud Instance)

**Redis Cloud Free Tier:**

```bash
# 1. Sign up: https://redis.io/try-redis-cloud/
# 2. Create free subscription (30MB)
# 3. Get connection details
```

**Test Configuration:**

```env
# All services use Redis
REDIS_URL=redis://username:password@redis-cloud-host:port
REDIS_HOST=your-redis-host
REDIS_PORT=12345
REDIS_PASSWORD=your-password
```

---

### 7. PostgreSQL with PostGIS

**Self-Hosted (Free):**

```bash
# Use Docker for local development
# See: infrastructure/docker/docker-compose.yml

# For production, use:
# - Amazon RDS ($15+/month)
# - Google Cloud SQL ($8+/month)
# - Supabase ($25/month includes PostGIS)
```

---

### 8. RabbitMQ

**Self-Hosted (Free):**

```bash
# Use Docker for local development
# See: infrastructure/docker/docker-compose.yml

# For production:
# - CloudAMQP ($25+/month)
# - Amazon MQ ($50+/month)
```

---

## Production Credentials Guide

### 1. Google Cloud Production Setup

**Estimated Cost: ₹2,000-5,000/month**

```bash
# Create production project: helpinminutes-prod

# Required APIs:
# - Maps SDK for Android (₹7,000/1000 calls/month)
# - Places API (₹17,500/1000 calls/month)
# - Distance Matrix API (₹17,500/1000 calls/month)
# - Geocoding API (₹5,000/1000 calls/month)

# OAuth:
# - Submit for verification (2-4 weeks)
# - Add production domain
```

**Production Security:**

```env
# Restrict API keys in Google Console:
# - Android: Package name + SHA-1 fingerprint
# - Web: Referrer restrictions (your domain only)
# - Server: IP restrictions
```

---

### 2. Razorpay Production

**Requirements:**

```bash
# 1. Complete full business KYC
# 2. Link bank account
# 3. Get live API keys (switch from test to live mode)
```

**Live Configuration:**

```env
RAZORPAY_KEY_ID=rzp_live_your_live_key_id
RAZORPAY_KEY_SECRET=your_live_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

**Pricing:**

- Standard: 2% + ₹3 per transaction
- Standard+: 1.95% + ₹2 per transaction (higher volume)

---

### 3. Twilio Production SMS

**Pricing:**

- Transactional SMS: ₹0.50-1.00 per SMS
- OTP SMS: ₹0.50 per SMS
- WhatsApp: ₹0.80 per message

**Setup:**

```bash
# 1. Upgrade from trial to paid
# 2. Purchase phone number (₹1-2/month)
# 3. Enable required services (SMS, WhatsApp)
```

---

### 4. Firebase Production

**Upgrade to Blaze Plan:**

```bash
# No cost for standard usage
# Pay only when exceeding free quotas

# Estimated costs for 10k DAU:
# - Authentication: Free (all features)
# - FCM: Free
# - Firestore: ~$1-5/month
# - Storage: ~$1-3/month
```

---

## Environment Variables Configuration

### Mobile App (.env)

```env
# ============================================
# HELP IN MINUTES - MOBILE APP CONFIGURATION
# ============================================

# Environment
EXPO_PUBLIC_ENV=development|staging|production

# API Base URL
EXPO_PUBLIC_API_URL=https://api-dev.helpinminutes.com
EXPO_PUBLIC_WS_URL=wss://realtime-dev.helpinminutes.com

# Authentication
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-client-id
EXPO_PUBLIC_GOOGLE_CLIENT_SECRET=your-client-secret
EXPO_PUBLIC_FIREBASE_API_KEY=your-firebase-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id

# Maps
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-maps-api-key

# Payments
EXPO_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxx

# Feature Flags
EXPO_PUBLIC_ENABLE_MOCK_MODE=true
EXPO_PUBLIC_ENABLE_ANALYTICS=false
```

---

### Backend Services (.env)

```env
# ============================================
# HELP IN MINUTES - BACKEND SERVICES CONFIG
# ============================================

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/helpinminutes
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=helpinminutes
DATABASE_USER=helpinminutes
DATABASE_PASSWORD=secure-password

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=redis-password

# RabbitMQ
RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_USER=helpinminutes
RABBITMQ_PASSWORD=rabbitmq-password

# JWT
JWT_SECRET=your-super-secure-jwt-secret-min-32-chars
JWT_ACCESS_TOKEN_EXPIRY=900  # 15 minutes
JWT_REFRESH_TOKEN_EXPIRY=604800  # 7 days

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://api.helpinminutes.com/auth/google/callback

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=xxx

# FCM
FCM_SERVER_KEY=xxx
FCM_SENDER_ID=xxx

# Twilio
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+91xxxxxxxxxx

# H3 Geospatial
H3_RESOLUTION=9

# Social Security Fund (%)
SOCIAL_SECURITY_CONTRIBUTION_RATE=1.0

# Admin
ADMIN_EMAIL=admin@helpinminutes.com
ADMIN_PASSWORD=secure-admin-password
```

---

### Admin Portal (.env)

```env
# ============================================
# HELP IN MINUTES - ADMIN PORTAL CONFIG
# ============================================

NEXT_PUBLIC_API_URL=https://api-dev.helpinminutes.com
NEXT_PUBLIC_WS_URL=wss://realtime-dev.helpinminutes.com

# Auth
NEXTAUTH_URL=https://admin-dev.helpinminutes.com
NEXTAUTH_SECRET=your-nextauth-secret

# Optional: Auth0 or other provider
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_CLIENT_ID=xxx
AUTH0_CLIENT_SECRET=xxx
```

---

## Vendor Setup Instructions

### Google Cloud Setup (Step by Step)

1. **Create Project:**
   ```bash
   # Visit: https://console.cloud.google.com/
   # Click "New Project"
   # Name: helpinminutes-dev
   # Organization: Your organization
   ```

2. **Enable APIs:**
   ```bash
   # In APIs & Services → Library
   # Search and enable:
   # - Google Maps SDK for Android
   # - Google Maps JavaScript API
   # - Places API
   # - Distance Matrix API
   # - Geocoding API
   # - OAuth 2.0
   ```

3. **Create Credentials:**
   ```bash
   # APIs & Services → Credentials
   # Click "Create Credentials" → OAuth client ID
   # Application type: Android (for mobile app)
   # - Package name: com.helpinminutes.app
   # - SHA-1 fingerprint: (from debug.keystore)
   
   # Also create:
   # - Web application (for backend OAuth)
   # - Service account (for backend APIs)
   ```

4. **Configure OAuth Consent:**
   ```bash
   # APIs & Services → OAuth consent screen
   # User Type: Internal (for production) or External (dev)
   # Add required scopes: email, profile
   # Add test users (for development)
   ```

---

### Razorpay Setup (India)

1. **Sign Up:**
   - Visit: https://razorpay.com/
   - Complete business registration
   - Submit KYC documents (PAN, GST if applicable)

2. **Get API Keys:**
   ```bash
   # Dashboard → Settings → API Keys
   # View Keys (test mode by default)
   # Keep Key ID and Key Secret safe
   ```

3. **Configure Webhook:**
   ```bash
   # Dashboard → Settings → Webhooks
   # URL: https://your-api.com/payments/webhook
   # Events: payment.authorized, payment.captured
   # Secret: Generate and save
   ```

4. **Test Integration:**
   ```bash
   # Use test card: 4111 1111 1111 1111
   # Use test UPI: success@razorpay
   # Verify webhooks with test events
   ```

---

### Firebase Setup

1. **Create Project:**
   ```bash
   # Visit: https://console.firebase.google.com/
   # Add project (links to Google Cloud)
   # Enable Google Analytics (optional)
   ```

2. **Add Mobile App:**
   ```bash
   # Project Overview → Add app → Android
   # Package name: com.helpinminutes.app
   # SHA-1: (from signing key)
   # Download google-services.json
   ```

3. **Enable Auth:**
   ```bash
   # Authentication → Get Started
   # Enable: Google, Email/Password
   # Configure: OAuth consent screen
   ```

4. **Enable FCM:**
   ```bash
   # Project Settings → Cloud Messaging
   # Note: Server key and Sender ID
   # For iOS: Upload APNs certificate
   ```

---

## Security Best Practices

### Secret Storage

```bash
# Never store secrets in:
# - Source code
# - Git repository
# - Client-side code
# - Logs

# Always use:
# - Environment variables
# - Secret managers (AWS Secrets Manager, HashiCorp Vault)
# - Encrypted config files
```

### Secret Rotation

```bash
# Rotate secrets regularly:
# - API keys: Every 90 days
# - JWT secrets: Every 30 days
# - Database passwords: Every 90 days
# - API tokens: Every 60 days

# Implement automated rotation:
# - AWS Secrets Manager
# - HashiCorp Vault
# - Cloud KMS
```

### Access Control

```bash
# Principle of least privilege:
# - Developers: Read-only access to production secrets
# - CI/CD: Deploy-time access only
# - Services: Minimum required permissions

# Audit all secret access:
# - Log who accessed which secret
# - Alert on unauthorized access
# - Regular access reviews
```

### Environment Separation

```bash
# Keep separate credentials for:
# - Development (dev-* prefix)
# - Staging (staging-* prefix)
# - Production (prod-* prefix, strict access)

# Never use production credentials in development!
```

### Monitoring & Alerts

```bash
# Monitor for:
# - Unusual API key usage
# - Failed authentication attempts
# - Secret access from unknown IPs
# - Credential exposure in logs

# Set up alerts:
# - AWS GuardDuty
# - Google Security Command Center
# - Custom CloudWatch alerts
```

---

## Quick Start - Demo Environment

To quickly set up a demo environment with free credentials:

```bash
# 1. Clone repository
git clone https://github.com/your-org/helpinminutes.git
cd helpinminutes

# 2. Copy environment templates
cp .env.example .env
cp mobile-app/.env.example mobile-app/.env

# 3. Get test credentials:
#    - Google: console.cloud.google.com
#    - Razorpay: razorpay.com (test mode)
#    - Firebase: console.firebase.google.com

# 4. Update .env files with test credentials

# 5. Start infrastructure
docker-compose -f infrastructure/docker/docker-compose.yml up -d

# 6. Start services
cd services && ./start-all.sh

# 7. Run mobile app
cd mobile-app && npm start
```

---

## Support

### Getting Help

- **Documentation:** See `/docs/` folder
- **API Reference:** See `/docs/postman/HelpInMinutes.postman_collection.json`
- **Architecture:** See `/docs/ARCHITECTURE.md`

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Google Auth not working | Check SHA-1 fingerprint in Google Console |
| Razorpay payments failing | Verify test mode is enabled |
| FCM notifications not arriving | Check FCM server key and sender ID |
| Twilio SMS not sending | Verify caller ID is verified |
| Redis connection failed | Check Redis URL and credentials |

---

*Last Updated: 2026-02-03*
*Document Version: 1.0*
