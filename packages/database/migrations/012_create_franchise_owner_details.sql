BEGIN;

CREATE TABLE franchise_owner_details (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  franchise_uid VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  date_of_birth DATE,
  profile_photo VARCHAR(500),
  mobile_number VARCHAR(20) NOT NULL,
  alternate_number VARCHAR(20),
  email VARCHAR(255),
  residential_address TEXT,
  is_active SMALLINT DEFAULT 1, -- 0 = Inactive, 1 = Active
  is_deleted SMALLINT DEFAULT 0, -- 0 = No, 1 = Yes
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_by VARCHAR(255),
  CONSTRAINT pk_franchise_owner_details PRIMARY KEY (id),
  CONSTRAINT uq_franchise_owner_details_uid UNIQUE (uid)
);

CREATE INDEX idx_franchise_owner_details_franchise_uid ON franchise_owner_details(franchise_uid);

COMMENT ON COLUMN franchise_owner_details.id IS 'Auto-incremented primary key';
COMMENT ON COLUMN franchise_owner_details.uid IS 'Unique public identifier (UUID)';
COMMENT ON COLUMN franchise_owner_details.franchise_uid IS 'Reference to the tenant UID (franchise). No FK constraint — maintained at application level';
COMMENT ON COLUMN franchise_owner_details.full_name IS 'Full name of the franchise owner';
COMMENT ON COLUMN franchise_owner_details.date_of_birth IS 'Date of birth of the franchise owner';
COMMENT ON COLUMN franchise_owner_details.profile_photo IS 'URL to the profile photo stored in cloud storage';
COMMENT ON COLUMN franchise_owner_details.mobile_number IS 'Primary mobile number of the franchise owner';
COMMENT ON COLUMN franchise_owner_details.alternate_number IS 'Alternate contact number of the franchise owner';
COMMENT ON COLUMN franchise_owner_details.email IS 'Email address of the franchise owner';
COMMENT ON COLUMN franchise_owner_details.residential_address IS 'Full residential address of the franchise owner';
COMMENT ON COLUMN franchise_owner_details.is_active IS '0 = Inactive, 1 = Active';
COMMENT ON COLUMN franchise_owner_details.is_deleted IS '0 = No, 1 = Yes (soft delete flag)';
COMMENT ON COLUMN franchise_owner_details.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN franchise_owner_details.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN franchise_owner_details.created_by IS 'UID of the user who created this record';
COMMENT ON COLUMN franchise_owner_details.updated_by IS 'UID of the user who last updated this record';
COMMENT ON COLUMN franchise_owner_details.deleted_by IS 'UID of the user who soft-deleted this record';

COMMIT;
