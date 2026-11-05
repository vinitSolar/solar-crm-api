-- Migration: 040_add_leads_cursor_pagination_indexes.sql
-- Optimizes cursor-based pagination, sorting, search, and tenant isolation for leads

-- 1. Primary composite index for Keyset Pagination (tenant isolation + stable sort)
CREATE INDEX IF NOT EXISTS idx_leads_tenant_cursor_pagination
ON leads(tenant_uid, is_deleted, created_at DESC, id DESC);

-- 2. Fast cursor pagination scoped to specific sales executive (show_all_leads = 0)
CREATE INDEX IF NOT EXISTS idx_leads_tenant_assigned_cursor
ON leads(tenant_uid, is_deleted, assigned_to, created_at DESC, id DESC);

-- 3. Fast cursor pagination scoped to status rail tab
CREATE INDEX IF NOT EXISTS idx_leads_tenant_status_cursor
ON leads(tenant_uid, is_deleted, status_uid, created_at DESC, id DESC);

-- 4. B-Tree indexes for fast search lookup on mobile number and lead number
CREATE INDEX IF NOT EXISTS idx_leads_mobile_number ON leads(mobile_number);
CREATE INDEX IF NOT EXISTS idx_leads_lead_number ON leads(lead_number);

