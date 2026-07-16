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
    state_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_district_state FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE CASCADE
);

-- Create subdistricts table
CREATE TABLE IF NOT EXISTS subdistricts (
    id BIGSERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    code INT UNIQUE NOT NULL,
    state_id BIGINT NOT NULL,
    district_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_subdistrict_district FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE CASCADE,
    CONSTRAINT fk_subdistrict_state FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE CASCADE
);

-- Create villages table
CREATE TABLE IF NOT EXISTS villages (
    id BIGSERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    code INT UNIQUE NOT NULL,
    state_id BIGINT NOT NULL,
    district_id BIGINT NOT NULL,
    subdistrict_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    pincode INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_village_subdistrict FOREIGN KEY (subdistrict_id) REFERENCES subdistricts(id) ON DELETE CASCADE,
    CONSTRAINT fk_village_district FOREIGN KEY (district_id) REFERENCES districts(id) ON DELETE CASCADE,
    CONSTRAINT fk_village_state FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE CASCADE
);

-- Create cities table
CREATE TABLE IF NOT EXISTS cities (
    id BIGSERIAL PRIMARY KEY,
    uid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    code INT UNIQUE NOT NULL,
    state_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    local_body_type VARCHAR(100),
    pincode INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_city_state FOREIGN KEY (state_id) REFERENCES states(id) ON DELETE CASCADE
);
