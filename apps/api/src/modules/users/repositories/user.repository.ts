import type { Pool } from "pg";
import type { IUser, ICreateUserRequest, IUpdateUserRequest, IPaginationQuery } from "../interfaces/user.interface.js";
import { v4 as uuidv4 } from "uuid";

export class UserRepository {
    private readonly pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    async getPaginatedUsers(tenantUid: string, query: IPaginationQuery): Promise<{ users: IUser[]; total: number }> {
        const offset = (query.page - 1) * query.limit;
        const params: any[] = [tenantUid];
        
        let whereClause = "u.tenant_uid = $1";

        if (query.status === "active") {
            whereClause += " AND u.is_deleted = 0";
        } else if (query.status === "deleted") {
            whereClause += " AND u.is_deleted = 1";
        }

        if (query.search) {
            params.push(`%${query.search}%`);
            whereClause += ` AND (u.first_name ILIKE $${params.length} OR u.last_name ILIKE $${params.length} OR u.email ILIKE $${params.length})`;
        }

        const countResult = await this.pool.query(`SELECT COUNT(*) FROM users u WHERE ${whereClause}`, params);
        const total = parseInt(countResult.rows[0].count, 10);

        params.push(query.limit, offset);
        
        const result = await this.pool.query(
            `SELECT u.id, u.uid, u.tenant_uid as "tenantUid", u.role_uid as "roleUid", 
                    u.first_name as "firstName", u.last_name as "lastName", u.email, u.password, 
                    u.last_login as "lastLogin", u.is_active as "isActive", u.is_deleted as "isDeleted", 
                    u.created_at as "createdAt", u.updated_at as "updatedAt", u.created_by as "createdBy", 
                    u.updated_by as "updatedBy", u.deleted_by as "deletedBy", r.name as "roleName"
             FROM users u
             LEFT JOIN roles r ON u.role_uid = r.uid
             WHERE ${whereClause}
             ORDER BY u.created_at DESC
             LIMIT $${params.length - 1} OFFSET $${params.length}`,
            params
        );

        return { users: result.rows, total };
    }

    async getAllUsers(tenantUid: string, status?: "active" | "deleted" | "all"): Promise<IUser[]> {
        const params: any[] = [tenantUid];
        let whereClause = "u.tenant_uid = $1";

        if (status === "active" || !status) {
            whereClause += " AND u.is_deleted = 0";
        } else if (status === "deleted") {
            whereClause += " AND u.is_deleted = 1";
        }

        const result = await this.pool.query(
            `SELECT u.id, u.uid, u.tenant_uid as "tenantUid", u.role_uid as "roleUid", 
                    u.first_name as "firstName", u.last_name as "lastName", u.email, u.password, 
                    u.last_login as "lastLogin", u.is_active as "isActive", u.is_deleted as "isDeleted", 
                    u.created_at as "createdAt", u.updated_at as "updatedAt", u.created_by as "createdBy", 
                    u.updated_by as "updatedBy", u.deleted_by as "deletedBy", r.name as "roleName"
             FROM users u
             LEFT JOIN roles r ON u.role_uid = r.uid
             WHERE ${whereClause}
             ORDER BY u.created_at DESC`,
            params
        );

        return result.rows;
    }

    async getUserByUid(uid: string, tenantUid: string): Promise<IUser | null> {
        const result = await this.pool.query(
            `SELECT u.id, u.uid, u.tenant_uid as "tenantUid", u.role_uid as "roleUid", 
                    u.first_name as "firstName", u.last_name as "lastName", u.email, u.password, 
                    u.last_login as "lastLogin", u.is_active as "isActive", u.is_deleted as "isDeleted", 
                    u.created_at as "createdAt", u.updated_at as "updatedAt", u.created_by as "createdBy", 
                    u.updated_by as "updatedBy", u.deleted_by as "deletedBy", r.name as "roleName"
             FROM users u
             LEFT JOIN roles r ON u.role_uid = r.uid
             WHERE u.uid = $1 AND u.tenant_uid = $2`,
            [uid, tenantUid]
        );

        return result.rows.length > 0 ? result.rows[0] : null;
    }

    async getUserByEmail(email: string, tenantUid: string): Promise<IUser | null> {
        const result = await this.pool.query(
            `SELECT id, uid, tenant_uid as "tenantUid", role_uid as "roleUid", 
                    first_name as "firstName", last_name as "lastName", email, password, 
                    last_login as "lastLogin", is_active as "isActive", is_deleted as "isDeleted", 
                    created_at as "createdAt", updated_at as "updatedAt", created_by as "createdBy", 
                    updated_by as "updatedBy", deleted_by as "deletedBy"
             FROM users
             WHERE email = $1 AND tenant_uid = $2 AND is_deleted = 0`,
            [email, tenantUid]
        );

        return result.rows.length > 0 ? result.rows[0] : null;
    }

    async createUser(tenantUid: string, data: ICreateUserRequest, createdBy: string): Promise<IUser> {
        const uid = uuidv4();
        const result = await this.pool.query(
            `INSERT INTO users (uid, tenant_uid, role_uid, first_name, last_name, email, password, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id, uid, tenant_uid as "tenantUid", role_uid as "roleUid", 
                       first_name as "firstName", last_name as "lastName", email, password, 
                       last_login as "lastLogin", is_active as "isActive", is_deleted as "isDeleted", 
                       created_at as "createdAt", updated_at as "updatedAt", created_by as "createdBy", 
                       updated_by as "updatedBy", deleted_by as "deletedBy"`,
            [uid, tenantUid, data.roleUid, data.firstName, data.lastName, data.email, data.password, createdBy]
        );
        return result.rows[0];
    }

    async updateUser(uid: string, tenantUid: string, data: IUpdateUserRequest, updatedBy: string): Promise<IUser | null> {
        const updates: string[] = [];
        const params: any[] = [];
        let paramIndex = 1;

        if (data.roleUid !== undefined) {
            updates.push(`role_uid = $${paramIndex++}`);
            params.push(data.roleUid);
        }
        if (data.firstName !== undefined) {
            updates.push(`first_name = $${paramIndex++}`);
            params.push(data.firstName);
        }
        if (data.lastName !== undefined) {
            updates.push(`last_name = $${paramIndex++}`);
            params.push(data.lastName);
        }
        if (data.email !== undefined) {
            updates.push(`email = $${paramIndex++}`);
            params.push(data.email);
        }
        if (data.password !== undefined) {
            updates.push(`password = $${paramIndex++}`);
            params.push(data.password);
        }
        if (data.isActive !== undefined) {
            updates.push(`is_active = $${paramIndex++}`);
            params.push(data.isActive);
        }

        if (updates.length === 0) return this.getUserByUid(uid, tenantUid);

        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        updates.push(`updated_by = $${paramIndex++}`);
        params.push(updatedBy);

        const updateQuery = `
            UPDATE users 
            SET ${updates.join(", ")}
            WHERE uid = $${paramIndex++} AND tenant_uid = $${paramIndex} AND is_deleted = 0
            RETURNING id, uid, tenant_uid as "tenantUid", role_uid as "roleUid", 
                      first_name as "firstName", last_name as "lastName", email, password, 
                      last_login as "lastLogin", is_active as "isActive", is_deleted as "isDeleted", 
                      created_at as "createdAt", updated_at as "updatedAt", created_by as "createdBy", 
                      updated_by as "updatedBy", deleted_by as "deletedBy"
        `;
        params.push(uid, tenantUid);

        const result = await this.pool.query(updateQuery, params);
        return result.rows.length > 0 ? result.rows[0] : null;
    }

    async softDeleteUser(uid: string, tenantUid: string, deletedBy: string): Promise<boolean> {
        const result = await this.pool.query(
            `UPDATE users
             SET is_deleted = 1, deleted_by = $1
             WHERE uid = $2 AND tenant_uid = $3 AND is_deleted = 0`,
            [deletedBy, uid, tenantUid]
        );
        return (result.rowCount ?? 0) > 0;
    }

    async restoreUser(uid: string, tenantUid: string, updatedBy: string): Promise<boolean> {
        const result = await this.pool.query(
            `UPDATE users
             SET is_deleted = 0, deleted_by = NULL, updated_by = $1, updated_at = CURRENT_TIMESTAMP
             WHERE uid = $2 AND tenant_uid = $3 AND is_deleted = 1`,
            [updatedBy, uid, tenantUid]
        );
        return (result.rowCount ?? 0) > 0;
    }
}
