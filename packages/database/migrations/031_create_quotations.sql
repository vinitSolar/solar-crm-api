BEGIN;

CREATE TABLE quotations (
    id BIGSERIAL PRIMARY KEY,
    uid VARCHAR(255) NOT NULL UNIQUE,
    tenant_uid VARCHAR(255) NOT NULL,
    lead_uid VARCHAR(255) NOT NULL,
    quotation_number VARCHAR(255) NOT NULL,
    system_size NUMERIC(10, 2) NOT NULL,
    valid_till DATE NOT NULL,
    status SMALLINT DEFAULT 0, -- 0 = Draft, 1 = Sent, 2 = Approved, 3 = Rejected, 4 = Converted to Project
    notes TEXT,
    is_active SMALLINT DEFAULT 1,
    is_deleted SMALLINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted_by VARCHAR(255)
);

CREATE TABLE quotation_items (
    id BIGSERIAL PRIMARY KEY,
    uid VARCHAR(255) NOT NULL UNIQUE,
    quotation_uid VARCHAR(255) NOT NULL,
    product_uid VARCHAR(255) NOT NULL,
    product_name VARCHAR(500) NOT NULL,
    brand_name VARCHAR(255) NOT NULL,
    unit_name VARCHAR(255) NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL,
    price_per_unit NUMERIC(15, 2) NOT NULL,
    gst_percentage NUMERIC(5, 2) NOT NULL,
    line_total NUMERIC(15, 2) NOT NULL,
    description TEXT,
    is_active SMALLINT DEFAULT 1,
    is_deleted SMALLINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted_by VARCHAR(255)
);

CREATE TABLE quotation_scope_of_work_items (
    id BIGSERIAL PRIMARY KEY,
    uid VARCHAR(255) NOT NULL UNIQUE,
    quotation_uid VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    value TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active SMALLINT DEFAULT 1,
    is_deleted SMALLINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted_by VARCHAR(255)
);

CREATE TABLE quotation_terms_conditions_items (
    id BIGSERIAL PRIMARY KEY,
    uid VARCHAR(255) NOT NULL UNIQUE,
    quotation_uid VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active SMALLINT DEFAULT 1,
    is_deleted SMALLINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted_by VARCHAR(255)
);

-- Index for tenant queries
CREATE INDEX idx_quotations_tenant_uid ON quotations(tenant_uid);
CREATE INDEX idx_quotations_lead_uid ON quotations(lead_uid);
CREATE INDEX idx_quotations_number ON quotations(quotation_number);

-- Index for snapshot joins/lookups
CREATE INDEX idx_quotation_items_quotation_uid ON quotation_items(quotation_uid);
CREATE INDEX idx_quotation_scope_of_work_items_quotation_uid ON quotation_scope_of_work_items(quotation_uid);
CREATE INDEX idx_quotation_terms_conditions_items_quotation_uid ON quotation_terms_conditions_items(quotation_uid);

-- Comment on tables
COMMENT ON TABLE quotations IS 'Customer quotations main table';
COMMENT ON TABLE quotation_items IS 'Snapshotted quotation product selections';
COMMENT ON TABLE quotation_scope_of_work_items IS 'Snapshotted quotation scope of work items';
COMMENT ON TABLE quotation_terms_conditions_items IS 'Snapshotted quotation terms & conditions items';

COMMIT;
