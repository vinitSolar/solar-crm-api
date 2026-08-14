-- ============================================================
-- Payments Module
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL,
  uid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  tenant_uid UUID NOT NULL,
  lead_uid UUID NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  payment_method SMALLINT NOT NULL, -- 0=Cash, 1=Bank Transfer, 2=UPI, 3=Cheque, 4=Card, 5=Online, 6=Other
  transaction_reference VARCHAR(255),
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status SMALLINT NOT NULL DEFAULT 0, -- 0=Pending, 1=Paid, 2=Failed, 3=Cancelled, 4=Refunded
  notes TEXT,
  
  -- Base Fields
  is_active SMALLINT DEFAULT 1,
  is_deleted SMALLINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID,
  updated_by UUID,
  deleted_by UUID,
  
  CONSTRAINT pk_payments PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_payments_tenant_uid ON payments(tenant_uid);
CREATE INDEX IF NOT EXISTS idx_payments_lead_uid ON payments(lead_uid);
