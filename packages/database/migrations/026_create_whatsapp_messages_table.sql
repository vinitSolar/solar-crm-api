-- =============================================
-- Migration: 026_create_whatsapp_messages_table.sql
-- Description: Creates whatsapp_messages table for logging all inbound and outbound WhatsApp Cloud API messages.
-- =============================================

CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id BIGSERIAL PRIMARY KEY,
    uid VARCHAR(255) NOT NULL UNIQUE,
    tenant_uid VARCHAR(255),

    direction VARCHAR(10) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    wa_message_id VARCHAR(255),

    from_number VARCHAR(20) NOT NULL,
    to_number VARCHAR(20) NOT NULL,

    message_type VARCHAR(20) NOT NULL DEFAULT 'text',
    content TEXT,

    template_name VARCHAR(100),
    template_data JSONB DEFAULT '{}'::jsonb,

    status VARCHAR(20) NOT NULL DEFAULT 'sent',
    status_timestamp TIMESTAMP WITH TIME ZONE,
    error_code VARCHAR(20),
    error_message TEXT,

    raw_payload JSONB DEFAULT '{}'::jsonb,

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

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_tenant_uid
    ON whatsapp_messages(tenant_uid);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_direction
    ON whatsapp_messages(direction);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_wa_message_id
    ON whatsapp_messages(wa_message_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_from_number
    ON whatsapp_messages(from_number);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_to_number
    ON whatsapp_messages(to_number);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status
    ON whatsapp_messages(status);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_created_at
    ON whatsapp_messages(created_at DESC);

COMMENT ON TABLE whatsapp_messages IS 'Stores all inbound and outbound WhatsApp messages via Meta Cloud API';
