import 'dotenv/config';
import pool from "../packages/connection.js";

async function run() {
    try {
        console.log("Creating payments table...");
        await pool.query(`
            CREATE TABLE IF NOT EXISTS payments (
                id BIGSERIAL,
                uid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
                tenant_uid UUID NOT NULL,
                lead_uid UUID NOT NULL,
                amount NUMERIC(15, 2) NOT NULL,
                payment_method SMALLINT NOT NULL,
                transaction_reference VARCHAR(255),
                payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
                status SMALLINT NOT NULL DEFAULT 0,
                notes TEXT,
                
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
        `);

        console.log("Creating indexes on payments table...");
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_payments_tenant_uid ON payments(tenant_uid);
            CREATE INDEX IF NOT EXISTS idx_payments_lead_uid ON payments(lead_uid);
        `);

        console.log("Inserting Payment menus and features...");
        await pool.query(`
            INSERT INTO menus (uid, name, code, route, icon, sort_order, parent_uid, is_active, created_at, updated_at)
            VALUES 
            ('32345678-0000-0000-0000-000000000001', 'Payments', 'PAYMENTS', '/payments', 'credit-card', 11, NULL, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT DO NOTHING;
            
            INSERT INTO features (uid, menu_uid, name, code, is_active, created_at, updated_at)
            VALUES 
            ('32345678-0000-0000-0000-000000000002', '32345678-0000-0000-0000-000000000001', 'Export', 'payment_export', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            ('32345678-0000-0000-0000-000000000003', '32345678-0000-0000-0000-000000000001', 'Change Status', 'payment_change_status', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            ('32345678-0000-0000-0000-000000000004', '32345678-0000-0000-0000-000000000001', 'Delete', 'payment_delete', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT DO NOTHING;
        `);

        console.log("Success! Payments schema migrated.");
    } catch (e) {
        console.error("Error altering table:", e);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

run();
