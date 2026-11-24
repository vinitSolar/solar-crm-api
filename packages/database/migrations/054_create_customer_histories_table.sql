-- ============================================================
-- Customer Histories Table
-- Tracks full historical snapshot of customer/lead lifecycle:
-- 1. Initialized upon Quotation creation (assigned package, exact pricing breakdown, specs)
-- 2. Updated upon Lead moving to closed state (Won / Lost / Closed) with Project, Subsidy & Payment details
-- ============================================================

CREATE TABLE IF NOT EXISTS customer_histories (
    id BIGSERIAL PRIMARY KEY,
    uid VARCHAR(255) NOT NULL UNIQUE,
    tenant_uid VARCHAR(255) NOT NULL,
    lead_uid VARCHAR(255) NOT NULL,
    quotation_uid VARCHAR(255),
    project_uid VARCHAR(255),

    -- Customer / Lead Snapshot
    lead_number VARCHAR(100),
    customer_name VARCHAR(255),
    mobile_number VARCHAR(50),
    alternate_number VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    landmark VARCHAR(255),
    locality VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    pin_code VARCHAR(20),
    category SMALLINT DEFAULT 1,
    consumer_account_number VARCHAR(100),
    monthly_bill_amount NUMERIC(15, 2),
    system_size NUMERIC(10, 2),

    -- Package & Pricing Snapshot (Exact details)
    package_uid VARCHAR(255),
    package_name VARCHAR(255),
    package_price NUMERIC(15, 2) DEFAULT 0.00,
    package_details JSONB DEFAULT '{}'::jsonb,

    -- Quotation Snapshot
    quotation_number VARCHAR(100),
    subtotal NUMERIC(15, 2) DEFAULT 0.00,
    gst_amount NUMERIC(15, 2) DEFAULT 0.00,
    grand_total NUMERIC(15, 2) DEFAULT 0.00,
    discount NUMERIC(15, 2) DEFAULT 0.00,
    net_customer_cost NUMERIC(15, 2) DEFAULT 0.00,
    subsidy_amount NUMERIC(15, 2) DEFAULT 0.00,
    subsidy_details JSONB DEFAULT '[]'::jsonb,
    quotation_snapshot JSONB DEFAULT '{}'::jsonb,

    -- Project & Implementation Snapshot (Populated when closed)
    project_number VARCHAR(100),
    project_name VARCHAR(255),
    project_status VARCHAR(100),
    project_manager_name VARCHAR(255),
    project_details JSONB DEFAULT '{}'::jsonb,

    -- Payments Snapshot (Populated when closed)
    total_paid NUMERIC(15, 2) DEFAULT 0.00,
    payment_details JSONB DEFAULT '[]'::jsonb,

    -- Status & Closure Details
    current_status VARCHAR(100) DEFAULT 'QUOTATION_CREATED',
    is_closed SMALLINT DEFAULT 0,
    closure_status VARCHAR(100),
    closure_reason TEXT,
    closed_at TIMESTAMP WITH TIME ZONE,
    closed_by VARCHAR(255),

    -- Base Fields
    is_active SMALLINT DEFAULT 1,
    is_deleted SMALLINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_customer_histories_tenant ON customer_histories(tenant_uid);
CREATE INDEX IF NOT EXISTS idx_customer_histories_lead ON customer_histories(lead_uid);
CREATE INDEX IF NOT EXISTS idx_customer_histories_quotation ON customer_histories(quotation_uid);
CREATE INDEX IF NOT EXISTS idx_customer_histories_project ON customer_histories(project_uid);
CREATE INDEX IF NOT EXISTS idx_customer_histories_is_closed ON customer_histories(is_closed);
CREATE INDEX IF NOT EXISTS idx_customer_histories_mobile ON customer_histories(mobile_number);
