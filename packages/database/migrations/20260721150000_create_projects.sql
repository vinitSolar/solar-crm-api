CREATE TABLE project_statuses (
  id SERIAL,
  uid UUID NOT NULL,
  tenant_uid UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(50),
  sort_order INT DEFAULT 0,
  is_default INT DEFAULT 0,
  is_closed INT DEFAULT 0,
  description TEXT,
  is_active INT DEFAULT 1,
  is_deleted INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  updated_by UUID,
  deleted_by UUID,
  CONSTRAINT pk_project_statuses PRIMARY KEY (id),
  CONSTRAINT uq_project_statuses_uid UNIQUE (uid)
);

CREATE INDEX idx_project_statuses_tenant_uid ON project_statuses(tenant_uid);

COMMENT ON TABLE project_statuses IS 'Stores project statuses per tenant';

CREATE TABLE projects (
  id SERIAL,
  uid UUID NOT NULL,
  tenant_uid UUID NOT NULL,
  lead_uid UUID NOT NULL,
  quotation_uid UUID NOT NULL,
  project_number VARCHAR(50) NOT NULL,
  project_name VARCHAR(255) NOT NULL,
  project_status_uid UUID NOT NULL,
  project_manager_uid UUID,
  project_date TIMESTAMP,
  remarks TEXT,
  is_active INT DEFAULT 1,
  is_deleted INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  updated_by UUID,
  deleted_by UUID,
  CONSTRAINT pk_projects PRIMARY KEY (id),
  CONSTRAINT uq_projects_uid UNIQUE (uid),
  CONSTRAINT uq_projects_quotation UNIQUE (tenant_uid, quotation_uid)
);

CREATE INDEX idx_projects_tenant_uid ON projects(tenant_uid);
CREATE INDEX idx_projects_lead_uid ON projects(lead_uid);
CREATE INDEX idx_projects_project_number ON projects(project_number);

COMMENT ON TABLE projects IS 'Stores project details linked to approved quotations';
