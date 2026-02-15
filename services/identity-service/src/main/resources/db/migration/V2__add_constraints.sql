-- ============================================
-- FOREIGN KEY CONSTRAINTS
-- ============================================

-- Identity Service FKs
ALTER TABLE helper_profiles
    ADD CONSTRAINT fk_helper_profiles_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE helper_skills
    ADD CONSTRAINT fk_helper_skills_helper_profile_id 
    FOREIGN KEY (helper_profile_id) REFERENCES helper_profiles(id) ON DELETE CASCADE;

ALTER TABLE refresh_tokens
    ADD CONSTRAINT fk_refresh_tokens_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE audit_logs
    ADD CONSTRAINT fk_audit_logs_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Task Service FKs
ALTER TABLE skills
    ADD CONSTRAINT fk_skills_category_id 
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE;

ALTER TABLE skills
    ADD CONSTRAINT fk_skills_parent_id 
    FOREIGN KEY (parent_id) REFERENCES skills(id) ON DELETE SET NULL;

ALTER TABLE task_history
    ADD CONSTRAINT fk_task_history_task_id 
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;

ALTER TABLE disputes
    ADD CONSTRAINT fk_disputes_task_id 
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;

-- Payment Service FKs
ALTER TABLE ledger_entries
    ADD CONSTRAINT fk_ledger_entries_payment_id 
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_kyc_status ON users(kyc_status);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Helper Profiles indexes
CREATE INDEX idx_helper_profiles_user_id ON helper_profiles(user_id);
CREATE INDEX idx_helper_profiles_kyc_status ON helper_profiles(kyc_status);
CREATE INDEX idx_helper_profiles_is_online ON helper_profiles(is_online);
CREATE INDEX idx_helper_profiles_current_h3 ON helper_profiles(current_h3);
CREATE INDEX idx_helper_profiles_last_seen_at ON helper_profiles(last_seen_at);

-- Refresh Tokens indexes
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX idx_refresh_tokens_is_revoked ON refresh_tokens(is_revoked);
CREATE INDEX idx_refresh_tokens_device_id ON refresh_tokens(device_id);

-- Audit Logs indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_ip_address ON audit_logs(ip_address);
CREATE INDEX idx_audit_logs_request_id ON audit_logs(request_id);

-- Categories indexes
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_is_active ON categories(is_active);
CREATE INDEX idx_categories_display_order ON categories(display_order);

-- Skills indexes
CREATE INDEX idx_skills_slug ON skills(slug);
CREATE INDEX idx_skills_category_id ON skills(category_id);
CREATE INDEX idx_skills_parent_id ON skills(parent_id);
CREATE INDEX idx_skills_is_active ON skills(is_active);
CREATE INDEX idx_skills_display_order ON skills(display_order);

-- Tasks indexes
CREATE INDEX idx_tasks_buyer_id ON tasks(buyer_id);
CREATE INDEX idx_tasks_helper_id ON tasks(helper_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_h3_index ON tasks(h3_index);
CREATE INDEX idx_tasks_sub_skill ON tasks(sub_skill);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
CREATE INDEX idx_tasks_scheduled_at ON tasks(scheduled_at);

-- Task History indexes
CREATE INDEX idx_task_history_task_id ON task_history(task_id);
CREATE INDEX idx_task_history_status ON task_history(status);
CREATE INDEX idx_task_history_created_at ON task_history(created_at);
CREATE INDEX idx_task_history_changed_by ON task_history(changed_by);

-- Disputes indexes
CREATE INDEX idx_disputes_task_id ON disputes(task_id);
CREATE INDEX idx_disputes_status ON disputes(status);
CREATE INDEX idx_disputes_created_by ON disputes(created_by);
CREATE INDEX idx_disputes_created_at ON disputes(created_at);
CREATE INDEX idx_disputes_resolved_at ON disputes(resolved_at);

-- Payments indexes
CREATE INDEX idx_payments_task_id ON payments(task_id);
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_provider ON payments(provider);
CREATE INDEX idx_payments_created_at ON payments(created_at);
CREATE INDEX idx_payments_buyer_id ON payments(buyer_id);
CREATE INDEX idx_payments_helper_id ON payments(helper_id);
CREATE INDEX idx_payments_provider_payment_id ON payments(provider_payment_id);

-- Ledger Entries indexes
CREATE INDEX idx_ledger_entries_payment_id ON ledger_entries(payment_id);
CREATE INDEX idx_ledger_entries_entry_type ON ledger_entries(entry_type);
CREATE INDEX idx_ledger_entries_user_id ON ledger_entries(user_id);
CREATE INDEX idx_ledger_entries_created_at ON ledger_entries(created_at);
CREATE INDEX idx_ledger_entries_task_id ON ledger_entries(task_id);

-- Payouts indexes
CREATE INDEX idx_payouts_helper_id ON payouts(helper_id);
CREATE INDEX idx_payouts_status ON payouts(status);
CREATE INDEX idx_payouts_provider ON payouts(provider);
CREATE INDEX idx_payouts_created_at ON payouts(created_at);
CREATE INDEX idx_payouts_processed_at ON payouts(processed_at);
CREATE INDEX idx_payouts_task_id ON payouts(task_id);
CREATE INDEX idx_payouts_payment_id ON payouts(payment_id);
CREATE INDEX idx_payouts_provider_payout_id ON payouts(provider_payout_id);

-- ============================================
-- SPATIAL INDEXES (PostGIS)
-- ============================================

-- Add geometry column for helper locations
ALTER TABLE helper_profiles 
    ADD COLUMN IF NOT EXISTS location_geom GEOMETRY(POINT, 4326);

-- Update geometry from lat/lng
UPDATE helper_profiles 
    SET location_geom = ST_SetSRID(ST_MakePoint(current_lng, current_lat), 4326)
    WHERE current_lat IS NOT NULL AND current_lng IS NOT NULL;

-- Create spatial index
CREATE INDEX idx_helper_profiles_location_geom ON helper_profiles USING GIST(location_geom);

-- Add geometry column for task locations
ALTER TABLE tasks 
    ADD COLUMN IF NOT EXISTS location_geom GEOMETRY(POINT, 4326);

-- Update geometry from lat/lng
UPDATE tasks 
    SET location_geom = ST_SetSRID(ST_MakePoint(lng, lat), 4326)
    WHERE lat IS NOT NULL AND lng IS NOT NULL;

-- Create spatial index
CREATE INDEX idx_tasks_location_geom ON tasks USING GIST(location_geom);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_helper_profiles_updated_at BEFORE UPDATE ON helper_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skills_updated_at BEFORE UPDATE ON skills
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON disputes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payouts_updated_at BEFORE UPDATE ON payouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TRIGGER TO UPDATE LOCATION GEOMETRY
-- ============================================

CREATE OR REPLACE FUNCTION update_helper_location_geom()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.current_lat IS NOT NULL AND NEW.current_lng IS NOT NULL THEN
        NEW.location_geom = ST_SetSRID(ST_MakePoint(NEW.current_lng, NEW.current_lat), 4326);
    ELSE
        NEW.location_geom = NULL;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER helper_profiles_location_geom_trigger
    BEFORE INSERT OR UPDATE ON helper_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_helper_location_geom();

CREATE OR REPLACE FUNCTION update_task_location_geom()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
        NEW.location_geom = ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326);
    ELSE
        NEW.location_geom = NULL;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER tasks_location_geom_trigger
    BEFORE INSERT OR UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_task_location_geom();
