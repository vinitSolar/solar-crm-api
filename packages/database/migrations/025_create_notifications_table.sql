-- =============================================
-- Migration: 025_create_notifications_table.sql
-- Description: Creates notifications table for In-App Notification Center (Bell Icon)
-- =============================================

CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    uid VARCHAR(255) NOT NULL UNIQUE,
    tenant_uid VARCHAR(255) NOT NULL,
    user_uid VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    module VARCHAR(100) NOT NULL,
    reference_uid VARCHAR(255),
    template VARCHAR(100),
    data JSONB DEFAULT '{}'::jsonb,
    is_read SMALLINT NOT NULL DEFAULT 0,
    read_at TIMESTAMP WITH TIME ZONE,

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

CREATE INDEX IF NOT EXISTS idx_notifications_tenant_user_read 
    ON notifications(tenant_uid, user_uid, is_read, is_deleted);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
    ON notifications(user_uid, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_reference 
    ON notifications(module, reference_uid);

COMMENT ON TABLE notifications IS 'Stores in-app notifications displayed in the user notification center (bell icon)';
