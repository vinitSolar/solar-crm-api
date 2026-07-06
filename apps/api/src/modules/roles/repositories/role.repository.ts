import type { Pool } from "pg";
import type { IRole, ICreateRoleRequest, IUpdateRoleRequest } from "../interfaces/role.interface.js";
import { logger } from "@packages/logger/index.js";

/**
 * Role Repository
 * Contains ONLY SQL queries. No business logic here.
 */
export class RoleRepository {
    private readonly pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    /**
     * Get paginated roles for a specific tenant
     */
    async getRolesByTenant(tenantUid: string, page: number, limit: number, search?: string, status: "active" | "deleted" | "all" = "active"): Promise<{ rows: IRole[], total: number }> {
        logger.debug("RoleRepository.getRolesByTenant", { tenantUid, page, limit, search, status });

        let query = `
            SELECT id, uid, tenant_uid, name, description, is_system, is_active, is_deleted, created_at, updated_at, created_by, updated_by, deleted_by
            FROM roles
            WHERE tenant_uid = $1
        `;
        let countQuery = `
            SELECT COUNT(*)
            FROM roles
            WHERE tenant_uid = $1
        `;

        if (status === "active") {
            query += " AND is_deleted = 0";
            countQuery += " AND is_deleted = 0";
        } else if (status === "deleted") {
            query += " AND is_deleted = 1";
            countQuery += " AND is_deleted = 1";
        }
        
        const params: any[] = [tenantUid];
        
        if (search) {
            params.push(`%${search}%`);
            query += ` AND (name ILIKE $2 OR description ILIKE $2)`;
            countQuery += ` AND (name ILIKE $2 OR description ILIKE $2)`;
        }

        query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        
        const offset = (page - 1) * limit;
        const queryParams = [...params, limit, offset];

        const [result, countResult] = await Promise.all([
            this.pool.query(query, queryParams),
            this.pool.query(countQuery, params)
        ]);

        return {
            rows: result.rows as IRole[],
            total: parseInt(countResult.rows[0].count, 10)
        };
    }

    /**
     * Get all roles for a specific tenant (no pagination)
     */
    async getAllRolesByTenant(tenantUid: string, status: "active" | "deleted" | "all" = "active"): Promise<IRole[]> {
        logger.debug("RoleRepository.getAllRolesByTenant", { tenantUid, status });

        let query = `
            SELECT id, uid, tenant_uid, name, description, is_system, is_active, is_deleted, created_at, updated_at, created_by, updated_by, deleted_by
            FROM roles
            WHERE tenant_uid = $1
        `;

        if (status === "active") {
            query += " AND is_deleted = 0";
        } else if (status === "deleted") {
            query += " AND is_deleted = 1";
        }

        query += " ORDER BY created_at DESC";

        const result = await this.pool.query(query, [tenantUid]);
        return result.rows as IRole[];
    }

    /**
     * Get a specific role by its UID and tenant UID
     */
    async getRoleByUid(uid: string, tenantUid: string): Promise<IRole | null> {
        logger.debug("RoleRepository.getRoleByUid", { uid, tenantUid });

        const query = `
            SELECT id, uid, tenant_uid, name, description, is_system, is_active, is_deleted, created_at, updated_at, created_by, updated_by, deleted_by
            FROM roles
            WHERE uid = $1 AND tenant_uid = $2 AND is_deleted = 0
        `;

        const result = await this.pool.query(query, [uid, tenantUid]);

        if (result.rows.length === 0) {
            return null;
        }

        return result.rows[0] as IRole;
    }

    /**
     * Get role by name and tenant UID (useful for checking duplicates)
     */
    async getRoleByName(name: string, tenantUid: string): Promise<IRole | null> {
        logger.debug("RoleRepository.getRoleByName", { name, tenantUid });

        const query = `
            SELECT id, uid, tenant_uid, name, description, is_system, is_active, is_deleted, created_at, updated_at, created_by, updated_by, deleted_by
            FROM roles
            WHERE name = $1 AND tenant_uid = $2 AND is_deleted = 0
        `;

        const result = await this.pool.query(query, [name, tenantUid]);

        if (result.rows.length === 0) {
            return null;
        }

        return result.rows[0] as IRole;
    }

    /**
     * Create a new role
     */
    async createRole(uid: string, tenantUid: string, data: ICreateRoleRequest, createdBy: string | null): Promise<IRole> {
        logger.debug("RoleRepository.createRole", { uid, tenantUid, data });

        const query = `
            INSERT INTO roles (uid, tenant_uid, name, description, created_by)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, uid, tenant_uid, name, description, is_system, is_active, is_deleted, created_at, updated_at, created_by, updated_by, deleted_by
        `;

        const result = await this.pool.query(query, [
            uid,
            tenantUid,
            data.name,
            data.description || null,
            createdBy
        ]);

        return result.rows[0] as IRole;
    }

    /**
     * Update an existing role
     */
    async updateRole(uid: string, tenantUid: string, data: IUpdateRoleRequest, updatedBy: string | null): Promise<IRole | null> {
        logger.debug("RoleRepository.updateRole", { uid, tenantUid, data });

        const updates: string[] = [];
        const values: any[] = [];
        let index = 1;

        if (data.name !== undefined) {
            updates.push(`name = $${index++}`);
            values.push(data.name);
        }

        if (data.description !== undefined) {
            updates.push(`description = $${index++}`);
            values.push(data.description);
        }

        if (data.isActive !== undefined) {
            updates.push(`is_active = $${index++}`);
            values.push(data.isActive);
        }

        updates.push(`updated_by = $${index++}`);
        values.push(updatedBy);

        updates.push(`updated_at = CURRENT_TIMESTAMP`);

        const query = `
            UPDATE roles
            SET ${updates.join(", ")}
            WHERE uid = $${index++} AND tenant_uid = $${index++} AND is_deleted = 0
            RETURNING id, uid, tenant_uid, name, description, is_system, is_active, is_deleted, created_at, updated_at, created_by, updated_by, deleted_by
        `;

        values.push(uid, tenantUid);

        const result = await this.pool.query(query, values);

        if (result.rows.length === 0) {
            return null;
        }

        return result.rows[0] as IRole;
    }

    /**
     * Soft delete a role
     */
    async deleteRole(uid: string, tenantUid: string, deletedBy: string | null): Promise<boolean> {
        logger.debug("RoleRepository.deleteRole", { uid, tenantUid });

        const query = `
            UPDATE roles
            SET is_deleted = 1, deleted_by = $1, updated_at = CURRENT_TIMESTAMP
            WHERE uid = $2 AND tenant_uid = $3 AND is_deleted = 0
        `;

        const result = await this.pool.query(query, [deletedBy, uid, tenantUid]);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Restore a soft deleted role
     */
    async restoreRole(uid: string, tenantUid: string, updatedBy: string | null): Promise<boolean> {
        logger.debug("RoleRepository.restoreRole", { uid, tenantUid });

        const query = `
            UPDATE roles
            SET is_deleted = 0, deleted_by = NULL, updated_by = $1, updated_at = CURRENT_TIMESTAMP
            WHERE uid = $2 AND tenant_uid = $3 AND is_deleted = 1
        `;

        const result = await this.pool.query(query, [updatedBy, uid, tenantUid]);
        return (result.rowCount ?? 0) > 0;
    }
}
