BEGIN;

-- Add scheme_name column to state_subsidy_rules table if not exists
ALTER TABLE state_subsidy_rules ADD COLUMN IF NOT EXISTS scheme_name VARCHAR(255) NULL;

-- Create subsidy_document_types table
CREATE TABLE IF NOT EXISTS subsidy_document_types (
    id BIGSERIAL PRIMARY KEY,
    uid VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    allow_multiple SMALLINT DEFAULT 0,
    is_required SMALLINT DEFAULT 0,
    sort_order INT DEFAULT 0,
    is_active SMALLINT DEFAULT 1,
    is_deleted SMALLINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted_by VARCHAR(255)
);

COMMENT ON TABLE subsidy_document_types IS 'Master table for subsidy document types';

-- Create subsidy_required_documents table
CREATE TABLE IF NOT EXISTS subsidy_required_documents (
    id BIGSERIAL PRIMARY KEY,
    uid VARCHAR(255) NOT NULL UNIQUE,
    subsidy_uid VARCHAR(255) NOT NULL,
    document_type_uid VARCHAR(255) NOT NULL,
    sort_order INT DEFAULT 0,
    is_mandatory SMALLINT DEFAULT 1,
    is_active SMALLINT DEFAULT 1,
    is_deleted SMALLINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted_by VARCHAR(255)
);

COMMENT ON TABLE subsidy_required_documents IS 'Mapping table between Subsidies and Document Types';

COMMIT;
