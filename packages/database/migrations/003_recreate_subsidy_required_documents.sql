-- Recreate subsidy_required_documents after it was accidentally dropped in the unified document vault migration
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
