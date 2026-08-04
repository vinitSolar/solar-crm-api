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
