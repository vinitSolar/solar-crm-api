import type { Pool, PoolClient } from "pg";
import pool from "@packages/connection.js";
import { v4 as uuidv4 } from "uuid";
import type { 
    IQuotation, 
    IQuotationItem, 
    IQuotationScopeOfWorkItem, 
    IQuotationTermsConditionsItem 
} from "../interfaces/quotation.interface.js";

export class QuotationRepository {
    private readonly pool: Pool;

    constructor() {
        this.pool = pool;
    }

    async getPoolClient(): Promise<PoolClient> {
        return await this.pool.connect();
    }

    async getLastQuotationNumberForDate(client: PoolClient, dateStr: string): Promise<string | null> {
        const query = `
            SELECT quotation_number 
            FROM quotations 
            WHERE quotation_number LIKE $1 
            ORDER BY quotation_number DESC 
            LIMIT 1 
            FOR UPDATE
        `;
        const result = await client.query(query, [`QT-${dateStr}%`]);
        return result.rows.length > 0 ? result.rows[0].quotation_number : null;
    }

    async create(client: PoolClient, tenantUid: string, data: {
        leadUid: string;
        quotationNumber: string;
        systemSize: number;
        validTill: string;
        status?: number;
        notes?: string | null;
    }, createdBy: string): Promise<IQuotation> {
        const uid = uuidv4();
        const query = `
            INSERT INTO quotations 
            (uid, tenant_uid, lead_uid, quotation_number, system_size, valid_till, status, notes, created_by, updated_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `;
        const values = [
            uid,
            tenantUid,
            data.leadUid,
            data.quotationNumber,
            data.systemSize,
            data.validTill,
            data.status ?? 0,
            data.notes ?? null,
            createdBy,
            createdBy
        ];
        const result = await client.query(query, values);
        return this.mapQuotationToCamelCase(result.rows[0]);
    }

    async createItem(client: PoolClient, quotationUid: string, data: {
        productUid: string;
        productName: string;
        brandName: string;
        unitName: string;
        quantity: number;
        pricePerUnit: number;
        gstPercentage: number;
        lineTotal: number;
        description?: string | null;
    }, createdBy: string): Promise<IQuotationItem> {
        const uid = uuidv4();
        const query = `
            INSERT INTO quotation_items 
            (uid, quotation_uid, product_uid, product_name, brand_name, unit_name, quantity, price_per_unit, gst_percentage, line_total, description, created_by, updated_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *
        `;
        const values = [
            uid,
            quotationUid,
            data.productUid,
            data.productName,
            data.brandName,
            data.unitName,
            data.quantity,
            data.pricePerUnit,
            data.gstPercentage,
            data.lineTotal,
            data.description ?? null,
            createdBy,
            createdBy
        ];
        const result = await client.query(query, values);
        return this.mapItemToCamelCase(result.rows[0]);
    }

    async createScopeOfWorkItem(client: PoolClient, quotationUid: string, data: {
        title: string;
        value: string;
        sortOrder: number;
    }, createdBy: string): Promise<IQuotationScopeOfWorkItem> {
        const uid = uuidv4();
        const query = `
            INSERT INTO quotation_scope_of_work_items 
            (uid, quotation_uid, title, value, sort_order, created_by, updated_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        const values = [
            uid,
            quotationUid,
            data.title,
            data.value,
            data.sortOrder,
            createdBy,
            createdBy
        ];
        const result = await client.query(query, values);
        return this.mapScopeOfWorkToCamelCase(result.rows[0]);
    }

    async createTermsConditionsItem(client: PoolClient, quotationUid: string, data: {
        title: string;
        description: string;
        sortOrder: number;
    }, createdBy: string): Promise<IQuotationTermsConditionsItem> {
        const uid = uuidv4();
        const query = `
            INSERT INTO quotation_terms_conditions_items 
            (uid, quotation_uid, title, description, sort_order, created_by, updated_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        const values = [
            uid,
            quotationUid,
            data.title,
            data.description,
            data.sortOrder,
            createdBy,
            createdBy
        ];
        const result = await client.query(query, values);
        return this.mapTermsConditionsToCamelCase(result.rows[0]);
    }

    async findByUid(tenantUid: string, uid: string): Promise<IQuotation | null> {
        const query = `
            SELECT * FROM quotations 
            WHERE tenant_uid = $1 AND uid = $2 AND is_deleted = 0
        `;
        const result = await this.pool.query(query, [tenantUid, uid]);
        return result.rows.length > 0 ? this.mapQuotationToCamelCase(result.rows[0]) : null;
    }

    async findItemsByQuotationUid(quotationUid: string): Promise<IQuotationItem[]> {
        const query = `
            SELECT * FROM quotation_items 
            WHERE quotation_uid = $1 AND is_deleted = 0 
            ORDER BY created_at ASC
        `;
        const result = await this.pool.query(query, [quotationUid]);
        return result.rows.map(row => this.mapItemToCamelCase(row));
    }

    async findScopeOfWorkByQuotationUid(quotationUid: string): Promise<IQuotationScopeOfWorkItem[]> {
        const query = `
            SELECT * FROM quotation_scope_of_work_items 
            WHERE quotation_uid = $1 AND is_deleted = 0 
            ORDER BY sort_order ASC, created_at ASC
        `;
        const result = await this.pool.query(query, [quotationUid]);
        return result.rows.map(row => this.mapScopeOfWorkToCamelCase(row));
    }

    async findTermsConditionsByQuotationUid(quotationUid: string): Promise<IQuotationTermsConditionsItem[]> {
        const query = `
            SELECT * FROM quotation_terms_conditions_items 
            WHERE quotation_uid = $1 AND is_deleted = 0 
            ORDER BY sort_order ASC, created_at ASC
        `;
        const result = await this.pool.query(query, [quotationUid]);
        return result.rows.map(row => this.mapTermsConditionsToCamelCase(row));
    }

    async update(client: PoolClient, tenantUid: string, uid: string, data: {
        leadUid?: string;
        systemSize?: number;
        validTill?: string;
        status?: number;
        notes?: string | null;
    }, updatedBy: string): Promise<IQuotation | null> {
        const setClauses: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        const addField = (field: string, value: any) => {
            if (value !== undefined) {
                setClauses.push(`${field} = $${paramIndex}`);
                values.push(value);
                paramIndex++;
            }
        };

        addField("lead_uid", data.leadUid);
        addField("system_size", data.systemSize);
        addField("valid_till", data.validTill);
        addField("status", data.status);
        addField("notes", data.notes);

        if (setClauses.length === 0) {
            const current = await client.query(`SELECT * FROM quotations WHERE tenant_uid = $1 AND uid = $2 AND is_deleted = 0`, [tenantUid, uid]);
            return current.rows.length > 0 ? this.mapQuotationToCamelCase(current.rows[0]) : null;
        }

        setClauses.push(`updated_by = $${paramIndex}`);
        values.push(updatedBy);
        paramIndex++;

        setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

        const query = `
            UPDATE quotations 
            SET ${setClauses.join(", ")} 
            WHERE tenant_uid = $${paramIndex} AND uid = $${paramIndex + 1} AND is_deleted = 0 
            RETURNING *
        `;
        values.push(tenantUid, uid);

        const result = await client.query(query, values);
        return result.rows.length > 0 ? this.mapQuotationToCamelCase(result.rows[0]) : null;
    }

    async deleteItemsByQuotationUid(client: PoolClient, quotationUid: string): Promise<void> {
        await client.query(`DELETE FROM quotation_items WHERE quotation_uid = $1`, [quotationUid]);
    }

    async deleteScopeOfWorkItemsByQuotationUid(client: PoolClient, quotationUid: string): Promise<void> {
        await client.query(`DELETE FROM quotation_scope_of_work_items WHERE quotation_uid = $1`, [quotationUid]);
    }

    async deleteTermsConditionsItemsByQuotationUid(client: PoolClient, quotationUid: string): Promise<void> {
        await client.query(`DELETE FROM quotation_terms_conditions_items WHERE quotation_uid = $1`, [quotationUid]);
    }

    async softDelete(tenantUid: string, uid: string, deletedBy: string): Promise<boolean> {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");

            // Soft delete parent quotation
            const parentResult = await client.query(`
                UPDATE quotations 
                SET is_deleted = 1, deleted_by = $1, deleted_at = CURRENT_TIMESTAMP, is_active = 0 
                WHERE tenant_uid = $2 AND uid = $3 AND is_deleted = 0 
                RETURNING uid
            `, [deletedBy, tenantUid, uid]);

            if (parentResult.rows.length === 0) {
                await client.query("ROLLBACK");
                return false;
            }

            // Soft delete related snapshots
            await client.query(`UPDATE quotation_items SET is_deleted = 1, deleted_by = $1, deleted_at = CURRENT_TIMESTAMP, is_active = 0 WHERE quotation_uid = $2`, [deletedBy, uid]);
            await client.query(`UPDATE quotation_scope_of_work_items SET is_deleted = 1, deleted_by = $1, deleted_at = CURRENT_TIMESTAMP, is_active = 0 WHERE quotation_uid = $2`, [deletedBy, uid]);
            await client.query(`UPDATE quotation_terms_conditions_items SET is_deleted = 1, deleted_by = $1, deleted_at = CURRENT_TIMESTAMP, is_active = 0 WHERE quotation_uid = $2`, [deletedBy, uid]);

            await client.query("COMMIT");
            return true;
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    async restore(tenantUid: string, uid: string, updatedBy: string): Promise<boolean> {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");

            const parentResult = await client.query(`
                UPDATE quotations 
                SET is_deleted = 0, deleted_by = NULL, deleted_at = NULL, is_active = 1, updated_by = $1, updated_at = CURRENT_TIMESTAMP 
                WHERE tenant_uid = $2 AND uid = $3 AND is_deleted = 1 
                RETURNING uid
            `, [updatedBy, tenantUid, uid]);

            if (parentResult.rows.length === 0) {
                await client.query("ROLLBACK");
                return false;
            }

            // Restore related snapshots
            await client.query(`UPDATE quotation_items SET is_deleted = 0, deleted_by = NULL, deleted_at = NULL, is_active = 1, updated_by = $1, updated_at = CURRENT_TIMESTAMP WHERE quotation_uid = $2`, [updatedBy, uid]);
            await client.query(`UPDATE quotation_scope_of_work_items SET is_deleted = 0, deleted_by = NULL, deleted_at = NULL, is_active = 1, updated_by = $1, updated_at = CURRENT_TIMESTAMP WHERE quotation_uid = $2`, [updatedBy, uid]);
            await client.query(`UPDATE quotation_terms_conditions_items SET is_deleted = 0, deleted_by = NULL, deleted_at = NULL, is_active = 1, updated_by = $1, updated_at = CURRENT_TIMESTAMP WHERE quotation_uid = $2`, [updatedBy, uid]);

            await client.query("COMMIT");
            return true;
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    async list(
        tenantUid: string,
        page: number,
        limit: number,
        search?: string,
        status: "active" | "deleted" | "all" = "active"
    ): Promise<{ data: IQuotation[]; total: number }> {
        const offset = (page - 1) * limit;
        const values: any[] = [tenantUid];
        let paramIndex = 2;

        let whereClause = "WHERE tenant_uid = $1";

        if (status !== "all") {
            whereClause += ` AND is_deleted = ${status === "deleted" ? 1 : 0}`;
            if (status === "active") {
                whereClause += ` AND is_active = 1`;
            }
        }

        if (search) {
            whereClause += ` AND (LOWER(quotation_number) LIKE $${paramIndex} OR LOWER(notes) LIKE $${paramIndex})`;
            values.push(`%${search.toLowerCase()}%`);
            paramIndex++;
        }

        const countQuery = `SELECT COUNT(*) as total FROM quotations ${whereClause}`;
        const dataQuery = `
            SELECT * FROM quotations 
            ${whereClause} 
            ORDER BY created_at DESC 
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        const [countResult, dataResult] = await Promise.all([
            this.pool.query(countQuery, values.slice(0, paramIndex - 1)),
            this.pool.query(dataQuery, [...values, limit, offset]),
        ]);

        return {
            data: dataResult.rows.map(row => this.mapQuotationToCamelCase(row)),
            total: parseInt(countResult.rows[0]?.total || "0", 10),
        };
    }

    async findAllActive(tenantUid: string): Promise<IQuotation[]> {
        const query = `
            SELECT * FROM quotations 
            WHERE tenant_uid = $1 AND is_deleted = 0 AND is_active = 1 
            ORDER BY created_at DESC
        `;
        const result = await this.pool.query(query, [tenantUid]);
        return result.rows.map(row => this.mapQuotationToCamelCase(row));
    }

    // Joint query to resolve catalog product details with brand & unit names
    async getCatalogProductDetails(productUid: string): Promise<{
        productUid: string;
        name: string;
        brandName: string;
        unitName: string;
        pricePerUnit: number;
        gstPercentage: number;
    } | null> {
        const query = `
            SELECT 
                p.uid AS "productUid",
                p.name AS "name",
                pb.name AS "brandName",
                pu.name AS "unitName",
                p.price_per_unit AS "pricePerUnit",
                p.gst_percentage AS "gstPercentage"
            FROM products p
            LEFT JOIN product_brands pb ON p.brand_uid = pb.uid
            LEFT JOIN product_units pu ON p.unit_uid = pu.uid
            WHERE p.uid = $1 AND p.is_deleted = 0
        `;
        const result = await this.pool.query(query, [productUid]);
        if (result.rows.length === 0) return null;
        const row = result.rows[0];
        return {
            productUid: row.productUid,
            name: row.name,
            brandName: row.brandName || "Generic",
            unitName: row.unitName || "Units",
            pricePerUnit: Number(row.pricePerUnit),
            gstPercentage: Number(row.gstPercentage)
        };
    }

    // Lead exist check helper
    async leadExists(tenantUid: string, leadUid: string): Promise<boolean> {
        const query = `SELECT 1 FROM leads WHERE tenant_uid = $1 AND uid = $2 AND is_deleted = 0`;
        const result = await this.pool.query(query, [tenantUid, leadUid]);
        return result.rows.length > 0;
    }

    async updatePdfInfo(uid: string, pdfUrl: string, pdfPath: string, updatedBy: string): Promise<void> {
        const query = `
            UPDATE quotations
            SET pdf_url = $1, pdf_path = $2, updated_by = $3, updated_at = CURRENT_TIMESTAMP
            WHERE uid = $4
        `;
        await this.pool.query(query, [pdfUrl, pdfPath, updatedBy, uid]);
    }

    async getFranchiseDetails(tenantUid: string): Promise<{
        code: string;
        name: string;
        logo: string | null;
        email: string | null;
        mobile: string | null;
        address: string | null;
        city: string | null;
        state: string | null;
        pinCode: string | null;
    } | null> {
        const query = `
            SELECT 
                t.code,
                t.name AS tenant_name,
                t.logo,
                t.email,
                t.mobile,
                fb.business_name,
                fb.business_address,
                fb.city,
                fb.state,
                fb.pin_code
            FROM tenants t
            LEFT JOIN franchise_business_details fb ON t.uid = fb.tenant_uid AND fb.is_deleted = 0
            WHERE t.uid = $1 AND t.is_deleted = 0
            LIMIT 1
        `;
        const result = await this.pool.query(query, [tenantUid]);
        if (result.rows.length === 0) return null;
        const row = result.rows[0];
        return {
            code: row.code,
            name: row.business_name || row.tenant_name,
            logo: row.logo || null,
            email: row.email || null,
            mobile: row.mobile || null,
            address: row.business_address || null,
            city: row.city || null,
            state: row.state || null,
            pinCode: row.pin_code || null
        };
    }

    async getLeadDetails(tenantUid: string, leadUid: string): Promise<{
        firstName: string;
        lastName: string | null;
        mobileNumber: string;
        address: string | null;
        city: string | null;
        state: string | null;
        pinCode: string | null;
        systemSize: number | null;
    } | null> {
        const query = `
            SELECT first_name, last_name, mobile_number, address, city, state, pin_code, system_size
            FROM leads
            WHERE tenant_uid = $1 AND uid = $2 AND is_deleted = 0
            LIMIT 1
        `;
        const result = await this.pool.query(query, [tenantUid, leadUid]);
        if (result.rows.length === 0) return null;
        const row = result.rows[0];
        return {
            firstName: row.first_name,
            lastName: row.last_name,
            mobileNumber: row.mobile_number,
            address: row.address,
            city: row.city,
            state: row.state,
            pinCode: row.pin_code,
            systemSize: row.system_size ? Number(row.system_size) : null
        };
    }

    async getStateSubsidyRule(state: string): Promise<{
        subsidyPerKw: number;
        maximumSubsidyAmount: number;
    } | null> {
        const query = `
            SELECT subsidy_per_kw, maximum_subsidy_amount
            FROM state_subsidy_rules
            WHERE LOWER(state) = LOWER($1) AND is_active = 1 AND is_deleted = 0
            LIMIT 1
        `;
        const result = await this.pool.query(query, [state]);
        if (result.rows.length === 0) return null;
        return {
            subsidyPerKw: Number(result.rows[0].subsidy_per_kw),
            maximumSubsidyAmount: Number(result.rows[0].maximum_subsidy_amount)
        };
    }

    private mapQuotationToCamelCase(row: any): IQuotation {
        return {
            id: row.id,
            uid: row.uid,
            tenantUid: row.tenant_uid,
            leadUid: row.lead_uid,
            quotationNumber: row.quotation_number,
            systemSize: Number(row.system_size),
            validTill: row.valid_till,
            status: row.status,
            notes: row.notes,
            pdfUrl: row.pdf_url || null,
            pdfPath: row.pdf_path || null,
            isActive: row.is_active,
            isDeleted: row.is_deleted,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            deletedAt: row.deleted_at,
            createdBy: row.created_by,
            updatedBy: row.updated_by,
            deletedBy: row.deleted_by
        };
    }

    private mapItemToCamelCase(row: any): IQuotationItem {
        return {
            id: row.id,
            uid: row.uid,
            quotationUid: row.quotation_uid,
            productUid: row.product_uid,
            productName: row.product_name,
            brandName: row.brand_name,
            unitName: row.unit_name,
            quantity: Number(row.quantity),
            pricePerUnit: Number(row.price_per_unit),
            gstPercentage: Number(row.gst_percentage),
            lineTotal: Number(row.line_total),
            description: row.description,
            isActive: row.is_active,
            isDeleted: row.is_deleted,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            deletedAt: row.deleted_at,
            createdBy: row.created_by,
            updatedBy: row.updated_by,
            deletedBy: row.deleted_by
        };
    }

    private mapScopeOfWorkToCamelCase(row: any): IQuotationScopeOfWorkItem {
        return {
            id: row.id,
            uid: row.uid,
            quotationUid: row.quotation_uid,
            title: row.title,
            value: row.value,
            sortOrder: row.sort_order,
            isActive: row.is_active,
            isDeleted: row.is_deleted,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            deletedAt: row.deleted_at,
            createdBy: row.created_by,
            updatedBy: row.updated_by,
            deletedBy: row.deleted_by
        };
    }

    private mapTermsConditionsToCamelCase(row: any): IQuotationTermsConditionsItem {
        return {
            id: row.id,
            uid: row.uid,
            quotationUid: row.quotation_uid,
            title: row.title,
            description: row.description,
            sortOrder: row.sort_order,
            isActive: row.is_active,
            isDeleted: row.is_deleted,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            deletedAt: row.deleted_at,
            createdBy: row.created_by,
            updatedBy: row.updated_by,
            deletedBy: row.deleted_by
        };
    }
}
