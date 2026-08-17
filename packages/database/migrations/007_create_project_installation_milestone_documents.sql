CREATE TABLE IF NOT EXISTS project_installation_milestone_documents (
    id BIGSERIAL PRIMARY KEY,
    uid UUID NOT NULL UNIQUE,
    tenant_uid UUID NOT NULL,
    project_milestone_uid UUID NOT NULL,
    image_name VARCHAR(255),
    image_path VARCHAR(500) NOT NULL,
    image_url TEXT NOT NULL,
    mime_type VARCHAR(100),
    file_size BIGINT,
    remarks TEXT,
    
    is_active SMALLINT DEFAULT 1,
    is_deleted SMALLINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted_by UUID
);

CREATE INDEX IF NOT EXISTS idx_milestone_docs_tenant ON project_installation_milestone_documents(tenant_uid);
CREATE INDEX IF NOT EXISTS idx_milestone_docs_milestone_uid ON project_installation_milestone_documents(project_milestone_uid);
