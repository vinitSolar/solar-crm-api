import type { Pool, PoolClient } from "pg";
import { v4 as uuidv4 } from "uuid";
import type { IPackage, IPackageProduct } from "../interfaces/package.interface.js";
import type { CreatePackageDTO, UpdatePackageDTO, PackageProductDTO } from "../dto/package.dto.js";

export class PackageRepository {
    private readonly pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    private mapRowToPackage(row: any): any {
        return {
            uid: row.uid,
            name: row.name,
            packageCode: row.package_code,
            description: row.description,
            capacityKw: row.capacity_kw ? Number(row.capacity_kw) : null,
            recomendedPrice: Number(row.recomended_price),
            isActive: row.is_active,
            isDeleted: row.is_deleted,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }

    private mapRowToPackageProduct(row: any): any {
        return {
            uid: row.uid,
            productUid: row.product_uid,
            quantity: Number(row.quantity),
            unitPriceSnapshot: Number(row.unit_price_snapshot),
            remarks: row.remarks,
            // Extra joined fields if available
            productName: row.product_name,
            productCode: row.product_code,
            categoryName: row.category_name,
            brandName: row.brand_name,
        };
    }

    async checkNameExists(tenantUid: string, name: string, excludeUid?: string): Promise<boolean> {
        let query = `SELECT 1 FROM packages WHERE tenant_uid = $1 AND name = $2 AND is_deleted = false`;
        const values: any[] = [tenantUid, name];

        if (excludeUid) {
            query += ` AND uid != $3`;
            values.push(excludeUid);
        }

        const result = await this.pool.query(query, values);
        return (result.rowCount ?? 0) > 0;
    }

    async checkCodeExists(tenantUid: string, code: string, excludeUid?: string): Promise<boolean> {
        let query = `SELECT 1 FROM packages WHERE tenant_uid = $1 AND package_code = $2 AND is_deleted = false`;
        const values: any[] = [tenantUid, code];

        if (excludeUid) {
            query += ` AND uid != $3`;
            values.push(excludeUid);
        }

        const result = await this.pool.query(query, values);
        return (result.rowCount ?? 0) > 0;
    }

    async countPackages(tenantUid: string): Promise<number> {
        const query = `SELECT COUNT(*) FROM packages WHERE tenant_uid = $1`;
        const result = await this.pool.query(query, [tenantUid]);
        return parseInt(result.rows[0].count, 10);
    }

    async createPackage(
        tenantUid: string,
        userUid: string,
        data: CreatePackageDTO,
        productsData: { productUid: string, quantity: number, remarks: string | null, unitPriceSnapshot: number }[],
        scopeOfWorkData?: { scopeOfWorkUid?: string, title: string, value: string, sortOrder?: number }[]
    ): Promise<any> {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");

            const packageUid = uuidv4();
            const packageQuery = `
                INSERT INTO packages (
                    uid, tenant_uid, name, package_code, description, capacity_kw, recomended_price, created_by, updated_by
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *
            `;
            const packageValues = [
                packageUid,
                tenantUid,
                data.name,
                data.packageCode,
                data.description || null,
                data.capacityKw || null,
                data.recomendedPrice,
                userUid,
                userUid
            ];

            const result = await client.query(packageQuery, packageValues);
            const createdPackage = this.mapRowToPackage(result.rows[0]);

            const createdProducts = [];
            for (const prod of productsData) {
                const prodUid = uuidv4();
                const prodQuery = `
                    INSERT INTO package_products (
                        uid, package_uid, product_uid, quantity, unit_price_snapshot, remarks, created_by, updated_by
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    RETURNING *
                `;
                const prodValues = [
                    prodUid,
                    packageUid,
                    prod.productUid,
                    prod.quantity,
                    prod.unitPriceSnapshot,
                    prod.remarks || null,
                    userUid,
                    userUid
                ];
                const pResult = await client.query(prodQuery, prodValues);
                createdProducts.push(this.mapRowToPackageProduct(pResult.rows[0]));
            }

            const createdScopeOfWork = [];
            if (scopeOfWorkData && scopeOfWorkData.length > 0) {
                for (const sow of scopeOfWorkData) {
                    const sowUid = uuidv4();
                    const sowQuery = `
                        INSERT INTO package_scope_of_work_items (
                            uid, package_uid, scope_of_work_uid, title, value, sort_order, created_by, updated_by
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                        RETURNING *
                    `;
                    const sowValues = [
                        sowUid,
                        packageUid,
                        sow.scopeOfWorkUid || null,
                        sow.title,
                        sow.value,
                        sow.sortOrder || 0,
                        userUid,
                        userUid
                    ];
                    const sResult = await client.query(sowQuery, sowValues);
                    createdScopeOfWork.push({
                        uid: sResult.rows[0].uid,
                        scopeOfWorkUid: sResult.rows[0].scope_of_work_uid,
                        title: sResult.rows[0].title,
                        value: sResult.rows[0].value,
                        sortOrder: sResult.rows[0].sort_order
                    });
                }
            }

            await client.query("COMMIT");
            createdPackage.products = createdProducts;
            createdPackage.scopeOfWork = createdScopeOfWork;
            return createdPackage;
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    async updatePackage(
        uid: string,
        tenantUid: string,
        userUid: string,
        data: UpdatePackageDTO,
        productsData?: { productUid: string, quantity: number, remarks: string | null, unitPriceSnapshot: number }[],
        scopeOfWorkData?: { scopeOfWorkUid?: string, title: string, value: string, sortOrder?: number }[]
    ): Promise<void> {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");

            const updates: string[] = [];
            const values: any[] = [];
            let i = 1;

            if (data.name !== undefined) { updates.push(`name = $${i++}`); values.push(data.name); }
            if (data.packageCode !== undefined) { updates.push(`package_code = $${i++}`); values.push(data.packageCode); }
            if (data.description !== undefined) { updates.push(`description = $${i++}`); values.push(data.description); }
            if (data.capacityKw !== undefined) { updates.push(`capacity_kw = $${i++}`); values.push(data.capacityKw); }
            if (data.recomendedPrice !== undefined) { updates.push(`recomended_price = $${i++}`); values.push(data.recomendedPrice); }
            if (data.isActive !== undefined) { updates.push(`is_active = $${i++}`); values.push(data.isActive === 1); }

            updates.push(`updated_by = $${i++}`); values.push(userUid);
            updates.push(`updated_at = CURRENT_TIMESTAMP`);

            const query = `UPDATE packages SET ${updates.join(", ")} WHERE uid = $${i++} AND tenant_uid = $${i++}`;
            values.push(uid, tenantUid);

            await client.query(query, values);

            if (productsData && productsData.length > 0) {
                // Soft delete existing products
                await client.query(`UPDATE package_products SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP, deleted_by = $1 WHERE package_uid = $2 AND is_deleted = false`, [userUid, uid]);

                // Insert new products
                for (const prod of productsData) {
                    const prodUid = uuidv4();
                    const prodQuery = `
                        INSERT INTO package_products (
                            uid, package_uid, product_uid, quantity, unit_price_snapshot, remarks, created_by, updated_by
                        )
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    `;
                    const prodValues = [
                        prodUid,
                        uid,
                        prod.productUid,
                        prod.quantity,
                        prod.unitPriceSnapshot,
                        prod.remarks || null,
                        userUid,
                        userUid
                    ];
                    await client.query(prodQuery, prodValues);
                }
            }

            if (scopeOfWorkData && scopeOfWorkData.length > 0) {
                // Soft delete existing scope of work items
                await client.query(`UPDATE package_scope_of_work_items SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP, deleted_by = $1 WHERE package_uid = $2 AND is_deleted = false`, [userUid, uid]);

                // Insert new scope of work items
                for (const sow of scopeOfWorkData) {
                    const sowUid = uuidv4();
                    const sowQuery = `
                        INSERT INTO package_scope_of_work_items (
                            uid, package_uid, scope_of_work_uid, title, value, sort_order, created_by, updated_by
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                        RETURNING *
                    `;
                    const sowValues = [
                        sowUid,
                        uid,
                        sow.scopeOfWorkUid || null,
                        sow.title,
                        sow.value,
                        sow.sortOrder || 0,
                        userUid,
                        userUid
                    ];
                    await client.query(sowQuery, sowValues);
                }
            }

            await client.query("COMMIT");
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    async findByUid(uid: string, tenantUid: string): Promise<any | null> {
        const query = `SELECT * FROM packages WHERE uid = $1 AND tenant_uid = $2`;
        const result = await this.pool.query(query, [uid, tenantUid]);
        
        if (result.rowCount === 0) return null;
        
        const pkg = this.mapRowToPackage(result.rows[0]);
        
        const productsQuery = `
            SELECT 
                pp.*,
                p.name AS product_name, p.product_code,
                c.name AS category_name, b.name AS brand_name
            FROM package_products pp
            JOIN products p ON p.uid = pp.product_uid
            LEFT JOIN product_categories c ON c.uid = p.category_uid
            LEFT JOIN product_brands b ON b.uid = p.brand_uid
            WHERE pp.package_uid = $1 AND pp.is_deleted = false
        `;
        const productsResult = await this.pool.query(productsQuery, [uid]);
        pkg.products = productsResult.rows.map(row => this.mapRowToPackageProduct(row));
        
        const sowResult = await this.pool.query(`
            SELECT uid, scope_of_work_uid, title, value, sort_order 
            FROM package_scope_of_work_items 
            WHERE package_uid = $1 AND is_deleted = false 
            ORDER BY sort_order ASC
        `, [uid]);

        pkg.scopeOfWork = sowResult.rows.map(row => ({
            uid: row.uid,
            scopeOfWorkUid: row.scope_of_work_uid,
            title: row.title,
            value: row.value,
            sortOrder: row.sort_order
        }));
        
        return pkg;
    }

    async findProductsDetails(productUids: string[]): Promise<{uid: string, price_per_unit: number, is_active: boolean, is_deleted: boolean}[]> {
        if (!productUids.length) return [];
        const query = `
            SELECT uid, price_per_unit, is_active, is_deleted
            FROM products 
            WHERE uid = ANY($1::text[])
        `;
        const result = await this.pool.query(query, [productUids]);
        return result.rows.map(row => ({
            uid: row.uid,
            price_per_unit: Number(row.price_per_unit),
            is_active: row.is_active,
            is_deleted: row.is_deleted
        }));
    }

    async list(
        tenantUid: string,
        params: { limit: number; page: number; search?: string; status?: "active" | "deleted" | "all"; capacityKw?: number }
    ): Promise<{ data: any[]; total: number; totalPages: number }> {
        const offset = (params.page - 1) * params.limit;
        const values: any[] = [tenantUid];
        let conditions = ["p.tenant_uid = $1"];
        let count = 2;

        if (params.status === "active") conditions.push(`p.is_deleted = false AND p.is_active = true`);
        else if (params.status === "deleted") conditions.push(`p.is_deleted = true`);

        if (params.search) {
            conditions.push(`(p.name ILIKE $${count} OR p.package_code ILIKE $${count})`);
            values.push(`%${params.search}%`);
            count++;
        }

        if (params.capacityKw) {
            conditions.push(`p.capacity_kw = $${count}`);
            values.push(params.capacityKw);
            count++;
        }

        const whereClause = conditions.join(" AND ");

        const countQuery = `SELECT COUNT(*) FROM packages p WHERE ${whereClause}`;
        const countResult = await this.pool.query(countQuery, values);
        const total = parseInt(countResult.rows[0].count, 10);
        const totalPages = Math.ceil(total / params.limit);

        const dataQuery = `
            SELECT 
                p.*,
                (SELECT COUNT(*) FROM package_products pp WHERE pp.package_uid = p.uid AND pp.is_deleted = false) AS products_count
            FROM packages p 
            WHERE ${whereClause} 
            ORDER BY p.created_at DESC 
            LIMIT $${count} OFFSET $${count + 1}
        `;
        const dataValues = [...values, params.limit, offset];
        const dataResult = await this.pool.query(dataQuery, dataValues);

        const data = dataResult.rows.map(row => {
            const pkg = this.mapRowToPackage(row);
            pkg.productsCount = Number(row.products_count);
            return pkg;
        });

        return { data, total, totalPages };
    }

    async getDropdown(tenantUid: string, status?: "active" | "deleted" | "all"): Promise<any[]> {
        const values: any[] = [tenantUid];
        let conditions = ["tenant_uid = $1"];
        
        if (status === "active" || !status) conditions.push(`is_deleted = false AND is_active = true`);
        else if (status === "deleted") conditions.push(`is_deleted = true`);

        const query = `SELECT uid, name, package_code, capacity_kw, recomended_price FROM packages WHERE ${conditions.join(" AND ")} ORDER BY name ASC`;
        const result = await this.pool.query(query, values);
        
        return result.rows.map(row => ({
            uid: row.uid,
            name: row.name,
            packageCode: row.package_code,
            capacityKw: row.capacity_kw ? Number(row.capacity_kw) : null,
            recomendedPrice: Number(row.recomended_price)
        }));
    }

    async softDelete(uid: string, tenantUid: string, userUid: string): Promise<void> {
        const query = `
            UPDATE packages 
            SET is_deleted = true, deleted_at = CURRENT_TIMESTAMP, deleted_by = $1, is_active = false
            WHERE uid = $2 AND tenant_uid = $3
        `;
        await this.pool.query(query, [userUid, uid, tenantUid]);
    }

    async restore(uid: string, tenantUid: string, userUid: string): Promise<void> {
        const query = `
            UPDATE packages 
            SET is_deleted = false, deleted_at = NULL, deleted_by = NULL, updated_at = CURRENT_TIMESTAMP, updated_by = $1
            WHERE uid = $2 AND tenant_uid = $3
        `;
        await this.pool.query(query, [userUid, uid, tenantUid]);
    }
}
