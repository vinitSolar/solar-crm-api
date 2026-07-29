import type { Pool, PoolClient } from "pg";
import { v4 as uuidv4 } from "uuid";
import type { IProductSpecification, IProductSpecificationOption, IProductCategorySpecification } from "../interfaces/product-specification.interface.js";

export class ProductSpecificationRepository {
    private readonly pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    private mapRowToSpec(row: any): IProductSpecification {
        return {
            id: row.id,
            uid: row.uid,
            title: row.title,
            valueType: row.value_type,
            unitUid: row.unit_uid,
            isActive: row.is_active,
            isDeleted: row.is_deleted,
            deletedAt: row.deleted_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            createdBy: row.created_by,
            updatedBy: row.updated_by,
            deletedBy: row.deleted_by,
            unitName: row.unit_name,
            unitShortName: row.unit_short_name,
            
            // joined fields
            mappingUid: row.mapping_uid,
            sortOrder: row.sort_order,
            isRequired: row.is_required,
        };
    }

    private mapRowToOption(row: any): IProductSpecificationOption {
        return {
            id: row.id,
            uid: row.uid,
            specificationUid: row.specification_uid,
            value: row.value,
            sortOrder: row.sort_order,
            isActive: row.is_active,
            isDeleted: row.is_deleted,
            deletedAt: row.deleted_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            createdBy: row.created_by,
            updatedBy: row.updated_by,
            deletedBy: row.deleted_by,
        };
    }
    
    private mapRowToMapping(row: any): IProductCategorySpecification {
        return {
            id: row.id,
            uid: row.uid,
            categoryUid: row.category_uid,
            specificationUid: row.specification_uid,
            sortOrder: row.sort_order,
            isRequired: row.is_required,
            isActive: row.is_active,
            isDeleted: row.is_deleted,
            deletedAt: row.deleted_at,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            createdBy: row.created_by,
            updatedBy: row.updated_by,
            deletedBy: row.deleted_by,
        }
    }

    async create(data: {
        uid: string;
        title: string;
        valueType: number;
        unitUid?: string | null;
        createdBy: string;
    }, client?: PoolClient): Promise<IProductSpecification> {
        const dbClient = client || await this.pool.connect();
        
        try {
            const result = await dbClient.query(
                `INSERT INTO product_specifications (uid, title, value_type, unit_uid, created_by)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING *`,
                [data.uid, data.title, data.valueType, data.unitUid || null, data.createdBy]
            );
            return this.mapRowToSpec(result.rows[0]);
        } finally {
            if (!client) (dbClient as any).release();
        }
    }

    async createOption(data: {
        uid: string;
        specificationUid: string;
        value: string;
        sortOrder?: number;
        createdBy: string;
    }, client?: PoolClient): Promise<IProductSpecificationOption> {
        const dbClient = client || await this.pool.connect();
        try {
            const result = await dbClient.query(
                `INSERT INTO product_specification_options (uid, specification_uid, value, sort_order, created_by)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING *`,
                [data.uid, data.specificationUid, data.value, data.sortOrder || 0, data.createdBy]
            );
            return this.mapRowToOption(result.rows[0]);
        } finally {
            if (!client) (dbClient as any).release();
        }
    }

    async mapToCategory(data: {
        uid: string;
        categoryUid: string;
        specificationUid: string;
        sortOrder?: number | undefined;
        isRequired?: number | undefined;
        createdBy: string;
    }, client?: PoolClient): Promise<IProductCategorySpecification> {
        const dbClient = client || await this.pool.connect();
        try {
            let sortOrder = data.sortOrder;
            if (sortOrder === undefined || sortOrder === null) {
                const maxRes = await dbClient.query(
                    `SELECT COALESCE(MAX(sort_order), 0) AS max_sort FROM product_category_specifications WHERE category_uid = $1 AND is_deleted = 0`,
                    [data.categoryUid]
                );
                sortOrder = Number(maxRes.rows[0]?.max_sort || 0) + 1;
            }

            const result = await dbClient.query(
                `INSERT INTO product_category_specifications (uid, category_uid, specification_uid, sort_order, is_required, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING *`,
                [data.uid, data.categoryUid, data.specificationUid, sortOrder, data.isRequired || 0, data.createdBy]
            );
            return this.mapRowToMapping(result.rows[0]);
        } finally {
            if (!client) (dbClient as any).release();
        }
    }

    async updateMapping(categoryUid: string, specificationUid: string, data: {
        sortOrder?: number;
        isRequired?: number;
        isActive?: number;
        updatedBy: string;
    }, client?: PoolClient): Promise<IProductCategorySpecification | null> {
        const fields: string[] = [];
        const values: any[] = [];
        let index = 1;

        if (data.sortOrder !== undefined) {
            fields.push(`sort_order = $${index++}`);
            values.push(data.sortOrder);
        }
        if (data.isRequired !== undefined) {
            fields.push(`is_required = $${index++}`);
            values.push(data.isRequired);
        }
        if (data.isActive !== undefined) {
            fields.push(`is_active = $${index++}`);
            values.push(data.isActive);
        }

        if (fields.length === 0) {
            return this.findMapping(categoryUid, specificationUid, client);
        }

        fields.push(`updated_by = $${index++}`);
        values.push(data.updatedBy);

        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        
        values.push(categoryUid);
        const catIdx = index++;
        values.push(specificationUid);
        const specIdx = index++;

        const dbClient = client || await this.pool.connect();
        try {
            const result = await dbClient.query(
                `UPDATE product_category_specifications
                 SET ${fields.join(", ")}
                 WHERE category_uid = $${catIdx} AND specification_uid = $${specIdx}
                 RETURNING *`,
                values
            );
            return result.rows[0] ? this.mapRowToMapping(result.rows[0]) : null;
        } finally {
            if (!client) (dbClient as any).release();
        }
    }

    async findMapping(categoryUid: string, specificationUid: string, client?: PoolClient): Promise<IProductCategorySpecification | null> {
        const query = `
            SELECT * FROM product_category_specifications 
            WHERE category_uid = $1 AND specification_uid = $2 AND is_deleted = 0
        `;
        const dbClient = client || await this.pool.connect();
        try {
            const result = await dbClient.query(query, [categoryUid, specificationUid]);
            return result.rows[0] ? this.mapRowToMapping(result.rows[0]) : null;
        } finally {
            if (!client) (dbClient as any).release();
        }
    }

    async getMappingsByCategory(categoryUid: string, client?: PoolClient): Promise<IProductCategorySpecification[]> {
        const query = `
            SELECT * FROM product_category_specifications 
            WHERE category_uid = $1 AND is_deleted = 0
        `;
        const dbClient = client || await this.pool.connect();
        try {
            const result = await dbClient.query(query, [categoryUid]);
            return result.rows.map(row => this.mapRowToMapping(row));
        } finally {
            if (!client) (dbClient as any).release();
        }
    }

    async softDeleteMapping(categoryUid: string, specificationUid: string, deletedBy: string, client?: PoolClient): Promise<void> {
        const dbClient = client || await this.pool.connect();
        try {
            await dbClient.query(
                `UPDATE product_category_specifications 
                 SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP, deleted_by = $1 
                 WHERE category_uid = $2 AND specification_uid = $3 AND is_deleted = 0`,
                [deletedBy, categoryUid, specificationUid]
            );
        } finally {
            if (!client) (dbClient as any).release();
        }
    }

    async update(uid: string, data: {
        title?: string | undefined;
        valueType?: number | undefined;
        unitUid?: string | null | undefined;
        isActive?: number | undefined;
        updatedBy: string;
    }, client?: PoolClient): Promise<IProductSpecification | null> {
        const fields: string[] = [];
        const values: any[] = [];
        let index = 1;

        if (data.title !== undefined) {
            fields.push(`title = $${index++}`);
            values.push(data.title);
        }
        if (data.valueType !== undefined) {
            fields.push(`value_type = $${index++}`);
            values.push(data.valueType);
        }
        if (data.unitUid !== undefined) {
            fields.push(`unit_uid = $${index++}`);
            values.push(data.unitUid);
        }
        if (data.isActive !== undefined) {
            fields.push(`is_active = $${index++}`);
            values.push(data.isActive);
        }

        if (fields.length === 0) {
            return this.findByUid(uid, client);
        }

        fields.push(`updated_by = $${index++}`);
        values.push(data.updatedBy);

        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(uid);

        const dbClient = client || await this.pool.connect();
        try {
            const result = await dbClient.query(
                `UPDATE product_specifications
                 SET ${fields.join(", ")}
                 WHERE uid = $${index}
                 RETURNING *`,
                values
            );
            return result.rows[0] ? this.mapRowToSpec(result.rows[0]) : null;
        } finally {
            if (!client) (dbClient as any).release();
        }
    }

    async softDeleteOptionsBySpecification(specificationUid: string, deletedBy: string, client?: PoolClient): Promise<void> {
        const dbClient = client || await this.pool.connect();
        try {
            await dbClient.query(
                `UPDATE product_specification_options 
                 SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP, deleted_by = $1 
                 WHERE specification_uid = $2 AND is_deleted = 0`,
                [deletedBy, specificationUid]
            );
        } finally {
            if (!client) (dbClient as any).release();
        }
    }

    async findByUid(uid: string, client?: PoolClient): Promise<IProductSpecification | null> {
        const query = `
            SELECT s.*, u.name as unit_name, u.short_name as unit_short_name
            FROM product_specifications s
            LEFT JOIN product_units u ON s.unit_uid = u.uid
            WHERE s.uid = $1
        `;
        const dbClient = client || await this.pool.connect();
        try {
            const result = await dbClient.query(query, [uid]);
            return result.rows[0] ? this.mapRowToSpec(result.rows[0]) : null;
        } finally {
            if (!client) (dbClient as any).release();
        }
    }

    async findByTitle(title: string, client?: PoolClient): Promise<IProductSpecification | null> {
        const query = `
            SELECT s.*, u.name as unit_name, u.short_name as unit_short_name
            FROM product_specifications s
            LEFT JOIN product_units u ON s.unit_uid = u.uid
            WHERE s.title = $1 AND s.is_deleted = 0
        `;
        const dbClient = client || await this.pool.connect();
        try {
            const result = await dbClient.query(query, [title]);
            return result.rows[0] ? this.mapRowToSpec(result.rows[0]) : null;
        } finally {
            if (!client) (dbClient as any).release();
        }
    }

    async countMappingsForSpecification(specificationUid: string, client?: PoolClient): Promise<number> {
        const query = `SELECT COUNT(*) FROM product_category_specifications WHERE specification_uid = $1 AND is_deleted = 0`;
        const dbClient = client || await this.pool.connect();
        try {
            const result = await dbClient.query(query, [specificationUid]);
            return parseInt(result.rows[0].count, 10);
        } finally {
            if (!client) (dbClient as any).release();
        }
    }

    async findOptionsBySpecification(specificationUid: string, client?: PoolClient): Promise<IProductSpecificationOption[]> {
        const query = `
            SELECT * FROM product_specification_options
            WHERE specification_uid = $1 AND is_deleted = 0
            ORDER BY sort_order ASC, created_at ASC
        `;
        const dbClient = client || await this.pool.connect();
        try {
            const result = await dbClient.query(query, [specificationUid]);
            return result.rows.map(row => this.mapRowToOption(row));
        } finally {
            if (!client) (dbClient as any).release();
        }
    }

    async findPaginated(page: number, limit: number, search?: string, categoryUid?: string, status: "active" | "deleted" | "all" = "active"): Promise<{ specifications: IProductSpecification[]; total: number }> {
        const offset = (page - 1) * limit;
        const values: any[] = [];
        const conditions: string[] = [];
        let index = 1;

        if (status === "active") {
            conditions.push(`s.is_deleted = 0`);
            if (categoryUid) conditions.push(`(m.is_deleted = 0 OR m.is_deleted IS NULL)`);
        } else if (status === "deleted") {
            conditions.push(`s.is_deleted = 1`);
        }

        if (search) {
            conditions.push(`s.title ILIKE $${index}`);
            values.push(`%${search}%`);
            index++;
        }

        if (categoryUid) {
            conditions.push(`m.category_uid = $${index}`);
            values.push(categoryUid);
            index++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

        // Determine FROM clause based on category mapping
        const fromClause = categoryUid 
            ? `FROM product_category_specifications m 
               JOIN product_specifications s ON m.specification_uid = s.uid
               LEFT JOIN product_units u ON s.unit_uid = u.uid`
            : `FROM product_specifications s
               LEFT JOIN product_units u ON s.unit_uid = u.uid`;
               
        const selectClause = categoryUid
            ? `SELECT s.*, u.name as unit_name, u.short_name as unit_short_name, 
               m.uid as mapping_uid, m.sort_order, m.is_required`
            : `SELECT s.*, u.name as unit_name, u.short_name as unit_short_name`;

        const countQuery = `SELECT COUNT(*) ${fromClause} ${whereClause}`;
        const countResult = await this.pool.query(countQuery, values);
        const total = parseInt(countResult.rows[0].count, 10);

        values.push(limit);
        const limitIndex = index++;
        values.push(offset);
        const offsetIndex = index++;
        
        const orderClause = categoryUid 
            ? `ORDER BY m.sort_order ASC, s.created_at DESC`
            : `ORDER BY s.title ASC`;

        const query = `
            ${selectClause}
            ${fromClause}
            ${whereClause} 
            ${orderClause}
            LIMIT $${limitIndex} OFFSET $${offsetIndex}
        `;

        const result = await this.pool.query(query, values);
        return { specifications: result.rows.map(row => this.mapRowToSpec(row)), total };
    }

    async softDelete(uid: string, deletedBy: string): Promise<IProductSpecification | null> {
        const result = await this.pool.query(
            `UPDATE product_specifications SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP, deleted_by = $1 WHERE uid = $2 RETURNING *`,
            [deletedBy, uid]
        );
        return result.rows[0] ? this.mapRowToSpec(result.rows[0]) : null;
    }
}
