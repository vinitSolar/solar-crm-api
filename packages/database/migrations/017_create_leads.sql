BEGIN;

CREATE TABLE leads (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  tenant_uid VARCHAR(255) NOT NULL,
  
  -- Customer Information
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255),
  mobile_number VARCHAR(20) NOT NULL,
  alternate_number VARCHAR(20),
  email VARCHAR(255),
  
  -- Address Information
  address TEXT,
  state VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  pin_code VARCHAR(20),
  
  -- Lead Information
  monthly_bill_amount NUMERIC(10, 2),
  system_size NUMERIC(10, 2),
  follow_up_date DATE,
  lead_source_uid VARCHAR(255) NOT NULL,
  status_uid VARCHAR(255) NOT NULL,
  assigned_to VARCHAR(255),
  remarks TEXT,
  
  -- Base Fields
  is_active SMALLINT DEFAULT 1,
  is_deleted SMALLINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_by VARCHAR(255),
  
  CONSTRAINT pk_leads PRIMARY KEY (id),
  CONSTRAINT uq_leads_uid UNIQUE (uid)
);

CREATE INDEX idx_leads_tenant_uid ON leads(tenant_uid);
CREATE INDEX idx_leads_lead_source_uid ON leads(lead_source_uid);
CREATE INDEX idx_leads_status_uid ON leads(status_uid);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);

COMMENT ON TABLE leads IS 'Stores customer leads per tenant';

COMMIT;
