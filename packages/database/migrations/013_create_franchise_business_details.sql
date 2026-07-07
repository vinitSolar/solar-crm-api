BEGIN;

CREATE TABLE franchise_business_details (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  franchise_uid VARCHAR(255) NOT NULL,
  business_name VARCHAR(255) NOT NULL,
  gst_number VARCHAR(20) NOT NULL,
  pan_number VARCHAR(10) NOT NULL,
  cin_number VARCHAR(25),
  msme_registration_number VARCHAR(50),
  trade_license_number VARCHAR(50),
  business_address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pin_code VARCHAR(10),
  is_active SMALLINT DEFAULT 1, -- 0 = Inactive, 1 = Active
  is_deleted SMALLINT DEFAULT 0, -- 0 = No, 1 = Yes
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_by VARCHAR(255),
  CONSTRAINT pk_franchise_business_details PRIMARY KEY (id),
  CONSTRAINT uq_franchise_business_details_uid UNIQUE (uid)
);

CREATE INDEX idx_franchise_business_details_franchise_uid ON franchise_business_details(franchise_uid);

COMMENT ON COLUMN franchise_business_details.id IS 'Auto-incremented primary key';
COMMENT ON COLUMN franchise_business_details.uid IS 'Unique public identifier (UUID)';
COMMENT ON COLUMN franchise_business_details.franchise_uid IS 'Reference to the tenant UID (franchise). No FK constraint — maintained at application level';
COMMENT ON COLUMN franchise_business_details.business_name IS 'Registered name of the franchise business';
COMMENT ON COLUMN franchise_business_details.gst_number IS 'GST registration number (mandatory)';
COMMENT ON COLUMN franchise_business_details.pan_number IS 'PAN card number (mandatory)';
COMMENT ON COLUMN franchise_business_details.cin_number IS 'Corporate Identification Number';
COMMENT ON COLUMN franchise_business_details.msme_registration_number IS 'MSME registration number';
COMMENT ON COLUMN franchise_business_details.trade_license_number IS 'Trade license number';
COMMENT ON COLUMN franchise_business_details.business_address IS 'Full business address';
COMMENT ON COLUMN franchise_business_details.city IS 'City where the business is located';
COMMENT ON COLUMN franchise_business_details.state IS 'State where the business is located';
COMMENT ON COLUMN franchise_business_details.pin_code IS 'Postal PIN code of the business address';
COMMENT ON COLUMN franchise_business_details.is_active IS '0 = Inactive, 1 = Active';
COMMENT ON COLUMN franchise_business_details.is_deleted IS '0 = No, 1 = Yes (soft delete flag)';
COMMENT ON COLUMN franchise_business_details.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN franchise_business_details.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN franchise_business_details.created_by IS 'UID of the user who created this record';
COMMENT ON COLUMN franchise_business_details.updated_by IS 'UID of the user who last updated this record';
COMMENT ON COLUMN franchise_business_details.deleted_by IS 'UID of the user who soft-deleted this record';

COMMIT;
