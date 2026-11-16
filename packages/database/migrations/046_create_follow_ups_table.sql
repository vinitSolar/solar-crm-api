-- ============================================================
-- Follow-ups Module
-- ============================================================
CREATE TABLE IF NOT EXISTS follow_ups (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  tenant_uid VARCHAR(255) NOT NULL,
  lead_uid VARCHAR(255) NOT NULL,
  follow_up_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'rescheduled', 'completed', 'cancelled'
  notes TEXT,
  assigned_to VARCHAR(255),
  
  -- Base Fields
  is_active SMALLINT DEFAULT 1, -- 1=Current/Active follow-up for customer, 0=Past/Inactive
  is_deleted SMALLINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_by VARCHAR(255),
  
  CONSTRAINT pk_follow_ups PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_follow_ups_tenant_uid ON follow_ups(tenant_uid);
CREATE INDEX IF NOT EXISTS idx_follow_ups_lead_uid ON follow_ups(lead_uid);
CREATE INDEX IF NOT EXISTS idx_follow_ups_lead_active ON follow_ups(lead_uid, is_active);
CREATE INDEX IF NOT EXISTS idx_follow_ups_date ON follow_ups(follow_up_date);
CREATE INDEX IF NOT EXISTS idx_follow_ups_status ON follow_ups(status);

