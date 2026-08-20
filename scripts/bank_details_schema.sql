CREATE TABLE IF NOT EXISTS bank_details (
    id SERIAL PRIMARY KEY,
    uid UUID NOT NULL UNIQUE,
    tenant_uid UUID NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(100) NOT NULL,
    ifsc_code VARCHAR(50) NOT NULL,
    bank_name VARCHAR(255) NOT NULL,
    branch_name VARCHAR(255) NOT NULL,
    swift_code VARCHAR(50),
    upi_id VARCHAR(100),
    is_default SMALLINT DEFAULT 1,
    is_active SMALLINT DEFAULT 1,
    is_deleted SMALLINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted_by UUID
);

CREATE INDEX IF NOT EXISTS idx_bank_details_tenant_uid ON bank_details(tenant_uid);
CREATE INDEX IF NOT EXISTS idx_bank_details_uid ON bank_details(uid);
