BEGIN;

CREATE TABLE IF NOT EXISTS installation_milestones (
    id BIGSERIAL,
    uid VARCHAR(255) NOT NULL,
    tenant_uid VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sort_order INT DEFAULT 0,
    requires_document SMALLINT DEFAULT 0,
    allow_multiple_images SMALLINT DEFAULT 0,
    is_system SMALLINT DEFAULT 0,
    
    is_active SMALLINT DEFAULT 1,
    is_deleted SMALLINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted_by VARCHAR(255),
    
    CONSTRAINT pk_installation_milestones PRIMARY KEY (id),
    CONSTRAINT uq_installation_milestones_uid UNIQUE (uid)
);

CREATE INDEX IF NOT EXISTS idx_installation_milestones_tenant_uid ON installation_milestones(tenant_uid);
CREATE INDEX IF NOT EXISTS idx_installation_milestones_sort_order ON installation_milestones(sort_order);

COMMENT ON TABLE installation_milestones IS 'Master template for project installation milestones per tenant';

COMMIT;
