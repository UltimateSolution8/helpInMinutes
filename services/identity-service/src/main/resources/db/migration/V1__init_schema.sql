-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS extension for spatial data
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================
-- IDENTITY SERVICE TABLES
-- ============================================

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('BUYER', 'HELPER', 'ADMIN')),
    kyc_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (kyc_status IN ('PENDING', 'VERIFIED', 'PENDING_MANUAL', 'REJECTED')),
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255),
    profile_picture_url VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_email_verified BOOLEAN NOT NULL DEFAULT false,
    is_phone_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Helper Profiles table
CREATE TABLE helper_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE,
    kyc_status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (kyc_status IN ('PENDING', 'VERIFIED', 'PENDING_MANUAL', 'REJECTED')),
    is_online BOOLEAN NOT NULL DEFAULT false,
    current_h3 VARCHAR(15),
    current_lat DECIMAL(10, 8),
    current_lng DECIMAL(11, 8),
    last_seen_at TIMESTAMP,
    bank_account JSONB,
    documents JSONB DEFAULT '[]'::jsonb,
    rating DECIMAL(2, 1) DEFAULT 0,
    total_reviews INTEGER NOT NULL DEFAULT 0,
    total_tasks_completed INTEGER NOT NULL DEFAULT 0,
    bio TEXT,
    hourly_rate DECIMAL(10, 2),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Helper Skills table (for array normalization)
CREATE TABLE helper_skills (
    helper_profile_id UUID NOT NULL,
    skill VARCHAR(100) NOT NULL,
    PRIMARY KEY (helper_profile_id, skill)
);

-- Refresh Tokens table
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    token VARCHAR(500) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT false,
    revoked_at TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    device_id VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    description VARCHAR(1000),
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    session_id VARCHAR(255),
    request_id VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TASK SERVICE TABLES
-- ============================================

-- Categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(500),
    icon_url VARCHAR(500),
    image_url VARCHAR(500),
    color_code VARCHAR(7),
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Skills table
CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(500),
    category_id UUID NOT NULL,
    parent_id UUID,
    icon_url VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INTEGER NOT NULL DEFAULT 0,
    estimated_duration_minutes INTEGER,
    base_price DECIMAL(10, 2),
    price_unit VARCHAR(20),
    requires_tools BOOLEAN NOT NULL DEFAULT false,
    requires_materials BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID NOT NULL,
    helper_id UUID,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    h3_index VARCHAR(15) NOT NULL,
    address VARCHAR(500),
    city VARCHAR(100),
    sub_skill VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'CREATED' CHECK (status IN ('CREATED', 'MATCHING', 'DISPATCHED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    price DECIMAL(10, 2) NOT NULL,
    platform_fee DECIMAL(10, 2),
    helper_amount DECIMAL(10, 2),
    scheduled_at TIMESTAMP,
    accepted_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    cancellation_reason VARCHAR(500),
    cancelled_by UUID,
    attachments JSONB DEFAULT '[]'::jsonb,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Task History table
CREATE TABLE task_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('CREATED', 'MATCHING', 'DISPATCHED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    previous_status VARCHAR(20) CHECK (previous_status IN ('CREATED', 'MATCHING', 'DISPATCHED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    changed_by UUID,
    changed_by_role VARCHAR(20),
    notes VARCHAR(1000),
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Disputes table
CREATE TABLE disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL UNIQUE,
    created_by UUID NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED')),
    reason VARCHAR(50) NOT NULL CHECK (reason IN ('HELPER_NO_SHOW', 'TASK_INCOMPLETE', 'POOR_QUALITY', 'OVERCHARGING', 'HELPER_MISCONDUCT', 'BUYER_MISCONDUCT', 'PAYMENT_ISSUE', 'OTHER')),
    description TEXT NOT NULL,
    evidence JSONB DEFAULT '[]'::jsonb,
    requested_resolution VARCHAR(1000),
    resolution_notes TEXT,
    resolution VARCHAR(20) CHECK (resolution IN ('BUYER_FAVORED', 'HELPER_FAVORED', 'SPLIT', 'NO_ACTION')),
    resolved_by UUID,
    resolved_at TIMESTAMP,
    refund_amount DOUBLE PRECISION,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- PAYMENT SERVICE TABLES
-- ============================================

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL,
    buyer_id UUID NOT NULL,
    helper_id UUID,
    order_id VARCHAR(255) NOT NULL UNIQUE,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CAPTURED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED')),
    provider VARCHAR(20) NOT NULL DEFAULT 'RAZORPAY' CHECK (provider IN ('RAZORPAY', 'STRIPE', 'PAYPAL')),
    provider_payment_id VARCHAR(255),
    provider_order_id VARCHAR(255),
    provider_signature VARCHAR(500),
    provider_response JSONB,
    platform_fee DECIMAL(10, 2),
    helper_amount DECIMAL(10, 2),
    tax_amount DECIMAL(10, 2),
    failure_reason VARCHAR(500),
    failed_at TIMESTAMP,
    captured_at TIMESTAMP,
    refunded_at TIMESTAMP,
    refund_amount DECIMAL(10, 2),
    refund_reason VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Ledger Entries table
CREATE TABLE ledger_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL,
    task_id UUID NOT NULL,
    user_id UUID,
    entry_type VARCHAR(30) NOT NULL CHECK (entry_type IN ('PLATFORM_FEE', 'HELPER_PAYOUT', 'SOCIAL_SECURITY', 'TAX', 'REFUND', 'ADJUSTMENT', 'PENALTY')),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    description VARCHAR(500),
    reference_id VARCHAR(255),
    reference_type VARCHAR(50),
    metadata JSONB,
    is_reversed BOOLEAN NOT NULL DEFAULT false,
    reversed_at TIMESTAMP,
    reversal_reason VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Payouts table
CREATE TABLE payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    helper_id UUID NOT NULL,
    task_id UUID NOT NULL,
    payment_id UUID NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED')),
    provider VARCHAR(20) NOT NULL DEFAULT 'RAZORPAYX' CHECK (provider IN ('RAZORPAYX', 'CASHFREE', 'MANUAL')),
    provider_payout_id VARCHAR(255),
    provider_response TEXT,
    bank_account JSONB,
    utr_number VARCHAR(50),
    failure_reason VARCHAR(500),
    processed_at TIMESTAMP,
    settled_at TIMESTAMP,
    retry_count INTEGER NOT NULL DEFAULT 0,
    next_retry_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
