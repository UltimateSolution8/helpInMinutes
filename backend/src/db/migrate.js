/**
 * Database Migration Script
 * Creates all tables for helpInMinutes platform
 * Pattern inspired by standard PostgreSQL migration practices
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const migrations = [
  // Users table
  `CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('buyer', 'helper', 'admin')),
    phone TEXT,
    preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en', 'hi', 'te')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // Refresh tokens
  `CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // Skill categories
  `CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_hi TEXT,
    name_te TEXT,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // Skills
  `CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    name_hi TEXT,
    name_te TEXT,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // Sub-skills (micro-tasks)
  `CREATE TABLE IF NOT EXISTS sub_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    name_hi TEXT,
    name_te TEXT,
    slug TEXT UNIQUE NOT NULL,
    aliases TEXT[] DEFAULT '{}',
    skill_level TEXT DEFAULT 'micro' CHECK (skill_level IN ('micro', 'minor', 'major')),
    tools_required TEXT[] DEFAULT '{}',
    avg_base_rate NUMERIC(10,2) DEFAULT 0,
    legal_tags TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // Helper profiles
  `CREATE TABLE IF NOT EXISTS helper_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    kyc_status TEXT DEFAULT 'PENDING' CHECK (kyc_status IN ('PENDING', 'PENDING_MANUAL', 'VERIFIED', 'REJECTED')),
    aadhaar_doc_path TEXT,
    pan_doc_path TEXT,
    selfie_path TEXT,
    bank_account_number TEXT,
    bank_ifsc TEXT,
    is_online BOOLEAN DEFAULT false,
    current_lat DOUBLE PRECISION,
    current_lng DOUBLE PRECISION,
    current_h3_index TEXT,
    rating NUMERIC(3,2) DEFAULT 0,
    total_tasks_completed INT DEFAULT 0,
    wallet_balance NUMERIC(12,2) DEFAULT 0,
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // Helper skills junction
  `CREATE TABLE IF NOT EXISTS helper_skills (
    helper_id UUID REFERENCES helper_profiles(id) ON DELETE CASCADE,
    sub_skill_id UUID REFERENCES sub_skills(id) ON DELETE CASCADE,
    PRIMARY KEY (helper_id, sub_skill_id)
  )`,

  // Tasks
  `CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID REFERENCES users(id),
    helper_id UUID REFERENCES users(id),
    title TEXT NOT NULL,
    description TEXT,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    h3_index TEXT NOT NULL,
    sub_skill_id UUID REFERENCES sub_skills(id),
    status TEXT NOT NULL DEFAULT 'CREATED' CHECK (status IN (
      'CREATED', 'MATCHING', 'DISPATCHED', 'ACCEPTED',
      'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'FAILED'
    )),
    price NUMERIC(10,2),
    cancellation_reason TEXT,
    completion_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // Task status history (audit trail)
  `CREATE TABLE IF NOT EXISTS task_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    from_status TEXT,
    to_status TEXT NOT NULL,
    actor_id UUID REFERENCES users(id),
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // Payments
  `CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id),
    buyer_id UUID REFERENCES users(id),
    helper_id UUID REFERENCES users(id),
    amount NUMERIC(10,2) NOT NULL,
    currency TEXT DEFAULT 'INR',
    payment_method TEXT CHECK (payment_method IN ('razorpay', 'cash')),
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CREATED', 'CAPTURED', 'FAILED', 'REFUNDED')),
    platform_fee NUMERIC(10,2) DEFAULT 0,
    social_security_reserve NUMERIC(10,2) DEFAULT 0,
    helper_payout NUMERIC(10,2) DEFAULT 0,
    idempotency_key TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // Ledger entries (double-entry style)
  `CREATE TABLE IF NOT EXISTS ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES payments(id),
    entry_type TEXT NOT NULL CHECK (entry_type IN (
      'PAYMENT_RECEIVED', 'PLATFORM_FEE', 'SOCIAL_SECURITY',
      'HELPER_PAYOUT', 'REFUND'
    )),
    amount NUMERIC(10,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // Audit logs
  `CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    target_type TEXT,
    target_id UUID,
    details JSONB DEFAULT '{}',
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,

  // Indexes
  `CREATE INDEX IF NOT EXISTS idx_tasks_h3 ON tasks (h3_index)`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks (status)`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_buyer ON tasks (buyer_id)`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_helper ON tasks (helper_id)`,
  `CREATE INDEX IF NOT EXISTS idx_helper_profiles_h3 ON helper_profiles (current_h3_index)`,
  `CREATE INDEX IF NOT EXISTS idx_helper_profiles_online ON helper_profiles (is_online)`,
  `CREATE INDEX IF NOT EXISTS idx_payments_task ON payments (task_id)`,
  `CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs (actor_id)`,
  `CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs (target_type, target_id)`,
];

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Running migrations...');
    for (const sql of migrations) {
      await client.query(sql);
    }
    console.log('Migrations completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
