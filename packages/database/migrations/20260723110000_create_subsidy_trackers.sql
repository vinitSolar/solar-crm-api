BEGIN;

CREATE TABLE IF NOT EXISTS subsidy_trackers (
    id BIGSERIAL,
    uid VARCHAR(255) NOT NULL,
    tenant_uid VARCHAR(255) NOT NULL,
    project_uid VARCHAR(255) NOT NULL,
    lead_uid VARCHAR(255) NOT NULL,
    subsidy_uid VARCHAR(255),
    name VARCHAR(255),
    
    portal_status SMALLINT DEFAULT 1, -- 1=Not Started, 2=Registered, 3=Documents Submitted, 4=Approved, 5=Disbursed
    net_meter_status SMALLINT DEFAULT 1, -- 1=Not Applied, 2=Applied, 3=Meter Installed
    
    portal_reference_number VARCHAR(255),
    discom_reference_number VARCHAR(255),
    
    expected_subsidy_amount DECIMAL(15, 2),
    approved_subsidy_amount DECIMAL(15, 2),
    received_subsidy_amount DECIMAL(15, 2),
    
    approved_date TIMESTAMP,
    disbursed_date TIMESTAMP,
    
    remarks TEXT,
    
    is_active SMALLINT DEFAULT 1,
    is_deleted SMALLINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted_by VARCHAR(255),
    
    PRIMARY KEY (id),
    UNIQUE (uid)
);

CREATE UNIQUE INDEX idx_subsidy_trackers_project_uid ON subsidy_trackers (tenant_uid, project_uid) WHERE is_deleted = 0;
CREATE INDEX idx_subsidy_trackers_tenant_uid ON subsidy_trackers(tenant_uid);
CREATE INDEX idx_subsidy_trackers_lead_uid ON subsidy_trackers(lead_uid);
CREATE INDEX idx_subsidy_trackers_status ON subsidy_trackers(portal_status, net_meter_status);

COMMENT ON COLUMN subsidy_trackers.portal_status IS '1=Not Started, 2=Registered, 3=Documents Submitted, 4=Approved, 5=Disbursed';
COMMENT ON COLUMN subsidy_trackers.net_meter_status IS '1=Not Applied, 2=Applied, 3=Meter Installed';

COMMIT;
