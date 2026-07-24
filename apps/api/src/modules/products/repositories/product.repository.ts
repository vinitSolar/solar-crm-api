import type { Pool, PoolClient } from "pg";
import { v4 as uuidv4 } from "uuid";
import type { IProduct } from "../interfaces/product.interface.js";

export class ProductRepository {
    private readonly pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    private mapRowToProduct(row: any): IProduct {
        return {
            ...row,
            categoryUid: row.category_uid,
            brandUid: row.brand_uid,
            unitUid: row.unit_uid,
            productCode: row.product_code,
            pricePerUnit: row.price_per_unit,
            gstPercentage: row.gst_percentage,
            capacityUnit: row.capacity_unit,
            modelNumber: row.model_number,
            images: row.images || [],
            brandName: row.brand_name,
            categoryName: row.category_name,
            unitName: row.unit_name,
            height: row.height,
            width: row.width,
            maxPower: row.max_power,
            palletLength: row.pallet_length,
            palletWidth: row.pallet_width,
            palletHeight: row.pallet_height,
            palletWeight: row.pallet_weight,
            palletDimension: row.pallet_dimension,
            quantityPerPallet: row.quantity_per_pallet !== null && row.quantity_per_pallet !== undefined ? Number(row.quantity_per_pallet) : null,
            cellTechnology: row.cell_technology,
        };
    }

    async create(data: {
        uid: string;
        categoryUid: string;
        brandUid: string;
        unitUid: string;
        name: string;
        productCode: string;
        pricePerUnit: number;
        gstPercentage: number;
        capacity?: string | undefined;
        capacityUnit?: string | undefined;
        warranty?: string | undefined;
        description?: string | undefined;
        modelNumber?: string | undefined;
        images?: string[] | undefined;
        height?: number | null | undefined;
        width?: number | null | undefined;
        maxPower?: number | null | undefined;
        palletLength?: number | null | undefined;
        palletWidth?: number | null | undefined;
        palletHeight?: number | null | undefined;
        palletWeight?: number | null | undefined;
        palletDimension?: string | null | undefined;
        quantityPerPallet?: number | null | undefined;
        cellTechnology?: string | null | undefined;
        createdBy: string;
    }, client?: PoolClient): Promise<IProduct> {
        const dbClient = client || await this.pool.connect();
        try {
            if (!client) await dbClient.query("BEGIN");

            // 1. Insert into products
            const productQuery = `INSERT INTO products (
                uid, category_uid, brand_uid, unit_uid, name, product_code, 
                price_per_unit, gst_percentage, capacity, capacity_unit, 
                warranty, description, model_number, images, created_by
             )
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::varchar, $10::varchar, $11::varchar, $12::text, $13::varchar, $14::text[], $15)
             RETURNING *`;
            const productValues = [
                data.uid, data.categoryUid, data.brandUid, data.unitUid, data.name, data.productCode,
                data.pricePerUnit, data.gstPercentage, data.capacity || null, data.capacityUnit || null,
                data.warranty || null, data.description || null, data.modelNumber || null, data.images || [], data.createdBy
            ];
            await dbClient.query(productQuery, productValues);
            
            // 2. Insert into product_specifications
            const specUid = uuidv4();
            const specQuery = `INSERT INTO product_specifications (
                uid, product_uid, height, width, max_power,
                pallet_length, pallet_width, pallet_height, pallet_weight, 
                pallet_dimension, quantity_per_pallet, cell_technology, created_by
            ) VALUES ($1, $2, $3::numeric, $4::numeric, $5::numeric, $6::numeric, $7::numeric, $8::numeric, $9::numeric, $10::numeric, $11::varchar, $12::integer, $13::varchar, $14)`;
            
            const getVal = (val: any) => val !== undefined ? val : null;
            const specValues = [
                specUid, data.uid,
                getVal(data.height), getVal(data.width), getVal(data.maxPower),
                getVal(data.palletLength), getVal(data.palletWidth), getVal(data.palletHeight), getVal(data.palletWeight),
                getVal(data.palletDimension), getVal(data.quantityPerPallet), getVal(data.cellTechnology),
                data.createdBy
            ];
            await dbClient.query(specQuery, specValues);

            if (!client) await dbClient.query("COMMIT");

            const product = await this.findByUid(data.uid, dbClient);
            return product!;
        } catch (error) {
            if (!client) await dbClient.query("ROLLBACK");
            throw error;
        } finally {
            if (!client) (dbClient as any).release();
        }
    }

    async update(uid: string, data: {
        categoryUid?: string | undefined;
        brandUid?: string | undefined;
        unitUid?: string | undefined;
        name?: string | undefined;
        productCode?: string | undefined;
        pricePerUnit?: number | undefined;
        gstPercentage?: number | undefined;
        capacity?: string | null | undefined;
        capacityUnit?: string | null | undefined;
        warranty?: string | null | undefined;
        description?: string | null | undefined;
        modelNumber?: string | null | undefined;
        images?: string[] | undefined;
        isActive?: number | undefined;
        height?: number | null | undefined;
        width?: number | null | undefined;
        maxPower?: number | null | undefined;
        palletLength?: number | null | undefined;
        palletWidth?: number | null | undefined;
        palletHeight?: number | null | undefined;
        palletWeight?: number | null | undefined;
        palletDimension?: string | null | undefined;
        quantityPerPallet?: number | null | undefined;
        cellTechnology?: string | null | undefined;
        updatedBy: string;
    }, client?: PoolClient): Promise<IProduct | null> {
        const fields: string[] = [];
        const values: any[] = [];
        let index = 1;

        const pushField = (dbField: string, value: any) => {
            fields.push(`${dbField} = $${index++}`);
            values.push(value);
        };

        if (data.categoryUid !== undefined) pushField('category_uid', data.categoryUid);
        if (data.brandUid !== undefined) pushField('brand_uid', data.brandUid);
        if (data.unitUid !== undefined) pushField('unit_uid', data.unitUid);
        if (data.name !== undefined) pushField('name', data.name);
        if (data.productCode !== undefined) pushField('product_code', data.productCode);
        if (data.pricePerUnit !== undefined) pushField('price_per_unit', data.pricePerUnit);
        if (data.gstPercentage !== undefined) pushField('gst_percentage', data.gstPercentage);
        if (data.capacity !== undefined) pushField('capacity', data.capacity);
        if (data.capacityUnit !== undefined) pushField('capacity_unit', data.capacityUnit);
        if (data.warranty !== undefined) pushField('warranty', data.warranty);
        if (data.description !== undefined) pushField('description', data.description);
        if (data.modelNumber !== undefined) pushField('model_number', data.modelNumber);
        if (data.images !== undefined) {
            fields.push(`images = $${index++}::text[]`);
            values.push(data.images);
        }
        if (data.isActive !== undefined) pushField('is_active', data.isActive);

        const specFields: string[] = [];
        const specValues: any[] = [];
        let specIndex = 1;

        const pushSpecField = (dbField: string, value: any) => {
            specFields.push(`${dbField} = $${specIndex++}`);
            specValues.push(value);
        };

        if (data.height !== undefined) pushSpecField('height', data.height);
        if (data.width !== undefined) pushSpecField('width', data.width);

        if (data.maxPower !== undefined) pushSpecField('max_power', data.maxPower);
        if (data.palletLength !== undefined) pushSpecField('pallet_length', data.palletLength);
        if (data.palletWidth !== undefined) pushSpecField('pallet_width', data.palletWidth);
        if (data.palletHeight !== undefined) pushSpecField('pallet_height', data.palletHeight);
        if (data.palletWeight !== undefined) pushSpecField('pallet_weight', data.palletWeight);
        if (data.palletDimension !== undefined) pushSpecField('pallet_dimension', data.palletDimension);
        if (data.quantityPerPallet !== undefined) pushSpecField('quantity_per_pallet', data.quantityPerPallet);
        if (data.cellTechnology !== undefined) pushSpecField('cell_technology', data.cellTechnology);

        if (fields.length === 0 && specFields.length === 0) {
            return this.findByUid(uid, client);
        }

        const dbClient = client || await this.pool.connect();
        try {
            if (!client) await dbClient.query("BEGIN");

            if (fields.length > 0) {
                fields.push(`updated_at = CURRENT_TIMESTAMP`);
                fields.push(`updated_by = $${index++}`);
                values.push(data.updatedBy);

                const query = `UPDATE products
                     SET ${fields.join(", ")}
                     WHERE uid = $${index}`;
                values.push(uid);
                
                await dbClient.query(query, values);
            }

            if (specFields.length > 0) {
                const checkResult = await dbClient.query(`SELECT 1 FROM product_specifications WHERE product_uid = $1`, [uid]);
                if (checkResult.rows.length > 0) {
                    specFields.push(`updated_at = CURRENT_TIMESTAMP`);
                    specFields.push(`updated_by = $${specIndex++}`);
                    specValues.push(data.updatedBy);

                    const specUpdateQuery = `UPDATE product_specifications
                         SET ${specFields.join(", ")}
                         WHERE product_uid = $${specIndex}`;
                    specValues.push(uid);
                    await dbClient.query(specUpdateQuery, specValues);
                } else {
                    const specUid = uuidv4();
                    const getVal = (val: any) => val !== undefined ? val : null;
                    const specQuery = `INSERT INTO product_specifications (
                        uid, product_uid, height, width, max_power,
                        pallet_length, pallet_width, pallet_height, pallet_weight,
                        pallet_dimension, quantity_per_pallet, cell_technology, created_by
                    ) VALUES ($1, $2, $3::numeric, $4::numeric, $5::numeric, $6::numeric, $7::numeric, $8::numeric, $9::numeric, $10::numeric, $11::varchar, $12::integer, $13::varchar, $14)`;
                    const insertSpecValues = [
                        specUid, uid,
                        getVal(data.height), getVal(data.width), getVal(data.maxPower),
                        getVal(data.palletLength), getVal(data.palletWidth), getVal(data.palletHeight), getVal(data.palletWeight),
                        getVal(data.palletDimension), getVal(data.quantityPerPallet), getVal(data.cellTechnology),
                        data.updatedBy
                    ];
                    await dbClient.query(specQuery, insertSpecValues);
                }
            }

            if (!client) await dbClient.query("COMMIT");

            return this.findByUid(uid, dbClient);
        } catch (error) {
            if (!client) await dbClient.query("ROLLBACK");
            throw error;
        } finally {
            if (!client) (dbClient as any).release();
        }
    }

    async findByUid(uid: string, client?: PoolClient): Promise<IProduct | null> {
        const query = `SELECT p.*, b.name as brand_name, c.name as category_name, u.name as unit_name, s.height, s.width, s.max_power, s.pallet_length, s.pallet_width, s.pallet_height, s.pallet_weight, s.pallet_dimension, s.quantity_per_pallet, s.cell_technology 
             FROM products p 
             LEFT JOIN product_brands b ON p.brand_uid = b.uid 
             LEFT JOIN product_categories c ON p.category_uid = c.uid 
             LEFT JOIN product_units u ON p.unit_uid = u.uid 
             LEFT JOIN product_specifications s ON p.uid = s.product_uid 
             WHERE p.uid = $1`;
        const result = client
            ? await client.query(query, [uid])
            : await this.pool.query(query, [uid]);
        if (!result.rows[0]) return null;
        return this.mapRowToProduct(result.rows[0]);
    }

    async findByName(name: string, client?: PoolClient): Promise<IProduct | null> {
        const query = `SELECT p.*, b.name as brand_name, c.name as category_name, u.name as unit_name, s.height, s.width, s.max_power, s.pallet_length, s.pallet_width, s.pallet_height, s.pallet_weight, s.pallet_dimension, s.quantity_per_pallet, s.cell_technology 
             FROM products p 
             LEFT JOIN product_brands b ON p.brand_uid = b.uid 
             LEFT JOIN product_categories c ON p.category_uid = c.uid 
             LEFT JOIN product_units u ON p.unit_uid = u.uid 
             LEFT JOIN product_specifications s ON p.uid = s.product_uid 
             WHERE p.name = $1`;
        const result = client
            ? await client.query(query, [name])
            : await this.pool.query(query, [name]);
        if (!result.rows[0]) return null;
        return this.mapRowToProduct(result.rows[0]);
    }

    async findByCode(code: string, client?: PoolClient): Promise<IProduct | null> {
        const query = `SELECT p.*, b.name as brand_name, c.name as category_name, u.name as unit_name, s.height, s.width, s.max_power, s.pallet_length, s.pallet_width, s.pallet_height, s.pallet_weight, s.pallet_dimension, s.quantity_per_pallet, s.cell_technology 
             FROM products p 
             LEFT JOIN product_brands b ON p.brand_uid = b.uid 
             LEFT JOIN product_categories c ON p.category_uid = c.uid 
             LEFT JOIN product_units u ON p.unit_uid = u.uid 
             LEFT JOIN product_specifications s ON p.uid = s.product_uid 
             WHERE p.product_code = $1`;
        const result = client
            ? await client.query(query, [code])
            : await this.pool.query(query, [code]);
        if (!result.rows[0]) return null;
        return this.mapRowToProduct(result.rows[0]);
    }

    async findAll(status?: "active" | "deleted" | "all"): Promise<IProduct[]> {
        let query = `SELECT p.*, b.name as brand_name, c.name as category_name, u.name as unit_name, s.height, s.width, s.max_power, s.pallet_length, s.pallet_width, s.pallet_height, s.pallet_weight, s.pallet_dimension, s.quantity_per_pallet, s.cell_technology 
             FROM products p 
             LEFT JOIN product_brands b ON p.brand_uid = b.uid 
             LEFT JOIN product_categories c ON p.category_uid = c.uid 
             LEFT JOIN product_units u ON p.unit_uid = u.uid 
             LEFT JOIN product_specifications s ON p.uid = s.product_uid`;
        const conditions: string[] = [];

        if (status === "active") {
            conditions.push(`p.is_deleted = 0`);
        } else if (status === "deleted") {
            conditions.push(`p.is_deleted = 1`);
        }

        if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(" AND ")}`;
        }

        query += ` ORDER BY p.created_at DESC`;

        const result = await this.pool.query(query);
        return result.rows.map(row => this.mapRowToProduct(row));
    }

    async findPaginated(page: number, limit: number, search?: string, categoryUid?: string, brandUid?: string, status: "active" | "deleted" | "all" = "active"): Promise<{ products: IProduct[]; total: number }> {
        const offset = (page - 1) * limit;
        const values: any[] = [];
        const conditions: string[] = [];
        let index = 1;

        if (status === "active") {
            conditions.push(`p.is_deleted = 0`);
        } else if (status === "deleted") {
            conditions.push(`p.is_deleted = 1`);
        }

        if (search) {
            conditions.push(`(p.name ILIKE $${index} OR p.product_code ILIKE $${index})`);
            values.push(`%${search}%`);
            index++;
        }

        if (categoryUid && categoryUid !== "" && categoryUid !== "null" && categoryUid !== "undefined") {
            conditions.push(`p.category_uid = $${index}`);
            values.push(categoryUid);
            index++;
        }

        if (brandUid && brandUid !== "" && brandUid !== "null" && brandUid !== "undefined") {
            conditions.push(`p.brand_uid = $${index}`);
            values.push(brandUid);
            index++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

        const countResult = await this.pool.query(`SELECT COUNT(*) FROM products p ${whereClause}`, values);
        const total = parseInt(countResult.rows[0].count, 10);

        values.push(limit);
        const limitIndex = index++;
        values.push(offset);
        const offsetIndex = index++;

        const result = await this.pool.query(
            `SELECT p.*, b.name as brand_name, c.name as category_name, u.name as unit_name, s.height, s.width, s.max_power, s.pallet_length, s.pallet_width, s.pallet_height, s.pallet_weight, s.pallet_dimension, s.quantity_per_pallet, s.cell_technology 
             FROM products p 
             LEFT JOIN product_brands b ON p.brand_uid = b.uid 
             LEFT JOIN product_categories c ON p.category_uid = c.uid 
             LEFT JOIN product_units u ON p.unit_uid = u.uid 
             LEFT JOIN product_specifications s ON p.uid = s.product_uid
             ${whereClause} 
             ORDER BY p.name ASC, p.created_at DESC 
             LIMIT $${limitIndex} OFFSET $${offsetIndex}`,
            values
        );

        const products = result.rows.map(row => this.mapRowToProduct(row));

        return { products, total };
    }

    async softDelete(uid: string, deletedBy: string, client?: PoolClient): Promise<IProduct | null> {
        const query = `UPDATE products SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP, deleted_by = $1 WHERE uid = $2 RETURNING *`;
        const result = client
            ? await client.query(query, [deletedBy, uid])
            : await this.pool.query(query, [deletedBy, uid]);
        if (!result.rows[0]) return null;
        return this.mapRowToProduct(result.rows[0]);
    }

    async restore(uid: string, updatedBy: string, client?: PoolClient): Promise<IProduct | null> {
        const query = `UPDATE products SET is_deleted = 0, deleted_at = NULL, deleted_by = NULL, updated_at = CURRENT_TIMESTAMP, updated_by = $1 WHERE uid = $2 RETURNING *`;
        const result = client
            ? await client.query(query, [updatedBy, uid])
            : await this.pool.query(query, [updatedBy, uid]);
        if (!result.rows[0]) return null;
        return this.mapRowToProduct(result.rows[0]);
    }
}
