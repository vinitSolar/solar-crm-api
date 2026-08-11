
CREATE TABLE tenants (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  code VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  type SMALLINT NOT NULL, -- 0 = Head Office, 1 = Franchise
  email VARCHAR(255),
  logo VARCHAR(500),
  timezone VARCHAR(100) DEFAULT 'Asia/Kolkata',
  is_active SMALLINT DEFAULT 1, -- 0 = Inactive, 1 = Active, 2 = Suspended
  is_deleted SMALLINT DEFAULT 0, -- 0 = No, 1 = Yes
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_by VARCHAR(255),
  CONSTRAINT pk_tenants PRIMARY KEY (id),
  CONSTRAINT uq_tenants_uid UNIQUE (uid),
  CONSTRAINT uq_tenants_code UNIQUE (code)
);

CREATE INDEX idx_tenants_email ON tenants(email);




CREATE TABLE roles (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  tenant_uid VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_system SMALLINT DEFAULT 0, -- 0 = Custom Role, 1 = System Role
  is_active SMALLINT DEFAULT 1, -- 0 = Inactive, 1 = Active
  is_deleted SMALLINT DEFAULT 0, -- 0 = No, 1 = Yes
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_by VARCHAR(255),
  CONSTRAINT pk_roles PRIMARY KEY (id),
  CONSTRAINT uq_roles_uid UNIQUE (uid)
);

CREATE INDEX idx_roles_tenant_uid ON roles(tenant_uid);




CREATE TABLE users (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  tenant_uid VARCHAR(255) NOT NULL,
  role_uid VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255),
  password VARCHAR(255),
  last_login TIMESTAMP,
  is_active SMALLINT DEFAULT 1, -- 0 = Inactive, 1 = Active, 2 = Locked
  is_deleted SMALLINT DEFAULT 0, -- 0 = No, 1 = Yes
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_by VARCHAR(255),
  CONSTRAINT pk_users PRIMARY KEY (id),
  CONSTRAINT uq_users_uid UNIQUE (uid),
  CONSTRAINT uq_users_email UNIQUE (email)
);

CREATE INDEX idx_users_tenant_uid ON users(tenant_uid);
CREATE INDEX idx_users_role_uid ON users(role_uid);





CREATE TABLE menus (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  parent_uid VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(100) NOT NULL,
  route VARCHAR(255),
  icon VARCHAR(255),
  sort_order INT,
  is_active SMALLINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_menus PRIMARY KEY (id),
  CONSTRAINT uq_menus_uid UNIQUE (uid),
  CONSTRAINT uq_menus_code UNIQUE (code)
);

CREATE INDEX idx_menus_parent_uid ON menus(parent_uid);




CREATE TABLE features (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  menu_uid VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(100) NOT NULL,
  is_active SMALLINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_features PRIMARY KEY (id),
  CONSTRAINT uq_features_uid UNIQUE (uid)
);

CREATE INDEX idx_features_menu_uid ON features(menu_uid);
CREATE INDEX idx_features_code ON features(code);




CREATE TABLE role_menu_permissions (
  id BIGSERIAL,
  tenant_uid VARCHAR(255) NOT NULL,
  role_uid VARCHAR(255) NOT NULL,
  menu_uid VARCHAR(255) NOT NULL,
  can_view SMALLINT DEFAULT 0,
  can_create SMALLINT DEFAULT 0,
  can_edit SMALLINT DEFAULT 0,
  can_delete SMALLINT DEFAULT 0,
  can_import SMALLINT DEFAULT 0,
  can_export SMALLINT DEFAULT 0,
  can_approve SMALLINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_role_menu_permissions PRIMARY KEY (id)
);

CREATE INDEX idx_role_menu_permissions_tenant_uid ON role_menu_permissions(tenant_uid);
CREATE INDEX idx_role_menu_permissions_role_uid ON role_menu_permissions(role_uid);
CREATE INDEX idx_role_menu_permissions_menu_uid ON role_menu_permissions(menu_uid);




CREATE TABLE role_feature_permissions (
  id BIGSERIAL,
  tenant_uid VARCHAR(255) NOT NULL,
  role_uid VARCHAR(255) NOT NULL,
  feature_uid VARCHAR(255) NOT NULL,
  is_enabled SMALLINT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_role_feature_permissions PRIMARY KEY (id)
);

CREATE INDEX idx_role_feature_permissions_tenant_uid ON role_feature_permissions(tenant_uid);
CREATE INDEX idx_role_feature_permissions_role_uid ON role_feature_permissions(role_uid);
CREATE INDEX idx_role_feature_permissions_feature_uid ON role_feature_permissions(feature_uid);




CREATE TABLE user_menu_permissions (
  id BIGSERIAL,
  tenant_uid VARCHAR(255) NOT NULL,
  user_uid VARCHAR(255) NOT NULL,
  menu_uid VARCHAR(255) NOT NULL,
  can_view SMALLINT,
  can_create SMALLINT,
  can_edit SMALLINT,
  can_delete SMALLINT,
  can_import SMALLINT,
  can_export SMALLINT,
  can_approve SMALLINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_user_menu_permissions PRIMARY KEY (id)
);

CREATE INDEX idx_user_menu_permissions_tenant_uid ON user_menu_permissions(tenant_uid);
CREATE INDEX idx_user_menu_permissions_user_uid ON user_menu_permissions(user_uid);
CREATE INDEX idx_user_menu_permissions_menu_uid ON user_menu_permissions(menu_uid);




CREATE TABLE user_feature_permissions (
  id BIGSERIAL,
  tenant_uid VARCHAR(255) NOT NULL,
  user_uid VARCHAR(255) NOT NULL,
  feature_uid VARCHAR(255) NOT NULL,
  is_enabled SMALLINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_user_feature_permissions PRIMARY KEY (id)
);

CREATE INDEX idx_user_feature_permissions_tenant_uid ON user_feature_permissions(tenant_uid);
CREATE INDEX idx_user_feature_permissions_user_uid ON user_feature_permissions(user_uid);
CREATE INDEX idx_user_feature_permissions_feature_uid ON user_feature_permissions(feature_uid);




CREATE TABLE user_sessions (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  user_uid VARCHAR(255) NOT NULL,
  refresh_token VARCHAR(1000) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  is_active SMALLINT DEFAULT 1, -- 0 = Inactive, 1 = Active, 2 = Locked
  is_deleted SMALLINT DEFAULT 0, -- 0 = No, 1 = Yes
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_by VARCHAR(255),
  CONSTRAINT pk_user_sessions PRIMARY KEY (id),
  CONSTRAINT uq_user_sessions_uid UNIQUE (uid),
  CONSTRAINT uq_user_sessions_token UNIQUE (refresh_token)
);

CREATE INDEX idx_user_sessions_user_uid ON user_sessions(user_uid);




ALTER TABLE tenants ADD COLUMN mobile VARCHAR(20);
ALTER TABLE tenants ADD COLUMN onboarding_status SMALLINT DEFAULT 0; -- 0 = Pending, 1 = In Progress, 2 = Completed

COMMENT ON COLUMN tenants.mobile IS 'Business mobile number of the tenant';
COMMENT ON COLUMN tenants.onboarding_status IS '0 = Pending, 1 = In Progress, 2 = Completed';




CREATE TABLE franchise_owner_details (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  tenant_uid VARCHAR(255) NOT NULL,
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

CREATE INDEX idx_franchise_owner_details_tenant_uid ON franchise_owner_details(tenant_uid);

COMMENT ON COLUMN franchise_owner_details.id IS 'Auto-incremented primary key';
COMMENT ON COLUMN franchise_owner_details.uid IS 'Unique public identifier (UUID)';
COMMENT ON COLUMN franchise_owner_details.tenant_uid IS 'Reference to the tenant UID (franchise). No FK constraint — maintained at application level';
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




CREATE TABLE franchise_business_details (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  tenant_uid VARCHAR(255) NOT NULL,
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

CREATE INDEX idx_franchise_business_details_tenant_uid ON franchise_business_details(tenant_uid);

COMMENT ON COLUMN franchise_business_details.id IS 'Auto-incremented primary key';
COMMENT ON COLUMN franchise_business_details.uid IS 'Unique public identifier (UUID)';
COMMENT ON COLUMN franchise_business_details.tenant_uid IS 'Reference to the tenant UID (franchise). No FK constraint — maintained at application level';
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




ALTER TABLE menus
ADD COLUMN deleted_at TIMESTAMP DEFAULT NULL;




CREATE TABLE lead_sources (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  tenant_uid VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  color VARCHAR(50),
  sort_order INT DEFAULT 0,
  is_default SMALLINT DEFAULT 0,
  is_active SMALLINT DEFAULT 1,
  is_deleted SMALLINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_by VARCHAR(255),
  CONSTRAINT pk_lead_sources PRIMARY KEY (id),
  CONSTRAINT uq_lead_sources_uid UNIQUE (uid)
);

CREATE INDEX idx_lead_sources_tenant_uid ON lead_sources(tenant_uid);

COMMENT ON TABLE lead_sources IS 'Stores lead sources per tenant';




CREATE TABLE lead_statuses (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  tenant_uid VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  color VARCHAR(50),
  sort_order INT DEFAULT 0,
  is_default SMALLINT DEFAULT 0,
  is_closed SMALLINT DEFAULT 0, -- 0 = Open, 1 = Closed
  is_active SMALLINT DEFAULT 1,
  is_deleted SMALLINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_by VARCHAR(255),
  CONSTRAINT pk_lead_statuses PRIMARY KEY (id),
  CONSTRAINT uq_lead_statuses_uid UNIQUE (uid)
);

CREATE INDEX idx_lead_statuses_tenant_uid ON lead_statuses(tenant_uid);

COMMENT ON TABLE lead_statuses IS 'Stores lead statuses per tenant';




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




DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='franchise_owner_details' AND column_name='franchise_uid') THEN
    ALTER TABLE franchise_owner_details RENAME COLUMN franchise_uid TO tenant_uid;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='franchise_business_details' AND column_name='franchise_uid') THEN
    ALTER TABLE franchise_business_details RENAME COLUMN franchise_uid TO tenant_uid;
  END IF;
END $$;




CREATE TABLE site_surveys (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  tenant_uid VARCHAR(255) NOT NULL,
  lead_uid VARCHAR(255) NOT NULL,
  assigned_to VARCHAR(255) NOT NULL,
  
  -- Module specific fields
  scheduled_at TIMESTAMP NOT NULL,
  status SMALLINT NOT NULL DEFAULT 0, -- 0 = Scheduled, 1 = Completed, 2 = Cancelled, 3 = Rescheduled
  remarks TEXT,
  
  -- Base Fields
  is_active SMALLINT DEFAULT 1,
  is_deleted SMALLINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_by VARCHAR(255),
  
  CONSTRAINT pk_site_surveys PRIMARY KEY (id),
  CONSTRAINT uq_site_surveys_uid UNIQUE (uid)
);

CREATE INDEX idx_site_surveys_tenant_uid ON site_surveys(tenant_uid);
CREATE INDEX idx_site_surveys_lead_uid ON site_surveys(lead_uid);
CREATE INDEX idx_site_surveys_assigned_to ON site_surveys(assigned_to);
CREATE INDEX idx_site_surveys_status ON site_surveys(status);

COMMENT ON TABLE site_surveys IS 'Stores scheduled site surveys for Leads';



ALTER TABLE roles 
ADD COLUMN can_site_survey SMALLINT DEFAULT 0,
ADD COLUMN can_installation SMALLINT DEFAULT 0;



CREATE TABLE site_survey_details (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  tenant_uid VARCHAR(255) NOT NULL,
  site_survey_uid VARCHAR(255) NOT NULL,
  
  -- Technical Specifications
  roof_area_sqft DECIMAL(10, 2) NOT NULL,
  shading SMALLINT NOT NULL, -- 0=None, 1=Low, 2=Medium, 3=High
  connection_type SMALLINT NOT NULL, -- 0=Single Phase, 1=Three Phase
  sanctioned_load_kw DECIMAL(10, 2) NOT NULL,
  recommended_kw DECIMAL(10, 2),
  needs_structure_extension SMALLINT DEFAULT 0, -- 0=No, 1=Yes
  needs_optimizer SMALLINT DEFAULT 0, -- 0=No, 1=Yes
  optimizer_count INTEGER,
  notes TEXT,
  
  -- Base Fields
  is_active SMALLINT DEFAULT 1,
  is_deleted SMALLINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_by VARCHAR(255),
  
  CONSTRAINT pk_site_survey_details PRIMARY KEY (id),
  CONSTRAINT uq_site_survey_details_uid UNIQUE (uid),
  CONSTRAINT uq_site_survey_details_survey UNIQUE (site_survey_uid)
);

CREATE INDEX idx_site_survey_details_tenant_uid ON site_survey_details(tenant_uid);
CREATE INDEX idx_site_survey_details_survey_uid ON site_survey_details(site_survey_uid);

COMMENT ON TABLE site_survey_details IS 'Stores technical specifications for a site survey';




-- 1. survey_document_types
CREATE TABLE survey_document_types (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  tenant_uid VARCHAR(255) NOT NULL,
  
  -- Details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_required SMALLINT DEFAULT 0, -- 0 = Optional, 1 = Required
  allow_multiple SMALLINT DEFAULT 0, -- 0 = Single File, 1 = Multiple Files
  sort_order INT DEFAULT 0,
  is_system SMALLINT DEFAULT 0, -- 0 = Custom, 1 = Default System Document Type

  -- Base Fields
  is_active SMALLINT DEFAULT 1,
  is_deleted SMALLINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_by VARCHAR(255),
  
  CONSTRAINT pk_survey_document_types PRIMARY KEY (id),
  CONSTRAINT uq_survey_document_types_uid UNIQUE (uid)
);

CREATE INDEX idx_survey_doc_types_tenant_uid ON survey_document_types(tenant_uid);

COMMENT ON TABLE survey_document_types IS 'Configurable Survey Document Types for each tenant';

-- 2. site_survey_documents
CREATE TABLE site_survey_documents (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  tenant_uid VARCHAR(255) NOT NULL,
  site_survey_uid VARCHAR(255) NOT NULL,
  document_type_uid VARCHAR(255) NOT NULL,
  
  -- File Details
  original_name VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size BIGINT NOT NULL,
  remarks TEXT,
  
  -- Base Fields
  is_active SMALLINT DEFAULT 1,
  is_deleted SMALLINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_by VARCHAR(255),
  
  CONSTRAINT pk_site_survey_documents PRIMARY KEY (id),
  CONSTRAINT uq_site_survey_documents_uid UNIQUE (uid)
);

CREATE INDEX idx_site_survey_docs_tenant_uid ON site_survey_documents(tenant_uid);
CREATE INDEX idx_site_survey_docs_survey_uid ON site_survey_documents(site_survey_uid);
CREATE INDEX idx_site_survey_docs_type_uid ON site_survey_documents(document_type_uid);

COMMENT ON TABLE site_survey_documents IS 'Stores uploaded documents for a Site Survey';




DO $$
BEGIN
  IF EXISTS(SELECT *
    FROM information_schema.columns
    WHERE table_name='leads' and column_name='required_kw')
  THEN
      ALTER TABLE leads RENAME COLUMN required_kw TO system_size;
  END IF;
END $$;




CREATE TABLE product_categories (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image VARCHAR(1000),
  sort_order INT DEFAULT 0,
  is_active SMALLINT DEFAULT 1,
  is_deleted SMALLINT DEFAULT 0,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_by VARCHAR(255),
  CONSTRAINT pk_product_categories PRIMARY KEY (id),
  CONSTRAINT uq_product_categories_uid UNIQUE (uid),
  CONSTRAINT uq_product_categories_name UNIQUE (name)
);

COMMENT ON TABLE product_categories IS 'Global master data for product categories';




CREATE TABLE product_brands (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  logo VARCHAR(1000),
  sort_order INT DEFAULT 0,
  is_active SMALLINT DEFAULT 1,
  is_deleted SMALLINT DEFAULT 0,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_by VARCHAR(255),
  CONSTRAINT pk_product_brands PRIMARY KEY (id),
  CONSTRAINT uq_product_brands_uid UNIQUE (uid),
  CONSTRAINT uq_product_brands_name UNIQUE (name)
);

COMMENT ON TABLE product_brands IS 'Global master data for product brands';




CREATE TABLE product_units (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  short_name VARCHAR(100),
  description TEXT,
  sort_order INT DEFAULT 0,
  is_active SMALLINT DEFAULT 1,
  is_deleted SMALLINT DEFAULT 0,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_by VARCHAR(255),
  CONSTRAINT pk_product_units PRIMARY KEY (id),
  CONSTRAINT uq_product_units_uid UNIQUE (uid),
  CONSTRAINT uq_product_units_name UNIQUE (name)
);

COMMENT ON TABLE product_units IS 'Global master data for product units';




CREATE TABLE products (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  category_uid VARCHAR(255) NOT NULL,
  brand_uid VARCHAR(255) NOT NULL,
  unit_uid VARCHAR(255) NOT NULL,
  name VARCHAR(500) NOT NULL,
  product_code VARCHAR(255) NOT NULL,
  price_per_unit NUMERIC(15,2) NOT NULL,
  gst_percentage NUMERIC(5,2) NOT NULL,
  capacity VARCHAR(255),
  capacity_unit VARCHAR(100),
  warranty VARCHAR(255),
  description TEXT,
  is_active SMALLINT DEFAULT 1,
  is_deleted SMALLINT DEFAULT 0,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_by VARCHAR(255),
  CONSTRAINT pk_products PRIMARY KEY (id),
  CONSTRAINT uq_products_uid UNIQUE (uid),
  CONSTRAINT uq_products_product_code UNIQUE (product_code),
  CONSTRAINT uq_products_name UNIQUE (name)
);

CREATE INDEX idx_products_category_uid ON products(category_uid);
CREATE INDEX idx_products_brand_uid ON products(brand_uid);

COMMENT ON TABLE products IS 'Global master data for products';




CREATE TABLE state_subsidy_rules (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  state VARCHAR(255) NOT NULL,
  subsidy_per_kw NUMERIC(10,2) NOT NULL DEFAULT 0,
  maximum_subsidy_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  description TEXT,
  is_active SMALLINT DEFAULT 1,
  is_deleted SMALLINT DEFAULT 0,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_by VARCHAR(255),
  CONSTRAINT pk_state_subsidy_rules PRIMARY KEY (id),
  CONSTRAINT uq_state_subsidy_rules_uid UNIQUE (uid),
  CONSTRAINT uq_state_subsidy_rules_state UNIQUE (state)
);

COMMENT ON TABLE state_subsidy_rules IS 'Global master data for state subsidy rules managed by Head Office';



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


CREATE TABLE quotation_scope_of_work (
    uid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_uid UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    value TEXT NOT NULL,
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
CREATE INDEX idx_quotation_scope_of_work_tenant_uid ON quotation_scope_of_work(tenant_uid);

-- Partial unique index on title per tenant for non-deleted records
CREATE UNIQUE INDEX idx_quotation_scope_of_work_tenant_title ON quotation_scope_of_work(tenant_uid, title) WHERE is_deleted = 0;

-- Optional index for sorting
CREATE INDEX idx_quotation_scope_of_work_sort_order ON quotation_scope_of_work(sort_order);



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




ALTER TABLE quotations ADD COLUMN pdf_url VARCHAR(1000);

COMMENT ON COLUMN quotations.pdf_url IS 'Public URL of the generated quotation PDF document stored in Cloudflare R2 / local storage';




ALTER TABLE quotations ADD COLUMN pdf_path VARCHAR(1000);

COMMENT ON COLUMN quotations.pdf_path IS 'Storage key/path of the generated quotation PDF document in the storage provider';




ALTER TABLE franchise_business_details ADD COLUMN outlet_name VARCHAR(255);

COMMENT ON COLUMN franchise_business_details.outlet_name IS 'Brand name or outlet name of the franchise business';




ALTER TABLE products 
ADD COLUMN IF NOT EXISTS model_number VARCHAR(255),
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}'::TEXT[];




-- 1. Create product_document_types table
CREATE TABLE product_document_types (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  
  -- Details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  allowed_extensions VARCHAR(255) DEFAULT 'pdf,jpg,jpeg,png,docx,xlsx',
  allow_multiple SMALLINT DEFAULT 0, -- 0 = Single File, 1 = Multiple Files
  is_required SMALLINT DEFAULT 0, -- 0 = Optional, 1 = Required

  -- Base Fields
  is_active SMALLINT DEFAULT 1,
  is_deleted SMALLINT DEFAULT 0,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_by VARCHAR(255),
  
  CONSTRAINT pk_product_document_types PRIMARY KEY (id),
  CONSTRAINT uq_product_document_types_uid UNIQUE (uid),
  CONSTRAINT uq_product_document_types_name UNIQUE (name)
);

COMMENT ON TABLE product_document_types IS 'Global configuration of product document types';

-- 2. Create product_documents table
CREATE TABLE product_documents (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  product_uid VARCHAR(255) NOT NULL,
  document_type_uid VARCHAR(255) NOT NULL,
  
  -- File Details
  original_file_name VARCHAR(255) NOT NULL,
  stored_file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size BIGINT NOT NULL,
  
  -- Base Fields
  is_active SMALLINT DEFAULT 1,
  is_deleted SMALLINT DEFAULT 0,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_by VARCHAR(255),
  
  CONSTRAINT pk_product_documents PRIMARY KEY (id),
  CONSTRAINT uq_product_documents_uid UNIQUE (uid)
);

CREATE INDEX idx_product_docs_product_uid ON product_documents(product_uid);
CREATE INDEX idx_product_docs_type_uid ON product_documents(document_type_uid);

COMMENT ON TABLE product_documents IS 'Stores metadata for product documents';

-- 3. Seed default product document types
INSERT INTO product_document_types (uid, name, description, allowed_extensions, allow_multiple, is_required)
VALUES 
  ('165d21c4-2736-47b2-b1cf-712e524d77ba', 'Datasheet', 'Technical specification datasheet for the product', 'pdf,doc,docx', 0, 0),
  ('2e3cda4b-568b-4b21-817a-8fbd8eb0cdb6', 'Warranty Document', 'Warranty terms and guidelines', 'pdf,jpg,jpeg,png', 0, 0),
  ('ef6e53d5-d018-4e1b-b461-125bd4e2e28a', 'Installation Manual', 'Guide for installing and configuring the product', 'pdf', 0, 0),
  ('bd7c5e26-a0ef-4f11-9a71-3bfd722da10c', 'Technical Drawing', 'Engineering drawings or schematics', 'pdf,dwg,dxf,jpg,png', 1, 0),
  ('8d6f51cb-1c09-411a-8260-249ebd7e8a15', 'Product Images', 'Marketing or reference images of the product', 'jpg,jpeg,png,webp', 1, 0);




-- 1. Truncate existing data to avoid constraint issues during alter
TRUNCATE TABLE product_documents CASCADE;
TRUNCATE TABLE product_document_types CASCADE;

-- 2. Add tenant_uid to product_document_types
ALTER TABLE product_document_types ADD COLUMN tenant_uid VARCHAR(255) NOT NULL;
CREATE INDEX idx_product_doc_types_tenant_uid ON product_document_types(tenant_uid);

-- 3. Add tenant_uid to product_documents
ALTER TABLE product_documents ADD COLUMN tenant_uid VARCHAR(255) NOT NULL;
CREATE INDEX idx_product_docs_tenant_uid ON product_documents(tenant_uid);

-- 4. Adjust uniqueness constraints
ALTER TABLE product_document_types DROP CONSTRAINT IF EXISTS uq_product_document_types_name;
ALTER TABLE product_document_types ADD CONSTRAINT uq_product_document_types_tenant_name UNIQUE (tenant_uid, name);




CREATE TABLE product_specifications (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  product_uid VARCHAR(255) NOT NULL,
  
  -- Dimensions
  height DECIMAL(10,2) DEFAULT NULL,
  width DECIMAL(10,2) DEFAULT NULL,
  depth DECIMAL(10,2) DEFAULT NULL,
  
  -- Electrical
  max_power DECIMAL(10,2) DEFAULT NULL,
  
  -- Pallet Information
  pallet_length DECIMAL(10,2) DEFAULT NULL,
  pallet_width DECIMAL(10,2) DEFAULT NULL,
  pallet_height DECIMAL(10,2) DEFAULT NULL,
  pallet_weight DECIMAL(10,2) DEFAULT NULL,
  pallet_dimension VARCHAR(255) DEFAULT NULL,
  
  -- Packaging
  quantity_per_pallet INTEGER DEFAULT NULL,
  
  -- Technical
  cell_technology VARCHAR(255) DEFAULT NULL,
  
  -- Base Fields
  is_active SMALLINT DEFAULT 1,
  is_deleted SMALLINT DEFAULT 0,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_by VARCHAR(255),
  
  CONSTRAINT pk_product_specifications PRIMARY KEY (id),
  CONSTRAINT uq_product_specifications_uid UNIQUE (uid),
  CONSTRAINT uq_product_specifications_product_uid UNIQUE (product_uid)
);

CREATE INDEX idx_product_specs_product_uid ON product_specifications(product_uid);

COMMENT ON TABLE product_specifications IS 'Stores specification details for products';




-- Create franchise_document_types table
CREATE TABLE franchise_document_types (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  tenant_uid VARCHAR(255) NOT NULL,

  -- Details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  allow_multiple SMALLINT DEFAULT 0, -- 0 = Single File, 1 = Multiple Files
  is_required SMALLINT DEFAULT 0,    -- 0 = Optional, 1 = Required
  sort_order INT DEFAULT 0,

  -- Base Fields
  is_active SMALLINT DEFAULT 1,
  is_deleted SMALLINT DEFAULT 0,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_by VARCHAR(255),

  CONSTRAINT pk_franchise_document_types PRIMARY KEY (id),
  CONSTRAINT uq_franchise_document_types_uid UNIQUE (uid)
);

-- Index for tenant-scoped queries
CREATE INDEX idx_franchise_doc_types_tenant_uid ON franchise_document_types(tenant_uid);

-- Partial unique index: prevent duplicate names within same tenant for active records
CREATE UNIQUE INDEX uq_franchise_doc_types_tenant_name
  ON franchise_document_types(tenant_uid, name)
  WHERE is_deleted = 0;

COMMENT ON TABLE franchise_document_types IS 'Configurable Franchise Document Types for each tenant';




-- Create franchise_documents table
CREATE TABLE franchise_documents (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  tenant_uid VARCHAR(255) NOT NULL,
  document_type_uid VARCHAR(255) NOT NULL,
  
  -- File Details
  document_number VARCHAR(255),
  original_file_name VARCHAR(255) NOT NULL,
  stored_file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_size BIGINT NOT NULL,
  
  -- Base Fields
  is_active SMALLINT DEFAULT 1,
  is_deleted SMALLINT DEFAULT 0,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_by VARCHAR(255),
  
  CONSTRAINT pk_franchise_documents PRIMARY KEY (id),
  CONSTRAINT uq_franchise_documents_uid UNIQUE (uid)
);

CREATE INDEX idx_franchise_docs_tenant_uid ON franchise_documents(tenant_uid);
CREATE INDEX idx_franchise_docs_type_uid ON franchise_documents(document_type_uid);

COMMENT ON TABLE franchise_documents IS 'Stores metadata for franchise documents uploaded by tenants';



CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE,
    tenant_uid UUID,
    module VARCHAR(100) NOT NULL,
    record_uid UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID
);

CREATE INDEX idx_audit_logs_tenant_uid ON audit_logs(tenant_uid);
CREATE INDEX idx_audit_logs_module ON audit_logs(module);
CREATE INDEX idx_audit_logs_record_uid ON audit_logs(record_uid);
CREATE INDEX idx_audit_logs_created_by ON audit_logs(created_by);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);


-- Create franchise_service_areas table
CREATE TABLE IF NOT EXISTS franchise_service_areas (
    id BIGSERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    tenant_uid UUID NOT NULL,
    city_uid UUID NOT NULL,
    is_active INT DEFAULT 1 NOT NULL,
    is_deleted INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted_by VARCHAR(255)
);



ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_number VARCHAR(255);

-- Update existing records if any
UPDATE leads SET lead_number = 'SS' || LPAD(id::text, 5, '0') WHERE lead_number IS NULL;

-- Make it not null and unique
ALTER TABLE leads ALTER COLUMN lead_number SET NOT NULL;
ALTER TABLE leads ADD CONSTRAINT uq_leads_lead_number UNIQUE (lead_number);




ALTER TABLE quotations ADD COLUMN package_uid VARCHAR(255);
CREATE INDEX idx_quotations_package_uid ON quotations(package_uid);




ALTER TABLE quotations ADD COLUMN price NUMERIC(15, 2);




ALTER TABLE quotation_items ADD COLUMN is_extra SMALLINT DEFAULT 0;




ALTER TABLE quotations ADD COLUMN snapshot_data JSONB;



ALTER TABLE quotations 
DROP COLUMN IF EXISTS price,
ADD COLUMN subtotal NUMERIC(15, 2) DEFAULT 0,
ADD COLUMN gst_amount NUMERIC(15, 2) DEFAULT 0,
ADD COLUMN grand_total NUMERIC(15, 2) DEFAULT 0,
ADD COLUMN subsidy_data JSONB DEFAULT '[]'::jsonb,
ADD COLUMN net_customer_cost NUMERIC(15, 2) DEFAULT 0;


CREATE TABLE IF NOT EXISTS package_scope_of_work_items (
    id SERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    package_uid UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    value TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    updated_by UUID,
    deleted_by UUID
);

CREATE INDEX IF NOT EXISTS idx_package_scope_of_work_items_package_uid ON package_scope_of_work_items(package_uid);
CREATE INDEX IF NOT EXISTS idx_package_scope_of_work_items_is_deleted ON package_scope_of_work_items(is_deleted);


ALTER TABLE quotation_scope_of_work_items ADD COLUMN is_extra SMALLINT DEFAULT 0;


-- Create states table
CREATE TABLE IF NOT EXISTS states (
    id BIGSERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    code INT UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create districts table
CREATE TABLE IF NOT EXISTS districts (
    id BIGSERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    code INT UNIQUE NOT NULL,
    state_uid UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- Create cities table
CREATE TABLE IF NOT EXISTS cities (
    id BIGSERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    code INT UNIQUE NOT NULL,
    state_uid UUID NOT NULL,
    district_uid UUID,
    name VARCHAR(255) NOT NULL,
    local_body_type VARCHAR(100),
    pincode INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);



ALTER TABLE state_subsidy_rules ADD COLUMN state_uid VARCHAR(255) NULL;

-- We could add a foreign key constraint here, but sometimes state_uid might be 'All' if they don't send null.
-- Actually, a foreign key is better if it matches exactly. I will leave it as simple column for now as other tables do.




ALTER TABLE state_subsidy_rules DROP CONSTRAINT IF EXISTS uq_state_subsidy_rules_state;
ALTER TABLE state_subsidy_rules DROP COLUMN IF EXISTS state;



ALTER TABLE cities
ADD COLUMN IF NOT EXISTS block VARCHAR(255),
ADD COLUMN IF NOT EXISTS branch_type VARCHAR(255),
ADD COLUMN IF NOT EXISTS region VARCHAR(255);


CREATE TABLE project_statuses (
  id SERIAL,
  uid UUID NOT NULL,
  tenant_uid UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(50),
  sort_order INT DEFAULT 0,
  is_default INT DEFAULT 0,
  is_closed INT DEFAULT 0,
  description TEXT,
  is_active INT DEFAULT 1,
  is_deleted INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  updated_by UUID,
  deleted_by UUID,
  CONSTRAINT pk_project_statuses PRIMARY KEY (id),
  CONSTRAINT uq_project_statuses_uid UNIQUE (uid)
);

CREATE INDEX idx_project_statuses_tenant_uid ON project_statuses(tenant_uid);

COMMENT ON TABLE project_statuses IS 'Stores project statuses per tenant';

CREATE TABLE projects (
  id SERIAL,
  uid UUID NOT NULL,
  tenant_uid UUID NOT NULL,
  lead_uid UUID NOT NULL,
  quotation_uid UUID NOT NULL,
  project_number VARCHAR(50) NOT NULL,
  project_name VARCHAR(255) NOT NULL,
  project_status_uid UUID NOT NULL,
  project_manager_uid UUID,
  project_date TIMESTAMP,
  remarks TEXT,
  is_active INT DEFAULT 1,
  is_deleted INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  updated_by UUID,
  deleted_by UUID,
  CONSTRAINT pk_projects PRIMARY KEY (id),
  CONSTRAINT uq_projects_uid UNIQUE (uid),
  CONSTRAINT uq_projects_quotation UNIQUE (tenant_uid, quotation_uid)
);

CREATE INDEX idx_projects_tenant_uid ON projects(tenant_uid);
CREATE INDEX idx_projects_lead_uid ON projects(lead_uid);
CREATE INDEX idx_projects_project_number ON projects(project_number);

COMMENT ON TABLE projects IS 'Stores project details linked to approved quotations';


-- Seed Project Menus
INSERT INTO menus (uid, name, code, route, icon, sort_order, parent_uid, is_active, created_at, updated_at)
VALUES 
  ('12345678-0000-0000-0000-000000000001', 'Projects', 'projects', '/projects', 'briefcase', 4, NULL, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Seed Project Features
INSERT INTO features (uid, menu_uid, name, code, is_active, created_at, updated_at)
VALUES 
  ('12345678-0000-0000-0000-000000000002', '12345678-0000-0000-0000-000000000001', 'Export', 'project_export', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('12345678-0000-0000-0000-000000000003', '12345678-0000-0000-0000-000000000001', 'Print', 'project_print', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('12345678-0000-0000-0000-000000000004', '12345678-0000-0000-0000-000000000001', 'Change Status', 'project_change_status', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;



-- Add scheme_name column to state_subsidy_rules table if not exists
ALTER TABLE state_subsidy_rules ADD COLUMN IF NOT EXISTS scheme_name VARCHAR(255) NULL;

-- Create subsidy_document_types table
CREATE TABLE IF NOT EXISTS subsidy_document_types (
    id BIGSERIAL PRIMARY KEY,
    uid VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    allow_multiple SMALLINT DEFAULT 0,
    is_required SMALLINT DEFAULT 0,
    sort_order INT DEFAULT 0,
    is_active SMALLINT DEFAULT 1,
    is_deleted SMALLINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted_by VARCHAR(255)
);

COMMENT ON TABLE subsidy_document_types IS 'Master table for subsidy document types';

-- Create subsidy_required_documents table
CREATE TABLE IF NOT EXISTS subsidy_required_documents (
    id BIGSERIAL PRIMARY KEY,
    uid VARCHAR(255) NOT NULL UNIQUE,
    subsidy_uid VARCHAR(255) NOT NULL,
    document_type_uid VARCHAR(255) NOT NULL,
    sort_order INT DEFAULT 0,
    is_mandatory SMALLINT DEFAULT 1,
    is_active SMALLINT DEFAULT 1,
    is_deleted SMALLINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted_by VARCHAR(255)
);

COMMENT ON TABLE subsidy_required_documents IS 'Mapping table between Subsidies and Document Types';




-- Seed Subsidy Document Types Menu
INSERT INTO menus (uid, name, code, route, icon, sort_order, parent_uid, is_active, created_at, updated_at)
VALUES 
  ('22345678-0000-0000-0000-000000000001', 'Subsidy Document Types', 'SUBSIDY_DOCUMENT_TYPES', '/subsidy-document-types', 'file-text', 10, NULL, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Seed Subsidy Document Types Features
INSERT INTO features (uid, menu_uid, name, code, is_active, created_at, updated_at)
VALUES 
  ('22345678-0000-0000-0000-000000000002', '22345678-0000-0000-0000-000000000001', 'Export', 'subsidy_doc_type_export', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('22345678-0000-0000-0000-000000000003', '22345678-0000-0000-0000-000000000001', 'Change Status', 'subsidy_doc_type_change_status', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;




-- Add soft delete and active status columns to location tables if not exists
ALTER TABLE states ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE NULL;
ALTER TABLE states ADD COLUMN IF NOT EXISTS is_active SMALLINT DEFAULT 1;
ALTER TABLE states ADD COLUMN IF NOT EXISTS is_deleted SMALLINT DEFAULT 0;

ALTER TABLE districts ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE NULL;
ALTER TABLE districts ADD COLUMN IF NOT EXISTS is_active SMALLINT DEFAULT 1;
ALTER TABLE districts ADD COLUMN IF NOT EXISTS is_deleted SMALLINT DEFAULT 0;

ALTER TABLE cities ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE NULL;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS is_active SMALLINT DEFAULT 1;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS is_deleted SMALLINT DEFAULT 0;




CREATE TABLE IF NOT EXISTS project_subsidy_documents (
    id BIGSERIAL PRIMARY KEY,
    uid VARCHAR(255) NOT NULL UNIQUE,
    tenant_uid VARCHAR(255) NOT NULL,
    project_uid VARCHAR(255) NOT NULL,
    document_type_uid VARCHAR(255) NOT NULL,
    
    -- File Details
    original_name VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    remarks TEXT,
    
    -- Base Fields
    is_active SMALLINT DEFAULT 1,
    is_deleted SMALLINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted_by VARCHAR(255)
);

CREATE INDEX idx_project_subsidy_docs_tenant_uid ON project_subsidy_documents(tenant_uid);
CREATE INDEX idx_project_subsidy_docs_project_uid ON project_subsidy_documents(project_uid);
CREATE INDEX idx_project_subsidy_docs_type_uid ON project_subsidy_documents(document_type_uid);

COMMENT ON TABLE project_subsidy_documents IS 'Stores uploaded subsidy documents for a Project';




CREATE TABLE IF NOT EXISTS installation_milestones (
    id BIGSERIAL,
    uid VARCHAR(255) NOT NULL,
    tenant_uid VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sort_order INT DEFAULT 0,
    requires_document SMALLINT DEFAULT 0,
    allow_multiple_images SMALLINT DEFAULT 0,
    is_system SMALLINT DEFAULT 0,
    
    is_active SMALLINT DEFAULT 1,
    is_deleted SMALLINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted_by VARCHAR(255),
    
    CONSTRAINT pk_installation_milestones PRIMARY KEY (id),
    CONSTRAINT uq_installation_milestones_uid UNIQUE (uid)
);

CREATE INDEX IF NOT EXISTS idx_installation_milestones_tenant_uid ON installation_milestones(tenant_uid);
CREATE INDEX IF NOT EXISTS idx_installation_milestones_sort_order ON installation_milestones(sort_order);

COMMENT ON TABLE installation_milestones IS 'Master template for project installation milestones per tenant';




CREATE TABLE IF NOT EXISTS project_installation_milestones (
    id BIGSERIAL,
    uid VARCHAR(255) NOT NULL,
    tenant_uid VARCHAR(255) NOT NULL,
    project_uid VARCHAR(255) NOT NULL,
    milestone_uid VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    sequence_no INT NOT NULL,
    status SMALLINT DEFAULT 0, -- 0=Pending, 1=InProgress, 2=Completed, 3=Skipped, 4=Cancelled
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    completed_by VARCHAR(255),
    remarks TEXT,
    
    is_active SMALLINT DEFAULT 1,
    is_deleted SMALLINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted_by VARCHAR(255),
    
    CONSTRAINT pk_project_installation_milestones PRIMARY KEY (id),
    CONSTRAINT uq_project_installation_milestones_uid UNIQUE (uid)
);

CREATE INDEX IF NOT EXISTS idx_proj_inst_milestones_tenant_uid ON project_installation_milestones(tenant_uid);
CREATE INDEX IF NOT EXISTS idx_proj_inst_milestones_project_uid ON project_installation_milestones(project_uid);
CREATE INDEX IF NOT EXISTS idx_proj_inst_milestones_milestone_uid ON project_installation_milestones(milestone_uid);
CREATE INDEX IF NOT EXISTS idx_proj_inst_milestones_sequence_no ON project_installation_milestones(sequence_no);

COMMENT ON TABLE project_installation_milestones IS 'Tracks the progress of installation milestones for a specific project';
COMMENT ON COLUMN project_installation_milestones.status IS '0=Pending, 1=InProgress, 2=Completed, 3=Skipped, 4=Cancelled';




CREATE TABLE IF NOT EXISTS project_installation_milestone_documents (
    id BIGSERIAL,
    uid VARCHAR(255) NOT NULL,
    tenant_uid VARCHAR(255) NOT NULL,
    project_milestone_uid VARCHAR(255) NOT NULL,
    image_name VARCHAR(255),
    image_path TEXT NOT NULL,
    image_url TEXT NOT NULL,
    mime_type VARCHAR(100),
    file_size BIGINT,
    remarks TEXT,
    
    is_active SMALLINT DEFAULT 1,
    is_deleted SMALLINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted_by VARCHAR(255),
    
    CONSTRAINT pk_project_installation_milestone_docs PRIMARY KEY (id),
    CONSTRAINT uq_project_installation_milestone_docs_uid UNIQUE (uid)
);

CREATE INDEX IF NOT EXISTS idx_proj_inst_milestone_docs_tenant_uid ON project_installation_milestone_documents(tenant_uid);
CREATE INDEX IF NOT EXISTS idx_proj_inst_milestone_docs_milestone_uid ON project_installation_milestone_documents(project_milestone_uid);

COMMENT ON TABLE project_installation_milestone_documents IS 'Stores proof images for project installation milestones';




DO $$ 
DECLARE
    v_tenant_uid VARCHAR(255);
    v_admin_role_uid VARCHAR(255);
    v_menu_uid VARCHAR(255) := 'a429a1dc-bbbb-4d78-9040-5e3fc1400000'; -- Unique UID for this menu
    v_feature_view_uid VARCHAR(255) := 'b819a1dc-bbbb-4d78-9040-5e3fc1400001';
    v_feature_create_uid VARCHAR(255) := 'c719a1dc-bbbb-4d78-9040-5e3fc1400002';
    v_feature_edit_uid VARCHAR(255) := 'd619a1dc-bbbb-4d78-9040-5e3fc1400003';
    v_feature_delete_uid VARCHAR(255) := 'e519a1dc-bbbb-4d78-9040-5e3fc1400004';
BEGIN
    -- Create Menu (Global)
    INSERT INTO menus (uid, name, code, route, icon, sort_order, parent_uid, is_active, created_at, updated_at)
    VALUES (v_menu_uid, 'Installation Milestones', 'installation_milestones', '/settings/installation-milestones', 'CheckSquare', 50, NULL, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (uid) DO NOTHING;
    
    -- Create Features (Global)
    INSERT INTO features (uid, menu_uid, name, code, is_active, created_at, updated_at)
    VALUES 
        (v_feature_view_uid, v_menu_uid, 'View', 'view_installation_milestones', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (v_feature_create_uid, v_menu_uid, 'Create', 'create_installation_milestones', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (v_feature_edit_uid, v_menu_uid, 'Edit', 'edit_installation_milestones', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
        (v_feature_delete_uid, v_menu_uid, 'Delete', 'delete_installation_milestones', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT (uid) DO NOTHING;

    -- Grant Permissions per Tenant
    FOR v_tenant_uid, v_admin_role_uid IN 
        SELECT t.uid, r.uid 
        FROM tenants t
        JOIN roles r ON r.tenant_uid = t.uid AND r.name = 'Super Admin'
    LOOP
        -- Grant Menu Permission
        INSERT INTO role_menu_permissions (uid, tenant_uid, role_uid, menu_uid, can_view)
        VALUES (md5(random()::text), v_tenant_uid, v_admin_role_uid, v_menu_uid, 1)
        ON CONFLICT DO NOTHING;
        
        -- Grant Feature Permissions
        INSERT INTO role_feature_permissions (uid, tenant_uid, role_uid, feature_uid, can_access)
        VALUES 
            (md5(random()::text), v_tenant_uid, v_admin_role_uid, v_feature_view_uid, 1),
            (md5(random()::text), v_tenant_uid, v_admin_role_uid, v_feature_create_uid, 1),
            (md5(random()::text), v_tenant_uid, v_admin_role_uid, v_feature_edit_uid, 1),
            (md5(random()::text), v_tenant_uid, v_admin_role_uid, v_feature_delete_uid, 1)
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;




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




-- Insert Subsidy Tracker Menu
INSERT INTO menus (uid, name, code, route, icon, parent_uid, sort_order, is_active, created_at, updated_at)
SELECT 
    '0a2948ca-13f5-48b4-9da2-a38f32dafc2d',
    'Subsidy Tracker',
    'subsidy_tracker',
    '/subsidy-trackers',
    'subsidy-tracker',
    NULL,
    9,
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM menus WHERE uid = '0a2948ca-13f5-48b4-9da2-a38f32dafc2d'
);

-- Insert Feature Permissions for Subsidy Tracker
INSERT INTO features (uid, menu_uid, name, code, is_active, created_at, updated_at)
SELECT 
    f.uid,
    m.uid,
    f.name,
    f.code,
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM (VALUES 
    ('680f4f95-1f9e-4a6c-9403-ef6a438258dc', 'Upload Documents', 'subsidy_tracker_upload_documents'),
    ('397f39ca-f1bc-4c31-92be-9da35bb3d07e', 'Export', 'subsidy_tracker_export'),
    ('fc31bb7c-2b22-4217-ba0e-a6190bf03e9c', 'Update Financials', 'subsidy_tracker_update_financials')
) AS f(uid, name, code)
CROSS JOIN menus m
WHERE m.uid = '0a2948ca-13f5-48b4-9da2-a38f32dafc2d'
AND NOT EXISTS (
    SELECT 1 FROM features WHERE features.uid = f.uid
);




-- Insert default product document types for every tenant currently in the system
-- Uses gen_random_uuid() so each tenant gets unique UIDs
INSERT INTO product_document_types (uid, tenant_uid, name, description, allowed_extensions, allow_multiple, is_required)
SELECT 
  gen_random_uuid(),
  t.uid,
  'Datasheet',
  'Technical specification datasheet for the product',
  'pdf,doc,docx',
  0,
  0
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM product_document_types pdt WHERE pdt.tenant_uid = t.uid AND pdt.name = 'Datasheet'
);

INSERT INTO product_document_types (uid, tenant_uid, name, description, allowed_extensions, allow_multiple, is_required)
SELECT 
  gen_random_uuid(),
  t.uid,
  'Warranty Document',
  'Warranty terms and guidelines',
  'pdf,jpg,jpeg,png',
  0,
  0
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM product_document_types pdt WHERE pdt.tenant_uid = t.uid AND pdt.name = 'Warranty Document'
);

INSERT INTO product_document_types (uid, tenant_uid, name, description, allowed_extensions, allow_multiple, is_required)
SELECT 
  gen_random_uuid(),
  t.uid,
  'Installation Manual',
  'Guide for installing and configuring the product',
  'pdf',
  0,
  0
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM product_document_types pdt WHERE pdt.tenant_uid = t.uid AND pdt.name = 'Installation Manual'
);

INSERT INTO product_document_types (uid, tenant_uid, name, description, allowed_extensions, allow_multiple, is_required)
SELECT 
  gen_random_uuid(),
  t.uid,
  'Technical Drawing',
  'Engineering drawings or schematics',
  'pdf,dwg,dxf,jpg,png',
  1,
  0
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM product_document_types pdt WHERE pdt.tenant_uid = t.uid AND pdt.name = 'Technical Drawing'
);

-- Note: The API hardcodes a specific UUID fallback if this name isn't found, but it looks it up by name first.
INSERT INTO product_document_types (uid, tenant_uid, name, description, allowed_extensions, allow_multiple, is_required)
SELECT 
  gen_random_uuid(),
  t.uid,
  'Product Images',
  'Marketing or reference images of the product',
  'jpg,jpeg,png,webp',
  1,
  0
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM product_document_types pdt WHERE pdt.tenant_uid = t.uid AND pdt.name = 'Product Images'
);




ALTER TABLE product_categories
ADD COLUMN is_dynamic SMALLINT DEFAULT 1;

COMMENT ON COLUMN product_categories.is_dynamic IS '1 for dynamic, 0 for static/default';




ALTER TABLE product_specifications
DROP COLUMN IF EXISTS depth;



CREATE TABLE IF NOT EXISTS packages (
    id SERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    tenant_uid UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    package_code VARCHAR(100) NOT NULL,
    description TEXT,
    capacity_kw DECIMAL(10, 2),
    price DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    updated_by UUID,
    deleted_by UUID,
    UNIQUE (tenant_uid, name),
    UNIQUE (tenant_uid, package_code)
);

CREATE INDEX IF NOT EXISTS idx_packages_tenant_uid ON packages(tenant_uid);
CREATE INDEX IF NOT EXISTS idx_packages_uid ON packages(uid);
CREATE INDEX IF NOT EXISTS idx_packages_is_active ON packages(is_active);
CREATE INDEX IF NOT EXISTS idx_packages_is_deleted ON packages(is_deleted);

CREATE TABLE IF NOT EXISTS package_products (
    id SERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    package_uid UUID NOT NULL,
    product_uid UUID NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL CHECK (quantity > 0),
    unit_price_snapshot DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    remarks TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    updated_by UUID,
    deleted_by UUID
);

CREATE INDEX IF NOT EXISTS idx_package_products_package_uid ON package_products(package_uid);
CREATE INDEX IF NOT EXISTS idx_package_products_product_uid ON package_products(product_uid);
CREATE INDEX IF NOT EXISTS idx_package_products_is_deleted ON package_products(is_deleted);



-- Insert Packages Menu
INSERT INTO menus (uid, name, code, route, icon, parent_uid, sort_order, is_active, created_at, updated_at)
SELECT 
    '2300b91f-5fc0-4a82-95f2-95d181057c74',
    'Packages',
    'packages',
    '/packages',
    'package',
    NULL,
    10,
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM menus WHERE uid = '2300b91f-5fc0-4a82-95f2-95d181057c74'
);

-- Insert Feature Permissions for Packages
INSERT INTO features (uid, menu_uid, name, code, is_active, created_at, updated_at)
SELECT 
    f.uid,
    m.uid,
    f.name,
    f.code,
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM (VALUES 
    ('7cc3a5de-80df-4f40-b6ab-1d38260b0d36', 'Export', 'packages_export'),
    ('9eab0044-c6a6-455b-add6-d3c26786e680', 'Duplicate Package', 'packages_duplicate')
) AS f(uid, name, code)
CROSS JOIN menus m
WHERE m.uid = '2300b91f-5fc0-4a82-95f2-95d181057c74'
AND NOT EXISTS (
    SELECT 1 FROM features WHERE features.uid = f.uid
);



ALTER TABLE product_specifications ADD COLUMN IF NOT EXISTS length numeric(10,2);


ALTER TABLE product_specifications DROP COLUMN max_power;



CREATE TABLE product_cell_technologies (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0,
  is_active SMALLINT DEFAULT 1,
  is_deleted SMALLINT DEFAULT 0,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_by VARCHAR(255),
  CONSTRAINT pk_product_cell_technologies PRIMARY KEY (id),
  CONSTRAINT uq_product_cell_technologies_uid UNIQUE (uid),
  CONSTRAINT uq_product_cell_technologies_name UNIQUE (name)
);

COMMENT ON TABLE product_cell_technologies IS 'Global master data for product cell technologies';




ALTER TABLE products 
ADD COLUMN cell_technology_uid VARCHAR(255) DEFAULT NULL;

ALTER TABLE product_specifications 
DROP COLUMN cell_technology;




ALTER TABLE product_categories
ADD COLUMN has_cell_category SMALLINT DEFAULT 0;

COMMENT ON COLUMN product_categories.has_cell_category IS '1 if products in this category require a cell technology, 0 otherwise';




DROP TABLE IF EXISTS product_specifications;

-- Specifications definitions per Category
CREATE TABLE product_specifications (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  category_uid VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  value_type SMALLINT NOT NULL DEFAULT 0, -- 0 = Text, 1 = Number, 2 = Decimal, 3 = Dropdown, 4 = Boolean, 5 = Date
  unit_uid VARCHAR(255),
  sort_order INT DEFAULT 0,
  is_required SMALLINT DEFAULT 0,
  is_active SMALLINT DEFAULT 1,
  is_deleted SMALLINT DEFAULT 0,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_by VARCHAR(255),
  CONSTRAINT pk_product_specifications PRIMARY KEY (id),
  CONSTRAINT uq_product_specifications_uid UNIQUE (uid)
);

CREATE INDEX idx_product_specs_category_uid ON product_specifications(category_uid);

COMMENT ON TABLE product_specifications IS 'Stores dynamic specification definitions for Product Categories';

-- Options for Dropdown type specifications
CREATE TABLE product_specification_options (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  specification_uid VARCHAR(255) NOT NULL,
  value VARCHAR(255) NOT NULL,
  sort_order INT DEFAULT 0,
  is_active SMALLINT DEFAULT 1,
  is_deleted SMALLINT DEFAULT 0,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_by VARCHAR(255),
  CONSTRAINT pk_product_specification_options PRIMARY KEY (id),
  CONSTRAINT uq_product_specification_options_uid UNIQUE (uid)
);

CREATE INDEX idx_product_spec_options_spec_uid ON product_specification_options(specification_uid);

COMMENT ON TABLE product_specification_options IS 'Stores options for Dropdown product specifications';

-- Values for actual Products
CREATE TABLE product_specification_values (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  product_uid VARCHAR(255) NOT NULL,
  specification_uid VARCHAR(255) NOT NULL,
  value VARCHAR(1000),
  is_active SMALLINT DEFAULT 1,
  is_deleted SMALLINT DEFAULT 0,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_by VARCHAR(255),
  CONSTRAINT pk_product_specification_values PRIMARY KEY (id),
  CONSTRAINT uq_product_specification_values_uid UNIQUE (uid)
);

CREATE INDEX idx_product_spec_values_product_uid ON product_specification_values(product_uid);
CREATE INDEX idx_product_spec_values_spec_uid ON product_specification_values(specification_uid);

COMMENT ON TABLE product_specification_values IS 'Stores actual specification values for Products';




DO $$
DECLARE
    v_menu_uid VARCHAR(255) := gen_random_uuid();
    v_ho_tenant_uid VARCHAR(255);
    v_master_role_uid VARCHAR(255);
    v_admin_user_uid VARCHAR(255);
BEGIN
    -- 1. Insert Menu
    INSERT INTO menus (uid, name, code, route, icon, sort_order, is_active)
    VALUES (v_menu_uid, 'Product Specifications', 'PRODUCT_SPECIFICATIONS', '/product-specifications', 'List', 7, 1)
    ON CONFLICT (code) DO NOTHING;

    -- Get the actual UID if it already existed (though we just generated it, ON CONFLICT might skip insert)
    SELECT uid INTO v_menu_uid FROM menus WHERE code = 'PRODUCT_SPECIFICATIONS';

    -- 2. Get Head Office Tenant
    SELECT uid INTO v_ho_tenant_uid FROM tenants WHERE code = 'HO' AND is_deleted = 0 LIMIT 1;
    
    -- 3. Get Master Role
    IF v_ho_tenant_uid IS NOT NULL THEN
        SELECT uid INTO v_master_role_uid FROM roles WHERE name = 'Master' AND tenant_uid = v_ho_tenant_uid LIMIT 1;
        
        IF v_master_role_uid IS NOT NULL AND v_menu_uid IS NOT NULL THEN
            -- Grant permissions to Master role
            INSERT INTO role_menu_permissions (tenant_uid, role_uid, menu_uid, can_view, can_create, can_edit, can_delete)
            VALUES (v_ho_tenant_uid, v_master_role_uid, v_menu_uid, 1, 1, 1, 1)
            ON CONFLICT DO NOTHING;
        END IF;

        -- 4. Get Admin User
        SELECT uid INTO v_admin_user_uid FROM users WHERE email = 'admin@sunselect.com' AND tenant_uid = v_ho_tenant_uid LIMIT 1;
        
        IF v_admin_user_uid IS NOT NULL AND v_menu_uid IS NOT NULL THEN
            -- Grant permissions to Admin user
            INSERT INTO user_menu_permissions (tenant_uid, user_uid, menu_uid, can_view, can_create, can_edit, can_delete)
            VALUES (v_ho_tenant_uid, v_admin_user_uid, v_menu_uid, 1, 1, 1, 1)
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;

END $$;




-- 1. Create mapping table
CREATE TABLE product_category_specifications (
  id BIGSERIAL,
  uid VARCHAR(255) NOT NULL,
  category_uid VARCHAR(255) NOT NULL,
  specification_uid VARCHAR(255) NOT NULL,
  sort_order INT DEFAULT 0,
  is_required SMALLINT DEFAULT 0,
  default_visible SMALLINT DEFAULT 1,
  is_active SMALLINT DEFAULT 1,
  is_deleted SMALLINT DEFAULT 0,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  deleted_by VARCHAR(255),
  CONSTRAINT pk_product_category_specifications PRIMARY KEY (id),
  CONSTRAINT uq_product_category_specifications_uid UNIQUE (uid),
  CONSTRAINT uq_product_category_spec_mapping UNIQUE (category_uid, specification_uid)
);

CREATE INDEX idx_prod_cat_specs_cat ON product_category_specifications(category_uid);
CREATE INDEX idx_prod_cat_specs_spec ON product_category_specifications(specification_uid);

COMMENT ON TABLE product_category_specifications IS 'Maps master specifications to product categories with category-specific settings';

-- 2. Add is_visible to product_specification_values
ALTER TABLE product_specification_values 
ADD COLUMN is_visible SMALLINT DEFAULT 1;

-- 3. Backfill data into mapping table
-- We assume `gen_random_uuid()` is available. If not, we will rely on application logic to migrate, or use gen_random_uuid() if PG13+.
-- Since we might not have uuid generation extension enabled by default everywhere, let's use md5(random()::text) as a fallback if gen_random_uuid() fails, or just use gen_random_uuid().
-- The CRM seems to use `gen_random_uuid()` as seen in `20260727030100_seed_product_specifications_menus.sql`.
INSERT INTO product_category_specifications (
  uid, category_uid, specification_uid, sort_order, is_required, default_visible,
  is_active, is_deleted, created_at, updated_at, created_by
)
SELECT 
  gen_random_uuid(), 
  category_uid, 
  uid, 
  sort_order, 
  is_required, 
  1, 
  is_active, 
  is_deleted, 
  created_at, 
  updated_at, 
  created_by
FROM product_specifications;

-- 4. Alter product_specifications table
ALTER TABLE product_specifications
DROP COLUMN category_uid,
DROP COLUMN sort_order,
DROP COLUMN is_required;

-- Add Unique constraint to title in the library
-- Wait, if duplicate titles exist across different categories, this will fail. Let's not enforce uniqueness here to be safe and avoid blocking migrations. Wait, the user specifically requested: "Prevent duplicate Titles in the Specification Library."
-- So I should enforce uniqueness on Title. We hope there are no duplicates right now. 
-- Wait, if there are duplicates, the migration will crash. 
-- Let's do this: we'll enforce the constraint at the application level in the service and omit the database UNIQUE constraint for `title` just in case there are duplicates we can't auto-resolve right now.
-- Actually, let's add it. It's best practice. If it fails, I'll fix it.

ALTER TABLE product_specifications 
ADD CONSTRAINT uq_product_specifications_title UNIQUE (title);




ALTER TABLE product_specification_values
DROP COLUMN IF EXISTS is_visible;




ALTER TABLE product_category_specifications
DROP COLUMN IF EXISTS default_visible;




-- Remove cell technology column from products
ALTER TABLE products DROP COLUMN IF EXISTS cell_technology_uid;

-- Remove has_cell_category column from product categories
ALTER TABLE product_categories DROP COLUMN IF EXISTS has_cell_category;

-- Drop the cell technologies table
DROP TABLE IF EXISTS product_cell_technologies;




CREATE TABLE email_logs (
    id BIGSERIAL PRIMARY KEY,
    uid VARCHAR(255) NOT NULL UNIQUE,
    tenant_uid VARCHAR(255) NOT NULL,
    module VARCHAR(100) NOT NULL,
    reference_uid VARCHAR(255) NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    template_name VARCHAR(100) NOT NULL,
    status SMALLINT DEFAULT 0, -- 0 = Pending, 1 = Sent, 2 = Failed
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Base Audit Fields
    is_active SMALLINT DEFAULT 1,
    is_deleted SMALLINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted_by VARCHAR(255)
);

CREATE INDEX idx_email_logs_tenant_uid ON email_logs(tenant_uid);
CREATE INDEX idx_email_logs_module ON email_logs(module);
CREATE INDEX idx_email_logs_reference_uid ON email_logs(reference_uid);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_recipient_email ON email_logs(recipient_email);

COMMENT ON TABLE email_logs IS 'Stores logs of all outgoing emails and their status';




CREATE TABLE IF NOT EXISTS notification_logs (
    id BIGSERIAL PRIMARY KEY,
    uid VARCHAR(255) NOT NULL UNIQUE,
    tenant_uid VARCHAR(255) NOT NULL,
    module VARCHAR(100) NOT NULL,
    reference_uid VARCHAR(255) NOT NULL,
    channel SMALLINT NOT NULL DEFAULT 0,       -- 0=Email, 1=SMS, 2=WhatsApp, 3=Push, 4=InApp
    template VARCHAR(100) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    status SMALLINT NOT NULL DEFAULT 0,        -- 0=Pending, 1=Queued, 2=Processing, 3=Sent, 4=Failed, 5=FallbackUsed
    delivery_mode SMALLINT NOT NULL DEFAULT 0, -- 0=Direct, 1=BullMQ
    error_message TEXT,
    retry_count SMALLINT NOT NULL DEFAULT 0,
    sent_at TIMESTAMP WITH TIME ZONE,

    -- Base Audit Fields
    is_active SMALLINT DEFAULT 1,
    is_deleted SMALLINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted_by VARCHAR(255)
);

CREATE INDEX idx_notification_logs_tenant_uid ON notification_logs(tenant_uid);
CREATE INDEX idx_notification_logs_module ON notification_logs(module);
CREATE INDEX idx_notification_logs_reference_uid ON notification_logs(reference_uid);
CREATE INDEX idx_notification_logs_channel ON notification_logs(channel);
CREATE INDEX idx_notification_logs_status ON notification_logs(status);
CREATE INDEX idx_notification_logs_delivery_mode ON notification_logs(delivery_mode);
CREATE INDEX idx_notification_logs_recipient ON notification_logs(recipient);
CREATE INDEX idx_notification_logs_template ON notification_logs(template);

COMMENT ON TABLE notification_logs IS 'Stores logs of all outgoing notifications across all channels with delivery mode tracking';



ALTER TABLE packages RENAME COLUMN price TO recomended_price;


ALTER TABLE package_scope_of_work_items ADD COLUMN scope_of_work_uid UUID;


ALTER TABLE quotation_scope_of_work_items ADD COLUMN scope_of_work_uid UUID;



-- 1. Alter quotation_terms_conditions table description column to array type
ALTER TABLE quotation_terms_conditions 
  ALTER COLUMN description TYPE TEXT[] 
  USING ARRAY[description];

-- 2. Alter quotation_terms_conditions_items table description column to array type
ALTER TABLE quotation_terms_conditions_items 
  ALTER COLUMN description TYPE TEXT[] 
  USING ARRAY[description];



-- Add latitude and longitude columns to site_surveys table
ALTER TABLE site_surveys ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7) NULL;
ALTER TABLE site_surveys ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7) NULL;



-- ============================================================
-- 1. master_document_types — Unified type registry
-- Replaces: survey_document_types, subsidy_document_types,
--           product_document_types, franchise_document_types
-- ============================================================
CREATE TABLE IF NOT EXISTS master_document_types (
    id BIGSERIAL,
    uid VARCHAR(255) NOT NULL,
    tenant_uid VARCHAR(255),               -- NULL = global, non-null = tenant-specific

    -- Details
    name VARCHAR(255) NOT NULL,
    category SMALLINT NOT NULL DEFAULT 5,
    description TEXT,
    allowed_extensions VARCHAR(255) DEFAULT 'pdf,jpg,jpeg,png',
    allow_multiple SMALLINT DEFAULT 0,      -- 0 = Single File, 1 = Multiple Files
    is_required SMALLINT DEFAULT 0,         -- 0 = Optional, 1 = Required
    applicable_modules TEXT[] DEFAULT '{}', -- e.g., {"site_survey","subsidy_tracker","franchise","product"}
    sort_order INT DEFAULT 0,
    is_system SMALLINT DEFAULT 0,           -- 0 = Custom, 1 = System default (cannot be deleted)
    is_common_for_all_modules SMALLINT DEFAULT 0, -- 0 = No, 1 = Yes

    -- Base Fields
    is_active SMALLINT DEFAULT 1,
    is_deleted SMALLINT DEFAULT 0,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted_by VARCHAR(255),

    CONSTRAINT pk_master_document_types PRIMARY KEY (id),
    CONSTRAINT uq_master_document_types_uid UNIQUE (uid)
);

CREATE INDEX IF NOT EXISTS idx_master_doc_types_tenant ON master_document_types(tenant_uid);
CREATE INDEX IF NOT EXISTS idx_master_doc_types_category ON master_document_types(category);
CREATE INDEX IF NOT EXISTS idx_master_doc_types_modules ON master_document_types USING GIN (applicable_modules);

COMMENT ON TABLE master_document_types IS 'Unified document type registry replacing all module-specific type tables';
COMMENT ON COLUMN master_document_types.category IS '1: identity, 2: address, 3: financial, 4: technical, 5: general';
COMMENT ON COLUMN master_document_types.applicable_modules IS 'Array of modules where this doc can be used (e.g. site_survey, franchise, product, etc)';

-- ============================================================
-- 2. master_documents — Single file store
-- Replaces: site_survey_documents, project_subsidy_documents,
--           product_documents, franchise_documents,
--           project_installation_milestone_documents
-- ============================================================
CREATE TABLE IF NOT EXISTS master_documents (
    id BIGSERIAL,
    uid VARCHAR(255) NOT NULL,
    tenant_uid VARCHAR(255) NOT NULL,
    document_type_uid VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,       -- 'customer', 'lead', 'franchise', 'product'
    entity_uid VARCHAR(255) NOT NULL,       -- uid of the customer/lead/franchise/product

    -- File Details
    original_name VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    document_number VARCHAR(255),           -- For identity docs (Aadhaar number, PAN, GST, etc.)
    remarks TEXT,

    -- Versioning
    version INT DEFAULT 1,
    is_latest SMALLINT DEFAULT 1,
    parent_document_uid VARCHAR(255),       -- Points to previous version of same doc

    -- Base Fields
    is_active SMALLINT DEFAULT 1,
    is_deleted SMALLINT DEFAULT 0,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted_by VARCHAR(255),

    CONSTRAINT pk_master_documents PRIMARY KEY (id),
    CONSTRAINT uq_master_documents_uid UNIQUE (uid)
);

CREATE INDEX IF NOT EXISTS idx_master_docs_tenant ON master_documents(tenant_uid);
CREATE INDEX IF NOT EXISTS idx_master_docs_entity ON master_documents(entity_type, entity_uid);
CREATE INDEX IF NOT EXISTS idx_master_docs_type ON master_documents(document_type_uid);
CREATE INDEX IF NOT EXISTS idx_master_docs_latest ON master_documents(is_latest) WHERE is_latest = 1;

COMMENT ON TABLE master_documents IS 'Central document vault — stores each file exactly once, shared across modules';

-- ============================================================
-- 3. document_associations — Links docs to module contexts
-- ============================================================
CREATE TABLE IF NOT EXISTS document_associations (
    id BIGSERIAL,
    uid VARCHAR(255) NOT NULL,
    tenant_uid VARCHAR(255) NOT NULL,
    master_document_uid VARCHAR(255) NOT NULL,

    -- Module context
    module VARCHAR(50) NOT NULL,            -- 'site_survey', 'subsidy_tracker', 'project', 'franchise', 'product'
    context_uid VARCHAR(255) NOT NULL,      -- uid of the site_survey/project/franchise/product

    -- Optional
    remarks TEXT,

    -- Base Fields
    is_active SMALLINT DEFAULT 1,
    is_deleted SMALLINT DEFAULT 0,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    deleted_by VARCHAR(255),

    CONSTRAINT pk_document_associations PRIMARY KEY (id),
    CONSTRAINT uq_document_associations_uid UNIQUE (uid)
);

-- Prevent duplicate associations (same doc → same module + context)
CREATE UNIQUE INDEX IF NOT EXISTS idx_doc_assoc_unique
    ON document_associations(master_document_uid, module, context_uid)
    WHERE is_deleted = 0;

CREATE INDEX IF NOT EXISTS idx_doc_assoc_context ON document_associations(module, context_uid);
CREATE INDEX IF NOT EXISTS idx_doc_assoc_master ON document_associations(master_document_uid);
CREATE INDEX IF NOT EXISTS idx_doc_assoc_tenant ON document_associations(tenant_uid);

COMMENT ON TABLE document_associations IS 'Links master documents to specific module contexts (site survey, project, franchise, etc.)';

-- ============================================================
-- 4. Seed common document types (global, system defaults)
-- ============================================================
INSERT INTO master_document_types (uid, tenant_uid, name, category, description, allowed_extensions, allow_multiple, is_required, applicable_modules, sort_order, is_system)
VALUES
    -- Identity Documents (shared across site_survey, subsidy_tracker, franchise)
    (gen_random_uuid(), NULL, 'Aadhaar Card', 1, 'Government issued Aadhaar identity card', 'pdf,jpg,jpeg,png', 0, 1, '{"site_survey","subsidy_tracker","franchise"}', 1, 1),
    (gen_random_uuid(), NULL, 'PAN Card', 1, 'Permanent Account Number card', 'pdf,jpg,jpeg,png', 0, 0, '{"site_survey","subsidy_tracker","franchise"}', 2, 1),
    (gen_random_uuid(), NULL, 'Voter ID', 1, 'Voter identity card', 'pdf,jpg,jpeg,png', 0, 0, '{"site_survey","franchise"}', 3, 1),
    (gen_random_uuid(), NULL, 'Passport', 1, 'Indian passport', 'pdf,jpg,jpeg,png', 0, 0, '{"site_survey","franchise"}', 4, 1),

    -- Address / Utility Documents
    (gen_random_uuid(), NULL, 'Electricity Bill', 2, 'Latest electricity bill from DISCOM', 'pdf,jpg,jpeg,png', 0, 1, '{"site_survey","subsidy_tracker"}', 5, 1),
    (gen_random_uuid(), NULL, 'Property Tax Receipt', 2, 'Latest property tax receipt', 'pdf,jpg,jpeg,png', 0, 0, '{"site_survey","subsidy_tracker"}', 6, 1),

    -- Financial Documents
    (gen_random_uuid(), NULL, 'Bank Passbook / Statement', 3, 'Bank passbook front page or recent statement', 'pdf,jpg,jpeg,png', 0, 0, '{"subsidy_tracker","franchise"}', 7, 1),
    (gen_random_uuid(), NULL, 'Cancelled Cheque', 3, 'Cancelled cheque for bank verification', 'pdf,jpg,jpeg,png', 0, 0, '{"subsidy_tracker","franchise"}', 8, 1),

    -- Franchise-specific Documents
    (gen_random_uuid(), NULL, 'GST Certificate', 3, 'GST registration certificate', 'pdf,jpg,jpeg,png', 0, 0, '{"franchise"}', 9, 1),
    (gen_random_uuid(), NULL, 'Company Registration', 3, 'Company/firm registration certificate', 'pdf,jpg,jpeg,png', 0, 0, '{"franchise"}', 10, 1),

    -- Subsidy-specific Documents
    (gen_random_uuid(), NULL, 'Net Meter Application', 5, 'Net metering application form', 'pdf,jpg,jpeg,png,docx', 0, 0, '{"subsidy_tracker"}', 11, 1),
    (gen_random_uuid(), NULL, 'Subsidy Portal Screenshot', 5, 'Screenshot from subsidy portal', 'pdf,jpg,jpeg,png', 1, 0, '{"subsidy_tracker"}', 12, 1),

    -- Product-specific Documents
    (gen_random_uuid(), NULL, 'Datasheet', 4, 'Technical specification datasheet for the product', 'pdf,doc,docx', 0, 0, '{"product"}', 13, 1),
    (gen_random_uuid(), NULL, 'Warranty Document', 4, 'Warranty terms and guidelines', 'pdf,jpg,jpeg,png', 0, 0, '{"product"}', 14, 1),
    (gen_random_uuid(), NULL, 'Installation Manual', 4, 'Guide for installing and configuring the product', 'pdf', 0, 0, '{"product"}', 15, 1),
    (gen_random_uuid(), NULL, 'Technical Drawing', 4, 'Engineering drawings or schematics', 'pdf,dwg,dxf,jpg,png', 1, 0, '{"product"}', 16, 1),
    (gen_random_uuid(), NULL, 'Product Images', 4, 'Marketing or reference images of the product', 'jpg,jpeg,png,webp', 1, 0, '{"product"}', 17, 1),

    -- Site Survey specific
    (gen_random_uuid(), NULL, 'Site Photo', 5, 'Photos of the installation site', 'jpg,jpeg,png,webp', 1, 0, '{"site_survey"}', 18, 1),
    (gen_random_uuid(), NULL, 'Roof Photo', 5, 'Photos of the roof area', 'jpg,jpeg,png,webp', 1, 0, '{"site_survey"}', 19, 1);





-- ==============================================================================
-- UNIFIED DOCUMENT VAULT MIGRATION
-- Moves data from siloed tables to master_documents and document_associations
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Migrate Site Survey Documents
-- ------------------------------------------------------------------------------
WITH mapped AS (
    SELECT 
        gen_random_uuid() AS m_uid,
        sd.tenant_uid,
        mdt.uid AS doc_type_uid,
        'lead' AS entity_type,
        ss.lead_uid AS entity_uid,
        sd.original_name,
        sd.file_name,
        sd.file_url,
        sd.mime_type,
        sd.file_size,
        sd.remarks,
        sd.created_by,
        sd.site_survey_uid,
        sd.created_at,
        sd.updated_at
    FROM site_survey_documents sd
    JOIN site_surveys ss ON sd.site_survey_uid = ss.uid
    LEFT JOIN survey_document_types sdt ON sd.document_type_uid = sdt.uid
    LEFT JOIN master_document_types mdt ON sdt.name = mdt.name
    WHERE sd.is_deleted = 0
),
inserted_docs AS (
    INSERT INTO master_documents (
        uid, tenant_uid, document_type_uid, entity_type, entity_uid,
        original_name, file_name, file_url, mime_type, file_size,
        remarks, created_by, created_at, updated_at
    )
    SELECT 
        m_uid, tenant_uid, COALESCE(doc_type_uid, (SELECT uid FROM master_document_types WHERE name = 'Site Photo' LIMIT 1)),
        entity_type, entity_uid, original_name, file_name, file_url, mime_type, file_size,
        remarks, created_by, created_at, updated_at
    FROM mapped
)
INSERT INTO document_associations (
    uid, tenant_uid, master_document_uid, module, context_uid, created_by, created_at, updated_at
)
SELECT 
    gen_random_uuid(), tenant_uid, m_uid, 'site_survey', site_survey_uid, created_by, created_at, updated_at
FROM mapped;

-- ------------------------------------------------------------------------------
-- 2. Migrate Product Documents
-- ------------------------------------------------------------------------------
WITH mapped AS (
    SELECT 
        gen_random_uuid() AS m_uid,
        pd.tenant_uid,
        mdt.uid AS doc_type_uid,
        'product' AS entity_type,
        pd.product_uid AS entity_uid,
        pd.original_file_name,
        pd.stored_file_name,
        pd.file_path,
        pd.mime_type,
        pd.file_size,
        NULL AS remarks,
        pd.created_by,
        pd.product_uid,
        pd.created_at,
        pd.updated_at
    FROM product_documents pd
    LEFT JOIN product_document_types pdt ON pd.document_type_uid = pdt.uid
    LEFT JOIN master_document_types mdt ON pdt.name = mdt.name
    WHERE pd.is_deleted = 0
),
inserted_docs AS (
    INSERT INTO master_documents (
        uid, tenant_uid, document_type_uid, entity_type, entity_uid,
        original_name, file_name, file_url, mime_type, file_size,
        remarks, created_by, created_at, updated_at
    )
    SELECT 
        m_uid, tenant_uid, COALESCE(doc_type_uid, (SELECT uid FROM master_document_types WHERE name = 'Datasheet' LIMIT 1)),
        entity_type, entity_uid, original_file_name, stored_file_name, file_path, mime_type, file_size,
        remarks, created_by, created_at, updated_at
    FROM mapped
)
INSERT INTO document_associations (
    uid, tenant_uid, master_document_uid, module, context_uid, created_by, created_at, updated_at
)
SELECT 
    gen_random_uuid(), tenant_uid, m_uid, 'product', product_uid, created_by, created_at, updated_at
FROM mapped;

-- ------------------------------------------------------------------------------
-- 3. Migrate Franchise Documents
-- ------------------------------------------------------------------------------
WITH mapped AS (
    SELECT 
        gen_random_uuid() AS m_uid,
        fd.tenant_uid,
        mdt.uid AS doc_type_uid,
        'franchise' AS entity_type,
        fd.tenant_uid AS entity_uid,
        fd.original_file_name,
        fd.stored_file_name,
        fd.file_path,
        fd.mime_type,
        fd.file_size,
        fd.document_number,
        fd.created_by,
        fd.tenant_uid AS context_uid,
        fd.created_at,
        fd.updated_at
    FROM franchise_documents fd
    LEFT JOIN franchise_document_types fdt ON fd.document_type_uid = fdt.uid
    LEFT JOIN master_document_types mdt ON fdt.name = mdt.name
    WHERE fd.is_deleted = 0
),
inserted_docs AS (
    INSERT INTO master_documents (
        uid, tenant_uid, document_type_uid, entity_type, entity_uid,
        original_name, file_name, file_url, mime_type, file_size,
        document_number, created_by, created_at, updated_at
    )
    SELECT 
        m_uid, tenant_uid, COALESCE(doc_type_uid, (SELECT uid FROM master_document_types WHERE name = 'GST Certificate' LIMIT 1)),
        entity_type, entity_uid, original_file_name, stored_file_name, file_path, mime_type, file_size,
        document_number, created_by, created_at, updated_at
    FROM mapped
)
INSERT INTO document_associations (
    uid, tenant_uid, master_document_uid, module, context_uid, created_by, created_at, updated_at
)
SELECT 
    gen_random_uuid(), tenant_uid, m_uid, 'franchise', context_uid, created_by, created_at, updated_at
FROM mapped;

-- ------------------------------------------------------------------------------
-- 4. Migrate Project Subsidy Documents
-- ------------------------------------------------------------------------------
WITH mapped AS (
    SELECT 
        gen_random_uuid() AS m_uid,
        psd.tenant_uid,
        mdt.uid AS doc_type_uid,
        'lead' AS entity_type,
        p.lead_uid AS entity_uid,
        psd.original_name,
        psd.file_name,
        psd.file_url,
        psd.mime_type,
        psd.file_size,
        psd.remarks,
        psd.created_by,
        st.uid AS context_uid,
        psd.created_at,
        psd.updated_at
    FROM project_subsidy_documents psd
    JOIN projects p ON psd.project_uid::uuid = p.uid
    LEFT JOIN subsidy_trackers st ON st.project_uid::uuid = p.uid
    LEFT JOIN subsidy_document_types sdt ON psd.document_type_uid = sdt.uid
    LEFT JOIN master_document_types mdt ON sdt.name = mdt.name
    WHERE psd.is_deleted = 0 AND st.uid IS NOT NULL
),
inserted_docs AS (
    INSERT INTO master_documents (
        uid, tenant_uid, document_type_uid, entity_type, entity_uid,
        original_name, file_name, file_url, mime_type, file_size,
        remarks, created_by, created_at, updated_at
    )
    SELECT 
        m_uid, tenant_uid, COALESCE(doc_type_uid, (SELECT uid FROM master_document_types WHERE name = 'Subsidy Portal Screenshot' LIMIT 1)),
        entity_type, entity_uid, original_name, file_name, file_url, mime_type, file_size,
        remarks, created_by, created_at, updated_at
    FROM mapped
)
INSERT INTO document_associations (
    uid, tenant_uid, master_document_uid, module, context_uid, created_by, created_at, updated_at
)
SELECT 
    gen_random_uuid(), tenant_uid, m_uid, 'subsidy_tracker', context_uid, created_by, created_at, updated_at
FROM mapped;

-- ------------------------------------------------------------------------------
-- 5. Drop Old Tables
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS site_survey_documents CASCADE;
DROP TABLE IF EXISTS survey_document_types CASCADE;

DROP TABLE IF EXISTS product_documents CASCADE;
DROP TABLE IF EXISTS product_document_types CASCADE;

DROP TABLE IF EXISTS franchise_documents CASCADE;
DROP TABLE IF EXISTS franchise_document_types CASCADE;

DROP TABLE IF EXISTS project_subsidy_documents CASCADE;
DROP TABLE IF EXISTS subsidy_required_documents CASCADE;
DROP TABLE IF EXISTS subsidy_document_types CASCADE;

DROP TABLE IF EXISTS project_installation_milestone_documents CASCADE;




ALTER TABLE master_document_types 
ADD COLUMN IF NOT EXISTS is_common_for_all_modules SMALLINT DEFAULT 0;

COMMENT ON COLUMN master_document_types.is_common_for_all_modules IS '0 = No, 1 = Yes. If 1, this document type is common across all applicable modules.';




WITH new_docs AS (
    SELECT * FROM (VALUES 
        ('Electricity Bill', 2, 'Latest electricity bill from DISCOM', 'pdf,jpg,jpeg,png', 1, 1, '{"site_survey","discom"}', 1, 1),
        ('Aadhaar Card', 1, 'Government issued Aadhaar identity card', 'pdf,jpg,jpeg,png', 0, 1, '{"site_survey","project","subsidy_tracker","finance","discom"}', 2, 1),
        ('PAN Card', 1, 'Permanent Account Number card', 'pdf,jpg,jpeg,png', 0, 1, '{"site_survey","project","finance","discom"}', 3, 1),
        ('Site Photo', 5, 'Photos of the installation site', 'jpg,jpeg,png,webp', 1, 1, '{"site_survey"}', 4, 1),
        ('Layout Drawing', 4, 'Layout Drawing of the site', 'pdf,dwg,dxf,jpg,png', 1, 0, '{"site_survey","project"}', 5, 1),
        ('Datasheet', 4, 'Technical specification datasheet for the product', 'pdf,doc,docx', 0, 1, '{"product"}', 6, 1),
        ('Warranty Certificate', 4, 'Warranty terms and guidelines', 'pdf,jpg,jpeg,png', 0, 0, '{"product"}', 7, 1),
        ('Installation Manual', 4, 'Guide for installing and configuring the product', 'pdf', 0, 0, '{"product"}', 8, 1),
        ('GST Certificate', 3, 'GST registration certificate', 'pdf,jpg,jpeg,png', 0, 1, '{"finance"}', 9, 1),
        ('Bank Cancelled Cheque', 3, 'Cancelled cheque for bank verification', 'pdf,jpg,jpeg,png', 0, 1, '{"finance"}', 10, 1),
        ('Partnership Deed / COI', 3, 'Company/firm registration certificate or Partnership Deed', 'pdf,jpg,jpeg,png', 0, 0, '{"finance"}', 11, 1)
    ) AS v(name, category, description, allowed_extensions, allow_multiple, is_required, applicable_modules, sort_order, is_common_for_all_modules)
),
updated AS (
    UPDATE master_document_types m
    SET 
        category = n.category,
        description = n.description,
        allowed_extensions = n.allowed_extensions,
        allow_multiple = n.allow_multiple,
        is_required = n.is_required,
        applicable_modules = n.applicable_modules::text[],
        sort_order = n.sort_order,
        is_common_for_all_modules = n.is_common_for_all_modules,
        is_deleted = 0,
        is_active = 1
    FROM new_docs n
    WHERE m.name = n.name AND m.is_system = 1 AND m.tenant_uid IS NULL
    RETURNING m.name
)
INSERT INTO master_document_types (
    uid, tenant_uid, name, category, description, 
    allowed_extensions, allow_multiple, is_required, 
    applicable_modules, sort_order, is_system, is_common_for_all_modules
)
SELECT 
    gen_random_uuid(), NULL, n.name, n.category, n.description, 
    n.allowed_extensions, n.allow_multiple, n.is_required, 
    n.applicable_modules::text[], n.sort_order, 1, n.is_common_for_all_modules
FROM new_docs n
WHERE n.name NOT IN (SELECT name FROM updated);

-- Soft delete system documents that are no longer part of this strict list
UPDATE master_document_types
SET is_deleted = 1, is_active = 0
WHERE is_system = 1 
  AND tenant_uid IS NULL
  AND name NOT IN (
    'Electricity Bill', 'Aadhaar Card', 'PAN Card', 'Site Photo', 
    'Layout Drawing', 'Datasheet', 'Warranty Certificate', 
    'Installation Manual', 'GST Certificate', 'Bank Cancelled Cheque', 
    'Partnership Deed / COI'
  );



-- ============================================================
-- Payments Module
-- ============================================================
CREATE TABLE payments (
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

CREATE INDEX idx_payments_tenant_uid ON payments(tenant_uid);
CREATE INDEX idx_payments_lead_uid ON payments(lead_uid);

COMMENT ON TABLE payments IS 'Stores payment records against a Lead';

-- Seed Payments Menus
INSERT INTO menus (uid, name, code, route, icon, sort_order, parent_uid, is_active, created_at, updated_at)
VALUES 
  ('32345678-0000-0000-0000-000000000001', 'Payments', 'PAYMENTS', '/payments', 'credit-card', 11, NULL, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Seed Payments Features
INSERT INTO features (uid, menu_uid, name, code, is_active, created_at, updated_at)
VALUES 
  ('32345678-0000-0000-0000-000000000002', '32345678-0000-0000-0000-000000000001', 'Export', 'payment_export', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('32345678-0000-0000-0000-000000000003', '32345678-0000-0000-0000-000000000001', 'Change Status', 'payment_change_status', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('32345678-0000-0000-0000-000000000004', '32345678-0000-0000-0000-000000000001', 'Delete', 'payment_delete', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;
