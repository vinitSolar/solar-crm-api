BEGIN;

CREATE TABLE IF NOT EXISTS notification_logs (
    id BIGSERIAL PRIMARY KEY,
    uid VARCHAR(255) NOT NULL UNIQUE,
    tenant_uid VARCHAR(255) NOT NULL,
    module VARCHAR(100) NOT NULL,
    reference_uid VARCHAR(255) NOT NULL,
    channel SMALLINT NOT NULL DEFAULT 0,       -- 0=Email, 1=SMS, 2=WhatsApp, 3=Push, 4=InApp
    template VARCHAR(100) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    status SMALLINT NOT NULL DEFAULT 0,        -- 0=Pending, 1=Queued, 2=Processing, 3=Sent, 4=Failed, 5=FallbackUsed
    delivery_mode SMALLINT NOT NULL DEFAULT 0, -- 0=Direct, 1=BullMQ
    error_message TEXT,
    retry_count SMALLINT NOT NULL DEFAULT 0,
    sent_at TIMESTAMP WITH TIME ZONE,

    -- Base Audit Fields
    is_active SMALLINT DEFAULT 1,
    is_deleted SMALLINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted_by VARCHAR(255)
);

CREATE INDEX idx_notification_logs_tenant_uid ON notification_logs(tenant_uid);
CREATE INDEX idx_notification_logs_module ON notification_logs(module);
CREATE INDEX idx_notification_logs_reference_uid ON notification_logs(reference_uid);
CREATE INDEX idx_notification_logs_channel ON notification_logs(channel);
CREATE INDEX idx_notification_logs_status ON notification_logs(status);
CREATE INDEX idx_notification_logs_delivery_mode ON notification_logs(delivery_mode);
CREATE INDEX idx_notification_logs_recipient ON notification_logs(recipient);
CREATE INDEX idx_notification_logs_template ON notification_logs(template);

COMMENT ON TABLE notification_logs IS 'Stores logs of all outgoing notifications across all channels with delivery mode tracking';

COMMIT;
