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
