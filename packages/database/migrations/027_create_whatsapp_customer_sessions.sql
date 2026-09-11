-- =============================================
-- Migration: 027_create_whatsapp_customer_sessions.sql
-- Description: Creates whatsapp_customer_sessions table for tracking WhatsApp customer self-service conversation state and selected lead context.
-- =============================================

CREATE TABLE IF NOT EXISTS whatsapp_customer_sessions (
    id BIGSERIAL PRIMARY KEY,
    uid VARCHAR(255) NOT NULL UNIQUE,
    tenant_uid VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    lead_uid VARCHAR(255),
    current_state VARCHAR(50) NOT NULL DEFAULT 'MAIN_MENU',
    metadata JSONB DEFAULT '{}'::jsonb,
    last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,

    -- Base Audit Fields
    is_active SMALLINT NOT NULL DEFAULT 1,
    is_deleted SMALLINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_customer_sessions_phone 
    ON whatsapp_customer_sessions(phone_number);

CREATE INDEX IF NOT EXISTS idx_whatsapp_customer_sessions_lead 
    ON whatsapp_customer_sessions(lead_uid);

CREATE INDEX IF NOT EXISTS idx_whatsapp_customer_sessions_tenant 
    ON whatsapp_customer_sessions(tenant_uid);

CREATE INDEX IF NOT EXISTS idx_whatsapp_customer_sessions_state 
    ON whatsapp_customer_sessions(current_state);

COMMENT ON TABLE whatsapp_customer_sessions IS 'Tracks multi-turn WhatsApp conversation session state and selected lead context for customer self-service';
