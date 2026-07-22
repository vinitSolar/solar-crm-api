import type { Pool, PoolClient } from "pg";
import type { IStateSubsidyRule, IStateSubsidyRuleDropdown } from "../interfaces/state-subsidy-rule.interface.js";
import { v4 as uuidv4 } from "uuid";

export interface IStateSubsidyRuleWithStateName extends IStateSubsidyRule {
    state_name?: string | null;
}

export class StateSubsidyRuleRepository {
    private readonly pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    public async create(
        data: Partial<IStateSubsidyRule> & { scheme_name?: string | null },
        createdBy: string,
        client?: PoolClient
    ): Promise<IStateSubsidyRule> {
        const uid = uuidv4();
        
        const query = `
            INSERT INTO state_subsidy_rules 
            (uid, scheme_name, state_uid, subsidy_per_kw, maximum_subsidy_amount, description, created_by, updated_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;
        
        const values = [
            uid,
            data.scheme_name || null,
            data.state_uid || null,
            data.subsidy_per_kw,
            data.maximum_subsidy_amount,
            data.description || null,
            createdBy,
            createdBy
        ];

        const executor = client || this.pool;
        const result = await executor.query<IStateSubsidyRule>(query, values);
        return result.rows[0] as IStateSubsidyRule;
    }

    public async findByUid(uid: string, client?: PoolClient): Promise<IStateSubsidyRuleWithStateName | null> {
        const query = `
            SELECT ssr.*, s.name as state_name 
            FROM state_subsidy_rules ssr
            LEFT JOIN states s ON s.uid::text = ssr.state_uid
            WHERE ssr.uid = $1
        `;
        const executor = client || this.pool;
        const result = await executor.query<IStateSubsidyRuleWithStateName>(query, [uid]);
        return result.rows[0] || null;
    }

    public async findByStateUid(stateUid: string | null, client?: PoolClient): Promise<IStateSubsidyRule | null> {
        let query;
        const params = [];
        if (stateUid) {
            query = `
                SELECT * FROM state_subsidy_rules 
                WHERE state_uid = $1 AND is_deleted = 0
            `;
            params.push(stateUid);
        } else {
            query = `
                SELECT * FROM state_subsidy_rules 
                WHERE state_uid IS NULL AND is_deleted = 0
            `;
        }
        const executor = client || this.pool;
        const result = await executor.query<IStateSubsidyRule>(query, params);
        return result.rows[0] || null;
    }

    public async findByStateUidOrAll(stateUid: string): Promise<IStateSubsidyRuleWithStateName[]> {
        const query = `
            SELECT ssr.*, s.name as state_name 
            FROM state_subsidy_rules ssr
            LEFT JOIN states s ON s.uid::text = ssr.state_uid
            WHERE (ssr.state_uid = $1 OR ssr.state_uid IS NULL)
              AND ssr.is_active = 1 AND ssr.is_deleted = 0
            ORDER BY ssr.state_uid ASC
        `;
        const result = await this.pool.query<IStateSubsidyRuleWithStateName>(query, [stateUid]);
        return result.rows;
    }

    public async update(
        uid: string,
        data: Partial<IStateSubsidyRule> & { scheme_name?: string | null },
        updatedBy: string,
        client?: PoolClient
    ): Promise<IStateSubsidyRule> {
        const setClause: string[] = [];
        const values: any[] = [];
        let index = 1;

        if (data.scheme_name !== undefined) {
            setClause.push(`scheme_name = $${index++}`);
            values.push(data.scheme_name);
        }
        if (data.state_uid !== undefined) {
            setClause.push(`state_uid = $${index++}`);
            values.push(data.state_uid);
        }
        if (data.subsidy_per_kw !== undefined) {
            setClause.push(`subsidy_per_kw = $${index++}`);
            values.push(data.subsidy_per_kw);
        }
        if (data.maximum_subsidy_amount !== undefined) {
            setClause.push(`maximum_subsidy_amount = $${index++}`);
            values.push(data.maximum_subsidy_amount);
        }
        if (data.description !== undefined) {
            setClause.push(`description = $${index++}`);
            values.push(data.description);
        }
        if (data.is_active !== undefined) {
            setClause.push(`is_active = $${index++}`);
            values.push(data.is_active);
        }

        setClause.push(`updated_by = $${index++}`);
        values.push(updatedBy);

        setClause.push(`updated_at = CURRENT_TIMESTAMP`);

        values.push(uid);

        const query = `
            UPDATE state_subsidy_rules
            SET ${setClause.join(", ")}
            WHERE uid = $${index}
            RETURNING *
        `;

        const executor = client || this.pool;
        const result = await executor.query<IStateSubsidyRule>(query, values);
        return result.rows[0] as IStateSubsidyRule;
    }

    public async getPaginated(
        page: number,
        limit: number,
        search?: string,
        status: "active" | "deleted" | "all" = "active"
    ): Promise<{ data: IStateSubsidyRuleWithStateName[]; total: number }> {
        const offset = (page - 1) * limit;
        const whereClauses: string[] = [];
        const values: any[] = [];
        let index = 1;

        if (status === "active") {
            whereClauses.push(`ssr.is_deleted = 0`);
        } else if (status === "deleted") {
            whereClauses.push(`ssr.is_deleted = 1`);
        }

        if (search) {
            whereClauses.push(`(ssr.scheme_name ILIKE $${index} OR s.name ILIKE $${index} OR ssr.state_uid ILIKE $${index})`);
            values.push(`%${search}%`);
            index++;
        }

        const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

        const countQuery = `
            SELECT COUNT(*) 
            FROM state_subsidy_rules ssr
            LEFT JOIN states s ON s.uid::text = ssr.state_uid
            ${whereString}
        `;

        const dataQuery = `
            SELECT ssr.*, s.name as state_name
            FROM state_subsidy_rules ssr
            LEFT JOIN states s ON s.uid::text = ssr.state_uid
            ${whereString}
            ORDER BY ssr.created_at DESC
            LIMIT $${index} OFFSET $${index + 1}
        `;

        const [countResult, dataResult] = await Promise.all([
            this.pool.query<{ count: string }>(countQuery, values),
            this.pool.query<IStateSubsidyRuleWithStateName>(dataQuery, [...values, limit, offset]),
        ]);

        return {
            data: dataResult.rows,
            total: parseInt(countResult.rows[0]?.count || '0', 10),
        };
    }

    public async getDropdown(): Promise<IStateSubsidyRuleDropdown[]> {
        const query = `
            SELECT uid, scheme_name AS "schemeName", state_uid AS "stateUid" 
            FROM state_subsidy_rules 
            WHERE is_active = 1 AND is_deleted = 0
            ORDER BY scheme_name ASC, state_uid ASC
        `;
        const result = await this.pool.query<IStateSubsidyRuleDropdown>(query);
        return result.rows;
    }

    public async softDelete(uid: string, deletedBy: string, client?: PoolClient): Promise<void> {
        const query = `
            UPDATE state_subsidy_rules 
            SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP, deleted_by = $1, updated_by = $1, updated_at = CURRENT_TIMESTAMP
            WHERE uid = $2
        `;
        const executor = client || this.pool;
        await executor.query(query, [deletedBy, uid]);
    }

    public async restore(uid: string, updatedBy: string, client?: PoolClient): Promise<void> {
        const query = `
            UPDATE state_subsidy_rules 
            SET is_deleted = 0, deleted_at = NULL, deleted_by = NULL, updated_by = $1, updated_at = CURRENT_TIMESTAMP 
            WHERE uid = $2
        `;
        const executor = client || this.pool;
        await executor.query(query, [updatedBy, uid]);
    }
}
