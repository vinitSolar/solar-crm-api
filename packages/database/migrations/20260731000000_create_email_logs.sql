BEGIN;

CREATE TABLE email_logs (
    id BIGSERIAL PRIMARY KEY,
    uid VARCHAR(255) NOT NULL UNIQUE,
    tenant_uid VARCHAR(255) NOT NULL,
    module VARCHAR(100) NOT NULL,
    reference_uid VARCHAR(255) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    template_name VARCHAR(100) NOT NULL,
    status SMALLINT DEFAULT 0, -- 0 = Pending, 1 = Sent, 2 = Failed
    error_message TEXT,
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

CREATE INDEX idx_email_logs_tenant_uid ON email_logs(tenant_uid);
CREATE INDEX idx_email_logs_module ON email_logs(module);
CREATE INDEX idx_email_logs_reference_uid ON email_logs(reference_uid);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_recipient_email ON email_logs(recipient_email);

COMMENT ON TABLE email_logs IS 'Stores logs of all outgoing emails and their status';

COMMIT;
