-- Sample Data for HelpInMinutes Testing
-- Execute: docker exec -i helpinminutes-postgres psql -U helpinminutes -d helpinminutes < scripts/sample-data.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CATEGORIES (UUIDs with proper version 4 format)
-- ============================================
INSERT INTO categories (id, name, slug, description, icon_url, color_code, display_order, is_active, created_at, updated_at, image_url) VALUES
('a1111111-1111-4111-8111-111111111111', 'Home Cleaning', 'home-cleaning', 'Professional home cleaning services', '🧹', '#4CAF50', 1, true, NOW(), NOW(), NULL),
('a2222222-2222-4222-8222-222222222222', 'Plumbing', 'plumbing', 'Expert plumbing solutions', '🔧', '#2196F3', 2, true, NOW(), NOW(), NULL),
('a3333333-3333-4333-8333-333333333333', 'Electrical', 'electrical', 'Electrical repairs and installations', '⚡', '#FFC107', 3, true, NOW(), NOW(), NULL),
('a4444444-4444-4444-8444-444444444444', 'Gardening', 'gardening', 'Lawn care and gardening services', '🌱', '#8BC34A', 4, true, NOW(), NOW(), NULL),
('a5555555-5555-4555-8555-555555555555', 'Moving Help', 'moving-help', 'Assistance with moving and lifting', '📦', '#FF9800', 5, true, NOW(), NOW(), NULL),
('a6666666-6666-4666-8666-666666666666', 'Appliance Repair', 'appliance-repair', 'Repair and maintenance of home appliances', '🔌', '#9C27B0', 6, true, NOW(), NOW(), NULL);

-- ============================================
-- SKILLS
-- ============================================
INSERT INTO skills (id, name, slug, category_id, description, base_price, price_unit, estimated_duration_minutes, requires_tools, requires_materials, display_order, is_active, created_at, updated_at, parent_id) VALUES
-- Home Cleaning Skills
('b1111111-1111-4111-8111-111111111111', 'Basic House Cleaning', 'basic-house-cleaning', 'a1111111-1111-4111-8111-111111111111', 'Standard house cleaning service', 500.00, 'hour', 120, false, false, 1, true, NOW(), NOW(), NULL),
('b2222222-2222-4222-8222-222222222222', 'Deep Cleaning', 'deep-cleaning', 'a1111111-1111-4111-8111-111111111111', 'Thorough deep cleaning of all areas', 1200.00, 'hour', 240, false, false, 2, true, NOW(), NOW(), NULL),
('b3333333-3333-4333-8333-333333333333', 'Kitchen Cleaning', 'kitchen-cleaning', 'a1111111-1111-4111-8111-111111111111', 'Deep kitchen cleaning including cabinets', 450.00, 'hour', 90, false, false, 3, true, NOW(), NOW(), NULL),
('b4444444-4444-4444-8444-444444444444', 'Bathroom Cleaning', 'bathroom-cleaning', 'a1111111-1111-4111-8111-111111111111', 'Complete bathroom sanitation', 350.00, 'hour', 60, false, false, 4, true, NOW(), NOW(), NULL),

-- Plumbing Skills
('c1111111-1111-4111-8111-111111111111', 'Leak Repair', 'leak-repair', 'a2222222-2222-4222-8222-222222222222', 'Fix leaks in pipes and faucets', 400.00, 'job', 60, true, false, 1, true, NOW(), NOW(), NULL),
('c2222222-2222-4222-8222-222222222222', 'Pipe Installation', 'pipe-installation', 'a2222222-2222-4222-8222-222222222222', 'Install new pipes and plumbing', 800.00, 'job', 180, true, false, 2, true, NOW(), NOW(), NULL),
('c3333333-3333-4333-8333-333333333333', 'Drain Cleaning', 'drain-cleaning', 'a2222222-2222-4222-8222-222222222222', 'Clear clogged drains', 300.00, 'job', 45, true, false, 3, true, NOW(), NOW(), NULL),
('c4444444-4444-4444-8444-444444444444', 'Water Heater Installation', 'water-heater-installation', 'a2222222-2222-4222-8222-222222222222', 'Install or replace water heater', 1500.00, 'job', 240, true, false, 4, true, NOW(), NOW(), NULL),

-- Electrical Skills
('d1111111-1111-4111-8111-111111111111', 'Wiring Repair', 'wiring-repair', 'a3333333-3333-4333-8333-333333333333', 'Repair electrical wiring issues', 500.00, 'job', 90, true, false, 1, true, NOW(), NOW(), NULL),
('d2222222-2222-4222-8222-222222222222', 'Switch Installation', 'switch-installation', 'a3333333-3333-4333-8333-333333333333', 'Install electrical switches and outlets', 200.00, 'job', 30, true, false, 2, true, NOW(), NOW(), NULL),
('d3333333-3333-4333-8333-333333333333', 'Fan Installation', 'fan-installation', 'a3333333-3333-4333-8333-333333333333', 'Install ceiling or exhaust fans', 350.00, 'job', 60, true, false, 3, true, NOW(), NOW(), NULL),
('d4444444-4444-4444-8444-444444444444', 'Light Fixture Installation', 'light-fixture-installation', 'a3333333-3333-4333-8333-333333333333', 'Install light fixtures and chandeliers', 300.00, 'job', 45, true, false, 4, true, NOW(), NOW(), NULL),

-- Gardening Skills
('e1111111-1111-4111-8111-111111111111', 'Lawn Mowing', 'lawn-mowing', 'a4444444-4444-4444-8444-444444444444', 'Mow and maintain lawn', 400.00, 'job', 60, true, false, 1, true, NOW(), NOW(), NULL),
('e2222222-2222-4222-8222-222222222222', 'Garden Trimming', 'garden-trimming', 'a4444444-4444-4444-8444-444444444444', 'Trim and shape hedges and bushes', 500.00, 'job', 90, true, false, 2, true, NOW(), NOW(), NULL),
('e3333333-3333-4333-8333-333333333333', 'Weed Removal', 'weed-removal', 'a4444444-4444-4444-8444-444444444444', 'Remove weeds from garden', 250.00, 'job', 45, true, false, 3, true, NOW(), NOW(), NULL),
('e4444444-4444-4444-8444-444444444444', 'Planting Services', 'planting-services', 'a4444444-4444-4444-8444-444444444444', 'Plant flowers and shrubs', 600.00, 'job', 120, true, true, 4, true, NOW(), NOW(), NULL),

-- Moving Help Skills
('f1111111-1111-4111-8111-111111111111', 'Furniture Moving', 'furniture-moving', 'a5555555-5555-4555-8555-555555555555', 'Move furniture within or between properties', 600.00, 'hour', 120, true, false, 1, true, NOW(), NOW(), NULL),
('f2222222-2222-4222-8222-222222222222', 'Box Packing', 'box-packing', 'a5555555-5555-4555-8555-555555555555', 'Pack belongings into boxes', 300.00, 'hour', 60, false, true, 2, true, NOW(), NOW(), NULL),
('f3333333-3333-4333-8333-333333333333', 'Loading/Unloading', 'loading-unloading', 'a5555555-5555-4555-8555-555555555555', 'Load or unload moving trucks', 450.00, 'hour', 90, true, false, 3, true, NOW(), NOW(), NULL),

-- Appliance Repair Skills
('f4444444-4444-4444-8444-444444444444', 'AC Repair', 'ac-repair', 'a6666666-6666-4666-8666-666666666666', 'Repair air conditioning units', 700.00, 'job', 90, true, true, 1, true, NOW(), NOW(), NULL),
('f5555555-5555-4555-8555-555555555555', 'Washing Machine Repair', 'washing-machine-repair', 'a6666666-6666-4666-8666-666666666666', 'Fix washing machine issues', 500.00, 'job', 60, true, true, 2, true, NOW(), NOW(), NULL),
('f6666666-6666-4666-8666-666666666666', 'Refrigerator Repair', 'refrigerator-repair', 'a6666666-6666-4666-8666-666666666666', 'Repair refrigerator problems', 600.00, 'job', 90, true, true, 3, true, NOW(), NOW(), NULL);

-- ============================================
-- USERS (Sample Buyers)
-- ============================================
INSERT INTO users (id, email, name, role, phone, password_hash, is_active, is_email_verified, is_phone_verified, kyc_status, profile_picture_url, created_at, updated_at) VALUES
('c0000000-0000-4000-8000-000000000001', 'john.buyer@example.com', 'John Buyer', 'BUYER', '+919876543210', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.a.tq8DxKQ4z6.YwWhe', true, true, true, 'VERIFIED', NULL, NOW(), NOW()),
('c0000000-0000-4000-8000-000000000002', 'jane.buyer@example.com', 'Jane Smith', 'BUYER', '+919876543211', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.a.tq8DxKQ4z6.YwWhe', true, true, true, 'VERIFIED', NULL, NOW(), NOW()),
('c0000000-0000-4000-8000-000000000003', 'raj.buyer@example.com', 'Raj Patel', 'BUYER', '+919876543212', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.a.tq8DxKQ4z6.YwWhe', true, true, false, 'PENDING', NULL, NOW(), NOW());

-- ============================================
-- USERS (Sample Helpers)
-- ============================================
INSERT INTO users (id, email, name, role, phone, password_hash, is_active, is_email_verified, is_phone_verified, kyc_status, profile_picture_url, created_at, updated_at) VALUES
('d0000000-0000-4000-8000-000000000001', 'priya.helper@example.com', 'Priya Sharma', 'HELPER', '+919911223344', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.a.tq8DxKQ4z6.YwWhe', true, true, true, 'VERIFIED', NULL, NOW(), NOW()),
('d0000000-0000-4000-8000-000000000002', 'aman.helper@example.com', 'Aman Verma', 'HELPER', '+919911223345', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.a.tq8DxKQ4z6.YwWhe', true, true, true, 'VERIFIED', NULL, NOW(), NOW()),
('d0000000-0000-4000-8000-000000000003', 'neha.helper@example.com', 'Neha Gupta', 'HELPER', '+919911223346', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.a.tq8DxKQ4z6.YwWhe', true, true, true, 'VERIFIED', NULL, NOW(), NOW()),
('d0000000-0000-4000-8000-000000000004', 'vikram.helper@example.com', 'Vikram Singh', 'HELPER', '+919911223347', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.a.tq8DxKQ4z6.YwWhe', true, true, true, 'VERIFIED', NULL, NOW(), NOW()),
('d0000000-0000-4000-8000-000000000005', 'anjali.helper@example.com', 'Anjali Reddy', 'HELPER', '+919911223348', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.a.tq8DxKQ4z6.YwWhe', true, true, false, 'PENDING_MANUAL', NULL, NOW(), NOW());

-- ============================================
-- HELPER PROFILES
-- ============================================
INSERT INTO helper_profiles (id, user_id, kyc_status, is_online, current_lat, current_lng, current_h3, last_seen_at, bank_account, documents, rating, total_reviews, total_tasks_completed, bio, hourly_rate, created_at, updated_at) VALUES
('e0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'VERIFIED', true, 28.6139, 77.2090, '811d3bfffffffff', NOW(), '{"bank_name": "HDFC Bank", "account_number": "****1234", "ifsc": "HDFC0001234"}', '[]', 4.8, 45, 52, 'Professional home cleaner with 5 years experience', 250.00, NOW(), NOW()),
('e0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000002', 'VERIFIED', true, 28.6350, 77.2210, '811d3bfffffffff', NOW(), '{"bank_name": "ICICI Bank", "account_number": "****5678", "ifsc": "ICICI0005678"}', '[]', 4.6, 32, 38, 'Expert plumber specializing in leak repairs', 300.00, NOW(), NOW()),
('e0000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000003', 'VERIFIED', true, 28.6500, 77.2300, '811d3bfffffffff', NOW(), '{"bank_name": "SBI Bank", "account_number": "****9012", "ifsc": "SBI0009012"}', '[]', 4.9, 67, 78, 'Licensed electrician with 8 years experience', 350.00, NOW(), NOW()),
('e0000000-0000-4000-8000-000000000004', 'd0000000-0000-4000-8000-000000000004', 'VERIFIED', false, 28.6200, 77.2100, '811d3bfffffffff', NOW() - INTERVAL '1 hour', '{"bank_name": "Axis Bank", "account_number": "****3456", "ifsc": "AXIS0003456"}', '[]', 4.7, 28, 31, 'Gardening specialist with 3 years experience', 200.00, NOW(), NOW()),
('e0000000-0000-4000-8000-000000000005', 'd0000000-0000-4000-8000-000000000005', 'PENDING_MANUAL', false, 28.6100, 77.2000, '811d3bfffffffff', NOW() - INTERVAL '2 hours', '{"bank_name": "PNB Bank", "account_number": "****7890", "ifsc": "PNB0007890"}', '[]', 0.0, 0, 0, 'New helper eager to help', 180.00, NOW(), NOW());

-- ============================================
-- HELPER SKILLS
-- ============================================
INSERT INTO helper_skills (helper_profile_id, skill) VALUES
-- Priya's skills (Home Cleaning)
('e0000000-0000-4000-8000-000000000001', 'basic-house-cleaning'),
('e0000000-0000-4000-8000-000000000001', 'deep-cleaning'),
('e0000000-0000-4000-8000-000000000001', 'kitchen-cleaning'),
('e0000000-0000-4000-8000-000000000001', 'bathroom-cleaning'),
-- Aman's skills (Plumbing)
('e0000000-0000-4000-8000-000000000002', 'leak-repair'),
('e0000000-0000-4000-8000-000000000002', 'pipe-installation'),
('e0000000-0000-4000-8000-000000000002', 'drain-cleaning'),
-- Neha's skills (Electrical)
('e0000000-0000-4000-8000-000000000003', 'wiring-repair'),
('e0000000-0000-4000-8000-000000000003', 'switch-installation'),
('e0000000-0000-4000-8000-000000000003', 'fan-installation'),
('e0000000-0000-4000-8000-000000000003', 'light-fixture-installation'),
-- Vikram's skills (Gardening)
('e0000000-0000-4000-8000-000000000004', 'lawn-mowing'),
('e0000000-0000-4000-8000-000000000004', 'garden-trimming'),
('e0000000-0000-4000-8000-000000000004', 'weed-removal'),
-- Anjali's skills (Moving Help + Cleaning)
('e0000000-0000-4000-8000-000000000005', 'furniture-moving'),
('e0000000-0000-4000-8000-000000000005', 'box-packing'),
('e0000000-0000-4000-8000-000000000005', 'basic-house-cleaning');

-- ============================================
-- ADMIN USER
-- ============================================
INSERT INTO users (id, email, name, role, phone, password_hash, is_active, is_email_verified, is_phone_verified, kyc_status, profile_picture_url, created_at, updated_at) VALUES
('a0000000-0000-4000-8000-000000000001', 'admin@helpinminutes.com', 'System Admin', 'ADMIN', '+910000000000', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3.a.tq8DxKQ4z6.YwWhe', true, true, true, 'VERIFIED', NULL, NOW(), NOW());

-- ============================================
-- SAMPLE TASKS (For Testing)
-- ============================================
INSERT INTO tasks (id, buyer_id, helper_id, title, description, lat, lng, h3_index, address, city, sub_skill, status, price, platform_fee, helper_amount, scheduled_at, accepted_at, completed_at, started_at, created_at, updated_at, attachments, metadata, cancellation_reason, cancelled_by, cancelled_at) VALUES
-- Task 1: Completed
('f0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'Deep cleaning of 2BHK apartment', 'Need deep cleaning of a 2 bedroom apartment including kitchen and bathrooms', 28.6139, 77.2090, '811d3bfffffffff', '123 Main Street, Connaught Place', 'New Delhi', 'deep-cleaning', 'COMPLETED', 1500.00, 225.00, 1275.00, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days', NOW() - INTERVAL '3 days', NOW(), NULL, NULL, NULL, NULL, NULL),

-- Task 2: In Progress
('f0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000002', 'Kitchen sink leak repair', 'Kitchen sink is leaking, need immediate repair', 28.6350, 77.2210, '811d3bfffffffff', '456 Market Road, Lajpat Nagar', 'New Delhi', 'leak-repair', 'IN_PROGRESS', 400.00, 60.00, 340.00, NOW() - INTERVAL '5 hours', NOW() - INTERVAL '4 hours', NULL, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '6 hours', NOW(), NULL, NULL, NULL, NULL, NULL),

-- Task 3: Accepted (Waiting to start)
('f0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000003', 'Fan and light installation', 'Install ceiling fan and 2 light fixtures in living room', 28.6500, 77.2300, '811d3bfffffffff', '789 Park Avenue, Saket', 'New Delhi', 'fan-installation', 'ACCEPTED', 650.00, 97.50, 552.50, NOW() + INTERVAL '1 day', NOW() - INTERVAL '2 hours', NULL, NULL, NOW() - INTERVAL '1 day', NOW(), NULL, NULL, NULL, NULL, NULL),

-- Task 4: Dispatched (Helper is on the way)
('f0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000002', NULL, 'Lawn mowing and garden trimming', 'Medium size lawn needs mowing, garden hedges need trimming', 28.6200, 77.2100, '811d3bfffffffff', '321 Green Villa, Greater Kailash', 'New Delhi', 'lawn-mowing', 'DISPATCHED', 900.00, 135.00, 765.00, NOW() + INTERVAL '3 hours', NULL, NULL, NULL, NOW() - INTERVAL '4 hours', NOW(), NULL, NULL, NULL, NULL, NULL),

-- Task 5: Matching (Looking for helper)
('f0000000-0000-4000-8000-000000000005', 'c0000000-0000-4000-8000-000000000003', NULL, 'AC repair - not cooling properly', 'Split AC not cooling, needs service and gas refill', 28.6100, 77.2000, '811d3bfffffffff', '555 Tech Park, Dwarka', 'New Delhi', 'ac-repair', 'MATCHING', 700.00, 105.00, 595.00, NOW() + INTERVAL '2 days', NULL, NULL, NULL, NOW() - INTERVAL '30 minutes', NOW(), NULL, NULL, NULL, NULL, NULL);

-- ============================================
-- PAYMENTS (For Completed Tasks)
-- ============================================
INSERT INTO payments (id, task_id, buyer_id, helper_id, order_id, amount, currency, status, provider, provider_payment_id, platform_fee, helper_amount, captured_at, created_at, updated_at, failed_at, failure_reason, provider_order_id, provider_response, provider_signature, refund_amount, refund_reason, refunded_at, tax_amount) VALUES
('a0000000-0000-4000-8000-000000000002', 'f0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'order_ABCD1234EFGH', 1500.00, 'INR', 'CAPTURED', 'RAZORPAY', 'pay_ABCD1234EFGH5678', 225.00, 1275.00, NOW() - INTERVAL '1 day', NOW() - INTERVAL '2 days', NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00);

-- ============================================
-- LEDGER ENTRIES
-- ============================================
INSERT INTO ledger_entries (id, payment_id, task_id, user_id, entry_type, amount, currency, description, is_reversed, created_at, reference_id, reference_type, metadata, reversal_reason, reversed_at) VALUES
('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000002', 'f0000000-0000-4000-8000-000000000001', NULL, 'PLATFORM_FEE', 225.00, 'INR', 'Platform fee for task f0000000-0000-4000-8000-000000000001', false, NOW() - INTERVAL '2 days', NULL, NULL, NULL, NULL, NULL),
('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000002', 'f0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000001', 'HELPER_PAYOUT', 1275.00, 'INR', 'Helper payout for completed task', false, NOW() - INTERVAL '2 days', NULL, NULL, NULL, NULL, NULL);

-- ============================================
-- TASK HISTORY
-- ============================================
INSERT INTO task_history (id, task_id, status, previous_status, changed_by, changed_by_role, notes, created_at, metadata) VALUES
('c0000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-000000000001', 'CREATED', NULL, 'c0000000-0000-4000-8000-000000000001', 'BUYER', 'Task created', NOW() - INTERVAL '3 days', NULL),
('c0000000-0000-4000-8000-000000000002', 'f0000000-0000-4000-8000-000000000001', 'MATCHING', 'CREATED', NULL, 'SYSTEM', 'Helper assigned: Priya Sharma', NOW() - INTERVAL '3 days', NULL),
('c0000000-0000-4000-8000-000000000003', 'f0000000-0000-4000-8000-000000000001', 'ACCEPTED', 'MATCHING', 'd0000000-0000-4000-8000-000000000001', 'HELPER', 'Helper accepted the task', NOW() - INTERVAL '3 days', NULL),
('c0000000-0000-4000-8000-000000000004', 'f0000000-0000-4000-8000-000000000001', 'IN_PROGRESS', 'ACCEPTED', 'd0000000-0000-4000-8000-000000000001', 'HELPER', 'Work started', NOW() - INTERVAL '2 days', NULL),
('c0000000-0000-4000-8000-000000000005', 'f0000000-0000-4000-8000-000000000001', 'COMPLETED', 'IN_PROGRESS', 'd0000000-0000-4000-8000-000000000001', 'HELPER', 'Task completed successfully', NOW() - INTERVAL '1 day', NULL);

-- ============================================
-- VERIFY DATA
-- ============================================
SELECT 'Users: ' || COUNT(*) FROM users;
SELECT 'Buyers: ' || COUNT(*) FROM users WHERE role = 'BUYER';
SELECT 'Helpers: ' || COUNT(*) FROM users WHERE role = 'HELPER';
SELECT 'Admins: ' || COUNT(*) FROM users WHERE role = 'ADMIN';
SELECT 'Categories: ' || COUNT(*) FROM categories;
SELECT 'Skills: ' || COUNT(*) FROM skills;
SELECT 'Helper Profiles: ' || COUNT(*) FROM helper_profiles;
SELECT 'Helper Skills: ' || COUNT(*) FROM helper_skills;
SELECT 'Tasks: ' || COUNT(*) FROM tasks;
SELECT 'Payments: ' || COUNT(*) FROM payments;
SELECT 'Ledger Entries: ' || COUNT(*) FROM ledger_entries;
SELECT 'Task History Records: ' || COUNT(*) FROM task_history;
