import type { Pool, PoolClient } from "pg";
import type { ISiteSurveyDetails, ISaveSiteSurveyDetails, IUpdateSiteSurveyDetails } from "../interfaces/site-survey-details.interface.js";
import { v4 as uuidv4 } from "uuid";

const SITE_SURVEY_DETAILS_COLUMNS = `
    ssd.id, ssd.uid, ssd.tenant_uid AS "tenantUid", ssd.site_survey_uid AS "siteSurveyUid",
    ssd.roof_area_sqft AS "roofAreaSqft", ssd.shading, ssd.connection_type AS "connectionType",
    ssd.sanctioned_load_kw AS "sanctionedLoadKw", ssd.recommended_kw AS "recommendedKw", 
    ssd.needs_structure_extension AS "needsStructureExtension", ssd.needs_optimizer AS "needsOptimizer",
    ssd.optimizer_count AS "optimizerCount", ssd.notes,
    ssd.is_active AS "isActive", ssd.is_deleted AS "isDeleted", ssd.created_at AS "createdAt",
    ssd.updated_at AS "updatedAt", ssd.created_by AS "createdBy", ssd.updated_by AS "updatedBy",
    ssd.deleted_by AS "deletedBy"
`;

export class SiteSurveyDetailsRepository {
    private readonly pool: Pool;

    constructor(pool: Pool) {
        this.pool = pool;
    }

    async create(
        tenantUid: string,
        siteSurveyUid: string,
        data: ISaveSiteSurveyDetails,
        createdBy: string,
        client?: PoolClient
    ): Promise<ISiteSurveyDetails> {
        const uid = uuidv4();
        const query = `
            INSERT INTO site_survey_details (
                uid, tenant_uid, site_survey_uid, roof_area_sqft, shading, connection_type, sanctioned_load_kw, recommended_kw, needs_structure_extension, needs_optimizer, optimizer_count, notes, created_by
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
            )
            RETURNING ${SITE_SURVEY_DETAILS_COLUMNS.replace(/ssd\./g, '')}
        `;
        const values = [
            uid, tenantUid, siteSurveyUid, data.roofAreaSqft, data.shading, data.connectionType, data.sanctionedLoadKw, data.recommendedKw ?? null, data.needsStructureExtension ?? 0, data.needsOptimizer ?? 0, data.optimizerCount ?? null, data.notes ?? null, createdBy
        ];

        const result = client 
            ? await client.query(query, values) 
            : await this.pool.query(query, values);
            
        return result.rows[0] as ISiteSurveyDetails;
    }

    async getBySiteSurveyUid(tenantUid: string, siteSurveyUid: string, client?: PoolClient): Promise<ISiteSurveyDetails | null> {
        const query = `
            SELECT ${SITE_SURVEY_DETAILS_COLUMNS}
            FROM site_survey_details ssd
            WHERE ssd.site_survey_uid = $1 AND ssd.tenant_uid = $2 AND ssd.is_deleted = 0
        `;
        const result = client
            ? await client.query(query, [siteSurveyUid, tenantUid])
            : await this.pool.query(query, [siteSurveyUid, tenantUid]);
        return result.rows.length > 0 ? (result.rows[0] as ISiteSurveyDetails) : null;
    }

    async update(
        tenantUid: string,
        siteSurveyUid: string,
        data: IUpdateSiteSurveyDetails,
        updatedBy: string,
        client?: PoolClient
    ): Promise<ISiteSurveyDetails> {
        const setFields: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (data.roofAreaSqft !== undefined) {
            setFields.push(`roof_area_sqft = $${paramIndex++}`);
            values.push(data.roofAreaSqft);
        }
        if (data.shading !== undefined) {
            setFields.push(`shading = $${paramIndex++}`);
            values.push(data.shading);
        }
        if (data.connectionType !== undefined) {
            setFields.push(`connection_type = $${paramIndex++}`);
            values.push(data.connectionType);
        }
        if (data.sanctionedLoadKw !== undefined) {
            setFields.push(`sanctioned_load_kw = $${paramIndex++}`);
            values.push(data.sanctionedLoadKw);
        }
        if (data.recommendedKw !== undefined) {
            setFields.push(`recommended_kw = $${paramIndex++}`);
            values.push(data.recommendedKw);
        }
        if (data.needsStructureExtension !== undefined) {
            setFields.push(`needs_structure_extension = $${paramIndex++}`);
            values.push(data.needsStructureExtension);
        }
        if (data.needsOptimizer !== undefined) {
            setFields.push(`needs_optimizer = $${paramIndex++}`);
            values.push(data.needsOptimizer);
        }
        if (data.optimizerCount !== undefined) {
            setFields.push(`optimizer_count = $${paramIndex++}`);
            values.push(data.optimizerCount);
        }
        if (data.notes !== undefined) {
            setFields.push(`notes = $${paramIndex++}`);
            values.push(data.notes);
        }

        setFields.push(`updated_at = CURRENT_TIMESTAMP`);
        setFields.push(`updated_by = $${paramIndex++}`);
        values.push(updatedBy);

        values.push(siteSurveyUid, tenantUid);

        const query = `
            UPDATE site_survey_details
            SET ${setFields.join(", ")}
            WHERE site_survey_uid = $${paramIndex - 2} AND tenant_uid = $${paramIndex - 1} AND is_deleted = 0
            RETURNING ${SITE_SURVEY_DETAILS_COLUMNS.replace(/ssd\./g, '')}
        `;

        const result = client
            ? await client.query(query, values)
            : await this.pool.query(query, values);

        return result.rows[0] as ISiteSurveyDetails;
    }
}
