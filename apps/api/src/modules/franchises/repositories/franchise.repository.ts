import type { Pool, PoolClient } from "pg";
import type {
    ITenant,
    IFranchiseOwnerDetails,
    IFranchiseBusinessDetails,
    IUpdateFranchiseRequest,
    IFranchiseDocument,
} from "../interfaces/franchise.interface.js";
import { v4 as uuidv4 } from "uuid";
import { TENANT_TYPE, ONBOARDING_STATUS, FRANCHISE_STATUS } from "../constants/franchise.constants.js";
import { logger } from "@packages/logger/index.js";

/**
 * Common SELECT columns for the tenants table with alias mapping.
 */
const TENANT_COLUMNS = `
    id, uid, code, name, type, email, mobile, logo, timezone,
    onboarding_status AS "onboardingStatus",
    is_active AS "isActive", is_deleted AS "isDeleted",
    created_at AS "createdAt", updated_at AS "updatedAt",
    created_by AS "createdBy", updated_by AS "updatedBy",
    deleted_by AS "deletedBy"
`;

/**
 * Common SELECT columns for the franchise_owner_details table.
 */
const OWNER_COLUMNS = `
    id, uid,
    tenant_uid AS "tenantUid",
    full_name AS "fullName",
    date_of_birth AS "dateOfBirth",
    profile_photo AS "profilePhoto",
    mobile_number AS "mobileNumber",
    alternate_number AS "alternateNumber",
    email,
    residential_address AS "residentialAddress",
    is_active AS "isActive", is_deleted AS "isDeleted",
    created_at AS "createdAt", updated_at AS "updatedAt",
    created_by AS "createdBy", updated_by AS "updatedBy",
    deleted_by AS "deletedBy"
`;

/**
 * Common SELECT columns for the franchise_business_details table.
 */
const BUSINESS_COLUMNS = `
    id, uid,
    tenant_uid AS "tenantUid",
    business_name AS "businessName",
    gst_number AS "gstNumber",
    pan_number AS "panNumber",
    cin_number AS "cinNumber",
    msme_registration_number AS "msmeRegistrationNumber",
    trade_license_number AS "tradeLicenseNumber",
    business_address AS "businessAddress",
    city, state,
    pin_code AS "pinCode",
    outlet_name AS "outletName",
    is_active AS "isActive", is_deleted AS "isDeleted",
    created_at AS "createdAt", updated_at AS "updatedAt",
    created_by AS "createdBy", updated_by AS "updatedBy",
    deleted_by AS "deletedBy"
`;

/**
 * Common SELECT columns for the franchise_documents table.
 */
const DOCUMENT_COLUMNS = `
    id, uid,
    tenant_uid AS "tenantUid",
    document_type_uid AS "documentTypeUid",
    document_number AS "documentNumber",
    original_file_name AS "originalFileName",
    stored_file_name AS "storedFileName",
    file_path AS "filePath",
    mime_type AS "mimeType",
    file_size AS "fileSize",
    is_active AS "isActive", is_deleted AS "isDeleted",
    created_at AS "createdAt", updated_at AS "updatedAt",
    created_by AS "createdBy", updated_by AS "updatedBy",
    deleted_by AS "deletedBy"
`;

/**
 * Franchise Repository.
 *
 * Responsible for all database operations related to franchises.
 * Contains ONLY SQL queries — no business logic.
 * Transaction-aware methods accept a PoolClient parameter.
 */
export class FranchiseRepository {
    private readonly pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    // ─── Create Operations ──────────────────────────────────────────

    /**
     * Creates a new tenant record with type = FRANCHISE.
     */
    async createTenant(
        client: PoolClient,
        data: { name: string; code: string; email?: string; mobile?: string; logo?: string },
        createdBy: string,
    ): Promise<ITenant> {
        const uid = uuidv4();
        const result = await client.query(
            `INSERT INTO tenants (uid, code, name, type, email, mobile, logo, is_active, onboarding_status, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING ${TENANT_COLUMNS}`,
            [uid, data.code, data.name, TENANT_TYPE.FRANCHISE, data.email ?? null, data.mobile ?? null, data.logo ?? null, FRANCHISE_STATUS.ACTIVE, ONBOARDING_STATUS.PENDING, createdBy],
        );
        return result.rows[0] as ITenant;
    }

    /**
     * Creates a franchise owner details record.
     */
    async createOwnerDetails(
        client: PoolClient,
        tenantUid: string,
        data: { fullName: string; dateOfBirth?: string; profilePhoto?: string; mobileNumber: string; alternateNumber?: string; email?: string; residentialAddress?: string },
        createdBy: string,
    ): Promise<IFranchiseOwnerDetails> {
        const uid = uuidv4();
        const result = await client.query(
            `INSERT INTO franchise_owner_details
                (uid, tenant_uid, full_name, date_of_birth, profile_photo, mobile_number, alternate_number, email, residential_address, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING ${OWNER_COLUMNS}`,
            [uid, tenantUid, data.fullName, data.dateOfBirth ?? null, data.profilePhoto ?? null, data.mobileNumber, data.alternateNumber ?? null, data.email ?? null, data.residentialAddress ?? null, createdBy],
        );
        return result.rows[0] as IFranchiseOwnerDetails;
    }

    /**
     * Creates a franchise business details record.
     */
    async createBusinessDetails(
        client: PoolClient,
        tenantUid: string,
        data: { businessName: string; gstNumber: string; panNumber: string; cinNumber?: string; msmeRegistrationNumber?: string; tradeLicenseNumber?: string; businessAddress?: string; city?: string; state?: string; pinCode?: string; outletName?: string },
        createdBy: string,
    ): Promise<IFranchiseBusinessDetails> {
        const uid = uuidv4();
        const result = await client.query(
            `INSERT INTO franchise_business_details
                (uid, tenant_uid, business_name, gst_number, pan_number, cin_number, msme_registration_number, trade_license_number, business_address, city, state, pin_code, outlet_name, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
             RETURNING ${BUSINESS_COLUMNS}`,
            [uid, tenantUid, data.businessName, data.gstNumber, data.panNumber, data.cinNumber ?? null, data.msmeRegistrationNumber ?? null, data.tradeLicenseNumber ?? null, data.businessAddress ?? null, data.city ?? null, data.state ?? null, data.pinCode ?? null, data.outletName ?? null, createdBy],
        );
        return result.rows[0] as IFranchiseBusinessDetails;
    }

    // ─── Read Operations ────────────────────────────────────────────

    /**
     * Finds a tenant by its unique code.
     */
    async findTenantByCode(code: string): Promise<ITenant | null> {
        const result = await this.pool.query(
            `SELECT ${TENANT_COLUMNS} FROM tenants WHERE code = $1`,
            [code],
        );
        return result.rows.length > 0 ? (result.rows[0] as ITenant) : null;
    }

    /**
     * Gets a franchise (tenant with type=1) by UID.
     */
    async getFranchiseByUid(uid: string): Promise<ITenant | null> {
        logger.debug("FranchiseRepository.getFranchiseByUid", { uid });
        const result = await this.pool.query(
            `SELECT ${TENANT_COLUMNS} FROM tenants WHERE uid = $1 AND type = $2`,
            [uid, TENANT_TYPE.FRANCHISE],
        );
        return result.rows.length > 0 ? (result.rows[0] as ITenant) : null;
    }

    /**
     * Checks if a tenant is a Head Office (type=0).
     */
    async isHeadOffice(uid: string): Promise<boolean> {
        logger.debug("FranchiseRepository.isHeadOffice", { uid });
        const result = await this.pool.query(
            `SELECT 1 FROM tenants WHERE uid = $1 AND type = $2 AND is_deleted = 0`,
            [uid, TENANT_TYPE.HEAD_OFFICE],
        );
        return result.rows.length > 0;
    }

    /**
     * Gets owner details by franchise UID.
     */
    async getOwnerDetailsByTenantUid(tenantUid: string): Promise<IFranchiseOwnerDetails | null> {
        const result = await this.pool.query(
            `SELECT ${OWNER_COLUMNS} FROM franchise_owner_details WHERE tenant_uid = $1 AND is_deleted = 0`,
            [tenantUid],
        );
        return result.rows.length > 0 ? (result.rows[0] as IFranchiseOwnerDetails) : null;
    }

    /**
     * Gets business details by franchise UID.
     */
    async getBusinessDetailsByTenantUid(tenantUid: string): Promise<IFranchiseBusinessDetails | null> {
        const result = await this.pool.query(
            `SELECT ${BUSINESS_COLUMNS} FROM franchise_business_details WHERE tenant_uid = $1 AND is_deleted = 0`,
            [tenantUid],
        );
        return result.rows.length > 0 ? (result.rows[0] as IFranchiseBusinessDetails) : null;
    }

    /**
     * Gets paginated franchises (tenants with type=1).
     */
    async getPaginatedFranchises(
        page: number,
        limit: number,
        search?: string,
        status: "active" | "deleted" | "all" = "active",
    ): Promise<{ rows: ITenant[]; total: number }> {
        logger.debug("FranchiseRepository.getPaginatedFranchises", { page, limit, search, status });

        const params: any[] = [TENANT_TYPE.FRANCHISE];
        let whereClause = "type = $1";

        if (status === "active") {
            whereClause += " AND is_deleted = 0";
        } else if (status === "deleted") {
            whereClause += " AND is_deleted = 1";
        }

        if (search) {
            params.push(`%${search}%`);
            whereClause += ` AND (name ILIKE $${params.length} OR code ILIKE $${params.length} OR email ILIKE $${params.length})`;
        }

        const countResult = await this.pool.query(
            `SELECT COUNT(*) FROM tenants WHERE ${whereClause}`,
            params,
        );
        const total = parseInt(countResult.rows[0].count, 10);

        const offset = (page - 1) * limit;
        params.push(limit, offset);

        const result = await this.pool.query(
            `SELECT ${TENANT_COLUMNS},
                (SELECT COUNT(*)::int FROM franchise_service_areas fsa WHERE fsa.tenant_uid = tenants.uid AND fsa.is_deleted = 0) AS "totalAssignedCities"
             FROM tenants
             WHERE ${whereClause}
             ORDER BY created_at DESC
             LIMIT $${params.length - 1} OFFSET $${params.length}`,
            params,
        );

        return { rows: result.rows as ITenant[], total };
    }

    /**
     * Gets all franchises (tenants with type=1) without pagination.
     */
    async getAllFranchises(status: "active" | "deleted" | "all" = "active"): Promise<ITenant[]> {
        logger.debug("FranchiseRepository.getAllFranchises", { status });

        let whereClause = "type = $1";

        if (status === "active") {
            whereClause += " AND is_deleted = 0";
        } else if (status === "deleted") {
            whereClause += " AND is_deleted = 1";
        }

        const result = await this.pool.query(
            `SELECT ${TENANT_COLUMNS} FROM tenants WHERE ${whereClause} ORDER BY created_at DESC`,
            [TENANT_TYPE.FRANCHISE],
        );

        return result.rows as ITenant[];
    }

    // ─── Update Operations ──────────────────────────────────────────

    /**
     * Updates the tenant fields for a franchise.
     */
    async updateTenant(
        client: PoolClient,
        uid: string,
        data: { name?: string; email?: string; mobile?: string; logo?: string },
        updatedBy: string,
    ): Promise<ITenant | null> {
        const updates: string[] = [];
        const values: any[] = [];
        let index = 1;

        if (data.name !== undefined) { updates.push(`name = $${index++}`); values.push(data.name); }
        if (data.email !== undefined) { updates.push(`email = $${index++}`); values.push(data.email); }
        if (data.mobile !== undefined) { updates.push(`mobile = $${index++}`); values.push(data.mobile); }
        if (data.logo !== undefined) { updates.push(`logo = $${index++}`); values.push(data.logo); }

        if (updates.length === 0) return this.getFranchiseByUid(uid);

        updates.push(`updated_by = $${index++}`);
        values.push(updatedBy);
        updates.push(`updated_at = CURRENT_TIMESTAMP`);

        values.push(uid, TENANT_TYPE.FRANCHISE);

        const result = await client.query(
            `UPDATE tenants SET ${updates.join(", ")}
             WHERE uid = $${index++} AND type = $${index} AND is_deleted = 0
             RETURNING ${TENANT_COLUMNS}`,
            values,
        );

        return result.rows.length > 0 ? (result.rows[0] as ITenant) : null;
    }

    /**
     * Updates franchise owner details.
     */
    async updateOwnerDetails(
        client: PoolClient,
        tenantUid: string,
        data: { fullName?: string; dateOfBirth?: string; profilePhoto?: string; mobileNumber?: string; alternateNumber?: string; email?: string; residentialAddress?: string },
        updatedBy: string,
    ): Promise<IFranchiseOwnerDetails | null> {
        const updates: string[] = [];
        const values: any[] = [];
        let index = 1;

        if (data.fullName !== undefined) { updates.push(`full_name = $${index++}`); values.push(data.fullName); }
        if (data.dateOfBirth !== undefined) { updates.push(`date_of_birth = $${index++}`); values.push(data.dateOfBirth); }
        if (data.profilePhoto !== undefined) { updates.push(`profile_photo = $${index++}`); values.push(data.profilePhoto); }
        if (data.mobileNumber !== undefined) { updates.push(`mobile_number = $${index++}`); values.push(data.mobileNumber); }
        if (data.alternateNumber !== undefined) { updates.push(`alternate_number = $${index++}`); values.push(data.alternateNumber); }
        if (data.email !== undefined) { updates.push(`email = $${index++}`); values.push(data.email); }
        if (data.residentialAddress !== undefined) { updates.push(`residential_address = $${index++}`); values.push(data.residentialAddress); }

        if (updates.length === 0) return this.getOwnerDetailsByTenantUid(tenantUid);

        updates.push(`updated_by = $${index++}`);
        values.push(updatedBy);
        updates.push(`updated_at = CURRENT_TIMESTAMP`);

        values.push(tenantUid);

        const result = await client.query(
            `UPDATE franchise_owner_details SET ${updates.join(", ")}
             WHERE tenant_uid = $${index} AND is_deleted = 0
             RETURNING ${OWNER_COLUMNS}`,
            values,
        );

        return result.rows.length > 0 ? (result.rows[0] as IFranchiseOwnerDetails) : null;
    }

    /**
     * Updates franchise business details.
     */
    async updateBusinessDetails(
        client: PoolClient,
        tenantUid: string,
        data: { businessName?: string; gstNumber?: string; panNumber?: string; cinNumber?: string; msmeRegistrationNumber?: string; tradeLicenseNumber?: string; businessAddress?: string; city?: string; state?: string; pinCode?: string; outletName?: string },
        updatedBy: string,
    ): Promise<IFranchiseBusinessDetails | null> {
        const updates: string[] = [];
        const values: any[] = [];
        let index = 1;

        if (data.businessName !== undefined) { updates.push(`business_name = $${index++}`); values.push(data.businessName); }
        if (data.gstNumber !== undefined) { updates.push(`gst_number = $${index++}`); values.push(data.gstNumber); }
        if (data.panNumber !== undefined) { updates.push(`pan_number = $${index++}`); values.push(data.panNumber); }
        if (data.cinNumber !== undefined) { updates.push(`cin_number = $${index++}`); values.push(data.cinNumber); }
        if (data.msmeRegistrationNumber !== undefined) { updates.push(`msme_registration_number = $${index++}`); values.push(data.msmeRegistrationNumber); }
        if (data.tradeLicenseNumber !== undefined) { updates.push(`trade_license_number = $${index++}`); values.push(data.tradeLicenseNumber); }
        if (data.businessAddress !== undefined) { updates.push(`business_address = $${index++}`); values.push(data.businessAddress); }
        if (data.city !== undefined) { updates.push(`city = $${index++}`); values.push(data.city); }
        if (data.state !== undefined) { updates.push(`state = $${index++}`); values.push(data.state); }
        if (data.pinCode !== undefined) { updates.push(`pin_code = $${index++}`); values.push(data.pinCode); }
        if (data.outletName !== undefined) { updates.push(`outlet_name = $${index++}`); values.push(data.outletName); }

        if (updates.length === 0) return this.getBusinessDetailsByTenantUid(tenantUid);

        updates.push(`updated_by = $${index++}`);
        values.push(updatedBy);
        updates.push(`updated_at = CURRENT_TIMESTAMP`);

        values.push(tenantUid);

        const result = await client.query(
            `UPDATE franchise_business_details SET ${updates.join(", ")}
             WHERE tenant_uid = $${index} AND is_deleted = 0
             RETURNING ${BUSINESS_COLUMNS}`,
            values,
        );

        return result.rows.length > 0 ? (result.rows[0] as IFranchiseBusinessDetails) : null;
    }

    // ─── Delete / Restore ───────────────────────────────────────────

    /**
     * Soft deletes a franchise (tenant) and its related details.
     */
    async softDeleteFranchise(client: PoolClient, uid: string, deletedBy: string): Promise<boolean> {
        logger.debug("FranchiseRepository.softDeleteFranchise", { uid });

        const tenantResult = await client.query(
            `UPDATE tenants SET is_deleted = 1, deleted_by = $1, updated_at = CURRENT_TIMESTAMP
             WHERE uid = $2 AND type = $3 AND is_deleted = 0`,
            [deletedBy, uid, TENANT_TYPE.FRANCHISE],
        );

        await client.query(
            `UPDATE franchise_owner_details SET is_deleted = 1, deleted_by = $1, updated_at = CURRENT_TIMESTAMP
             WHERE tenant_uid = $2 AND is_deleted = 0`,
            [deletedBy, uid],
        );

        await client.query(
            `UPDATE franchise_business_details SET is_deleted = 1, deleted_by = $1, updated_at = CURRENT_TIMESTAMP
             WHERE tenant_uid = $2 AND is_deleted = 0`,
            [deletedBy, uid],
        );

        return (tenantResult.rowCount ?? 0) > 0;
    }

    /**
     * Restores a soft-deleted franchise (tenant) and its related details.
     */
    async restoreFranchise(client: PoolClient, uid: string, updatedBy: string): Promise<boolean> {
        logger.debug("FranchiseRepository.restoreFranchise", { uid });

        const tenantResult = await client.query(
            `UPDATE tenants SET is_deleted = 0, deleted_by = NULL, updated_by = $1, updated_at = CURRENT_TIMESTAMP
             WHERE uid = $2 AND type = $3 AND is_deleted = 1`,
            [updatedBy, uid, TENANT_TYPE.FRANCHISE],
        );

        await client.query(
            `UPDATE franchise_owner_details SET is_deleted = 0, deleted_by = NULL, updated_by = $1, updated_at = CURRENT_TIMESTAMP
             WHERE tenant_uid = $2 AND is_deleted = 1`,
            [updatedBy, uid],
        );

        await client.query(
            `UPDATE franchise_business_details SET is_deleted = 0, deleted_by = NULL, updated_by = $1, updated_at = CURRENT_TIMESTAMP
             WHERE tenant_uid = $2 AND is_deleted = 1`,
            [updatedBy, uid],
        );

        return (tenantResult.rowCount ?? 0) > 0;
    }
    // ─── Document Operations ────────────────────────────────────────

    /**
     * Creates a new franchise document record.
     */
    async createDocument(
        client: PoolClient,
        tenantUid: string,
        documentTypeUid: string,
        data: {
            documentNumber?: string;
            originalFileName: string;
            storedFileName: string;
            filePath: string;
            mimeType: string;
            fileSize: number;
        },
        createdBy: string,
    ): Promise<IFranchiseDocument> {
        const uid = uuidv4();
        const result = await client.query(
            `INSERT INTO franchise_documents (
                uid, tenant_uid, document_type_uid, document_number, 
                original_file_name, stored_file_name, file_path, mime_type, file_size, created_by
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING ${DOCUMENT_COLUMNS}`,
            [
                uid, tenantUid, documentTypeUid, data.documentNumber ?? null,
                data.originalFileName, data.storedFileName, data.filePath, data.mimeType, data.fileSize, createdBy
            ]
        );
        return result.rows[0] as IFranchiseDocument;
    }

    /**
     * Gets all active documents for a franchise, including document type name.
     */
    async getDocumentsByTenantUid(tenantUid: string): Promise<(IFranchiseDocument & { documentTypeName?: string })[]> {
        const result = await this.pool.query(
            `SELECT d.*, 
                    d.tenant_uid AS "tenantUid",
                    d.document_type_uid AS "documentTypeUid",
                    d.document_number AS "documentNumber",
                    d.original_file_name AS "originalFileName",
                    d.stored_file_name AS "storedFileName",
                    d.file_path AS "filePath",
                    d.mime_type AS "mimeType",
                    d.file_size AS "fileSize",
                    d.is_active AS "isActive", d.is_deleted AS "isDeleted",
                    d.created_at AS "createdAt", d.updated_at AS "updatedAt",
                    d.created_by AS "createdBy", d.updated_by AS "updatedBy",
                    d.deleted_by AS "deletedBy",
                    t.name AS "documentTypeName"
             FROM franchise_documents d
             LEFT JOIN franchise_document_types t ON d.document_type_uid = t.uid
             WHERE d.tenant_uid = $1 AND d.is_deleted = 0`,
            [tenantUid]
        );
        return result.rows;
    }

    /**
     * Soft deletes specific documents by their UIDs.
     */
    async softDeleteDocuments(client: PoolClient, tenantUid: string, uids: string[], deletedBy: string): Promise<void> {
        if (!uids.length) return;
        await client.query(
            `UPDATE franchise_documents 
             SET is_deleted = 1, deleted_by = $1, deleted_at = CURRENT_TIMESTAMP, is_active = 0
             WHERE tenant_uid = $2 AND uid = ANY($3) AND is_deleted = 0`,
            [deletedBy, tenantUid, uids]
        );
    }

    /**
     * Gets documents by tenant UID and Document Type UID.
     */
    async getDocumentsByTenantAndType(client: PoolClient, tenantUid: string, documentTypeUid: string): Promise<IFranchiseDocument[]> {
        const result = await client.query(
            `SELECT ${DOCUMENT_COLUMNS} FROM franchise_documents
             WHERE tenant_uid = $1 AND document_type_uid = $2 AND is_deleted = 0`,
            [tenantUid, documentTypeUid]
        );
        return result.rows as IFranchiseDocument[];
    }

    // ─── Service Areas ──────────────────────────────────────────────

    /**
     * Checks if any of the provided city UIDs are already assigned to an active franchise.
     * Optionally excludes a specific tenant UID (useful during updates).
     * Returns an array of city UIDs that are already assigned.
     */
    async checkCityAssignments(client: PoolClient, cityUids: string[], excludeTenantUid?: string): Promise<string[]> {
        if (!cityUids || cityUids.length === 0) return [];

        const params: any[] = [cityUids];
        let query = `SELECT city_uid FROM franchise_service_areas WHERE city_uid = ANY($1) AND is_deleted = 0`;

        if (excludeTenantUid) {
            params.push(excludeTenantUid);
            query += ` AND tenant_uid != $2`;
        }

        const result = await client.query(query, params);
        return result.rows.map(row => row.city_uid);
    }

    /**
     * Inserts multiple service areas for a franchise.
     */
    async insertServiceAreas(client: PoolClient, tenantUid: string, cityUids: string[], createdBy: string): Promise<void> {
        if (!cityUids || cityUids.length === 0) return;

        const values = cityUids.map(cityUid => {
            return `('${uuidv4()}', '${tenantUid}', '${cityUid}', '${createdBy}')`;
        }).join(", ");

        await client.query(
            `INSERT INTO franchise_service_areas (uid, tenant_uid, city_uid, created_by) VALUES ${values}`
        );
    }

    /**
     * Soft deletes specific service areas by city UIDs.
     */
    async softDeleteSpecificServiceAreas(client: PoolClient, tenantUid: string, cityUids: string[], deletedBy: string): Promise<void> {
        if (!cityUids || cityUids.length === 0) return;
        await client.query(
            `UPDATE franchise_service_areas 
             SET is_deleted = 1, deleted_by = $1, is_active = 0, updated_at = CURRENT_TIMESTAMP
             WHERE tenant_uid = $2 AND city_uid = ANY($3) AND is_deleted = 0`,
            [deletedBy, tenantUid, cityUids]
        );
    }

    /**
     * Gets service areas for a specific franchise, including location names.
     */
    async getServiceAreasByTenantUid(tenantUid: string): Promise<any[]> {
        const result = await this.pool.query(
            `SELECT 
                fsa.city_uid AS "cityUid",
                c.name AS "cityName",
                d.name AS "districtName",
                s.name AS "stateName"
             FROM franchise_service_areas fsa
             JOIN cities c ON fsa.city_uid = c.uid
             LEFT JOIN districts d ON c.district_uid = d.uid
             JOIN states s ON c.state_uid = s.uid
             WHERE fsa.tenant_uid = $1 AND fsa.is_deleted = 0`,
            [tenantUid]
        );
        return result.rows;
    }
}
