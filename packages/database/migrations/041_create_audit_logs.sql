CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE,
    tenant_uid UUID,
    module VARCHAR(100) NOT NULL,
    record_uid UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID
);

CREATE INDEX idx_audit_logs_tenant_uid ON audit_logs(tenant_uid);
CREATE INDEX idx_audit_logs_module ON audit_logs(module);
CREATE INDEX idx_audit_logs_record_uid ON audit_logs(record_uid);
CREATE INDEX idx_audit_logs_created_by ON audit_logs(created_by);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
