BEGIN;

CREATE TABLE IF NOT EXISTS project_subsidy_documents (
    id BIGSERIAL PRIMARY KEY,
    uid VARCHAR(255) NOT NULL UNIQUE,
    tenant_uid VARCHAR(255) NOT NULL,
    project_uid VARCHAR(255) NOT NULL,
    document_type_uid VARCHAR(255) NOT NULL,
    
    -- File Details
    original_name VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    remarks TEXT,
    
    -- Base Fields
    is_active SMALLINT DEFAULT 1,
    is_deleted SMALLINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted_by VARCHAR(255)
);

CREATE INDEX idx_project_subsidy_docs_tenant_uid ON project_subsidy_documents(tenant_uid);
CREATE INDEX idx_project_subsidy_docs_project_uid ON project_subsidy_documents(project_uid);
CREATE INDEX idx_project_subsidy_docs_type_uid ON project_subsidy_documents(document_type_uid);

COMMENT ON TABLE project_subsidy_documents IS 'Stores uploaded subsidy documents for a Project';

COMMIT;
