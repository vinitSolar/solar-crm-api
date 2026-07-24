BEGIN;

CREATE TABLE IF NOT EXISTS project_installation_milestones (
    id BIGSERIAL,
    uid VARCHAR(255) NOT NULL,
    tenant_uid VARCHAR(255) NOT NULL,
    project_uid VARCHAR(255) NOT NULL,
    milestone_uid VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    sequence_no INT NOT NULL,
    status SMALLINT DEFAULT 0, -- 0=Pending, 1=InProgress, 2=Completed, 3=Skipped, 4=Cancelled
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    completed_by VARCHAR(255),
    remarks TEXT,
    
    is_active SMALLINT DEFAULT 1,
    is_deleted SMALLINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted_by VARCHAR(255),
    
    CONSTRAINT pk_project_installation_milestones PRIMARY KEY (id),
    CONSTRAINT uq_project_installation_milestones_uid UNIQUE (uid)
);

CREATE INDEX IF NOT EXISTS idx_proj_inst_milestones_tenant_uid ON project_installation_milestones(tenant_uid);
CREATE INDEX IF NOT EXISTS idx_proj_inst_milestones_project_uid ON project_installation_milestones(project_uid);
CREATE INDEX IF NOT EXISTS idx_proj_inst_milestones_milestone_uid ON project_installation_milestones(milestone_uid);
CREATE INDEX IF NOT EXISTS idx_proj_inst_milestones_sequence_no ON project_installation_milestones(sequence_no);

COMMENT ON TABLE project_installation_milestones IS 'Tracks the progress of installation milestones for a specific project';
COMMENT ON COLUMN project_installation_milestones.status IS '0=Pending, 1=InProgress, 2=Completed, 3=Skipped, 4=Cancelled';

COMMIT;
