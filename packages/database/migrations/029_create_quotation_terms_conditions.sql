CREATE TABLE quotation_terms_conditions (
    uid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_uid UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_default SMALLINT DEFAULT 0,
    
    is_active SMALLINT DEFAULT 1,
    is_deleted SMALLINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted_by UUID
);

-- Index for querying by tenant
CREATE INDEX idx_quotation_terms_conditions_tenant_uid ON quotation_terms_conditions(tenant_uid);

-- Partial unique index on title per tenant for non-deleted records
CREATE UNIQUE INDEX idx_quotation_terms_conditions_tenant_title ON quotation_terms_conditions(tenant_uid, title) WHERE is_deleted = 0;

-- Optional index for sorting
CREATE INDEX idx_quotation_terms_conditions_sort_order ON quotation_terms_conditions(sort_order);
