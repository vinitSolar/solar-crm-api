-- =============================================
-- Migration: 023_create_user_device_tokens.sql
-- Description: Creates user_device_tokens table for Android & iOS mobile FCM push notifications.
-- =============================================

CREATE TABLE IF NOT EXISTS user_device_tokens (
    id BIGSERIAL PRIMARY KEY,
    uid VARCHAR(255) NOT NULL UNIQUE,
    tenant_uid VARCHAR(255) NOT NULL,
    user_uid VARCHAR(255) NOT NULL,
    device_token TEXT NOT NULL UNIQUE,
    device_type VARCHAR(20) NOT NULL CHECK (device_type IN ('android', 'ios')),
    device_name VARCHAR(100),
    is_active SMALLINT NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_user_device_tokens_tenant_user_active 
    ON user_device_tokens(tenant_uid, user_uid, is_active);

CREATE INDEX IF NOT EXISTS idx_user_device_tokens_user_uid 
    ON user_device_tokens(user_uid);

CREATE INDEX IF NOT EXISTS idx_user_device_tokens_token 
    ON user_device_tokens(device_token);

COMMENT ON TABLE user_device_tokens IS 'Stores mobile FCM registration tokens for Android and iOS devices';
