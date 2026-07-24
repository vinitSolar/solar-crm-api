BEGIN;

CREATE TABLE IF NOT EXISTS project_installation_milestone_documents (
    id BIGSERIAL,
    uid VARCHAR(255) NOT NULL,
    tenant_uid VARCHAR(255) NOT NULL,
    project_milestone_uid VARCHAR(255) NOT NULL,
    image_name VARCHAR(255),
    image_path TEXT NOT NULL,
    image_url TEXT NOT NULL,
    mime_type VARCHAR(100),
    file_size BIGINT,
    remarks TEXT,
    
    is_active SMALLINT DEFAULT 1,
    is_deleted SMALLINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted_by VARCHAR(255),
    
    CONSTRAINT pk_project_installation_milestone_docs PRIMARY KEY (id),
    CONSTRAINT uq_project_installation_milestone_docs_uid UNIQUE (uid)
);

CREATE INDEX IF NOT EXISTS idx_proj_inst_milestone_docs_tenant_uid ON project_installation_milestone_documents(tenant_uid);
CREATE INDEX IF NOT EXISTS idx_proj_inst_milestone_docs_milestone_uid ON project_installation_milestone_documents(project_milestone_uid);

COMMENT ON TABLE project_installation_milestone_documents IS 'Stores proof images for project installation milestones';

COMMIT;
