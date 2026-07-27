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
