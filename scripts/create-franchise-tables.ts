import 'dotenv/config';
import pool from "../packages/connection.js";

async function run() {
    try {
        console.log("Creating franchise document tables if they don't exist...");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS franchise_document_types (
                id BIGSERIAL,
                uid VARCHAR(255) NOT NULL,
              
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
            
            CREATE UNIQUE INDEX IF NOT EXISTS idx_franchise_doc_types_name ON franchise_document_types(name) WHERE is_deleted = 0;
        `);
        console.log("franchise_document_types table created/verified.");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS franchise_documents (
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
            
            CREATE INDEX IF NOT EXISTS idx_franchise_docs_tenant_uid ON franchise_documents(tenant_uid);
            CREATE INDEX IF NOT EXISTS idx_franchise_docs_type_uid ON franchise_documents(document_type_uid);
        `);
        console.log("franchise_documents table created/verified.");
        console.log("Success! Tables created.");
    } catch (e) {
        console.error("Error creating tables:", e);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

run();
