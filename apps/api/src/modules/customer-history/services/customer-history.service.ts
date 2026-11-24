import type { Pool } from "pg";
import { CustomerHistoryRepository } from "../repositories/customer-history.repository.js";
import type { ICustomerHistory, IQuotationHistoryPayload } from "../interfaces/customer-history.interface.js";
import { logger } from "@packages/logger/logger.js";

export class CustomerHistoryService {
    private readonly repository: CustomerHistoryRepository;
    private readonly pool: Pool;

    constructor(pool: Pool, repository?: CustomerHistoryRepository) {
        this.pool = pool;
        this.repository = repository || new CustomerHistoryRepository(pool);
    }

    /**
     * Record or update customer history when a quotation is created.
     * Captures assigned package with exact pricing, quantities, products, and discounts.
     */
    async recordQuotationHistory(
        tenantUid: string,
        lead: any,
        quotation: any,
        quotationItems: any[],
        createdBy: string
    ): Promise<ICustomerHistory | null> {
        try {
            logger.info(`CustomerHistoryService: Recording quotation history for lead ${quotation.leadUid}, quote ${quotation.quotationNumber}`);

            let packageName = "Custom Package";
            let packagePrice = Number(quotation.grandTotal) || 0;
            let packageProducts: any[] = [];

            if (quotation.packageUid) {
                const pkgRes = await this.pool.query(
                    `SELECT uid, name, total_price, capacity, system_type, brand_names 
                     FROM packages 
                     WHERE uid = $1 AND is_deleted = 0 
                     LIMIT 1`,
                    [quotation.packageUid]
                );
                if (pkgRes.rows.length > 0) {
                    const pkg = pkgRes.rows[0];
                    packageName = pkg.name;
                    packagePrice = Number(pkg.total_price) || packagePrice;
                }
            }

            // Map exact product details from quotation items
            packageProducts = (quotationItems || []).map((item) => ({
                productUid: item.productUid,
                productName: item.productName,
                brandName: item.brandName || "Generic",
                unitName: item.unitName || "Unit",
                quantity: Number(item.quantity) || 1,
                pricePerUnit: Number(item.pricePerUnit) || 0,
                gstPercentage: Number(item.gstPercentage) || 0,
                lineTotal: Number(item.lineTotal) || 0,
                isExtra: Boolean(item.isExtra)
            }));

            const packageDetails = {
                packageUid: quotation.packageUid || null,
                packageName,
                packagePrice,
                products: packageProducts,
                totalProductsCount: packageProducts.length
            };

            const subsidyAmount = Array.isArray(quotation.subsidyData)
                ? quotation.subsidyData.reduce((sum: number, s: any) => sum + (Number(s.amount) || 0), 0)
                : 0;

            const quotationPayload: IQuotationHistoryPayload = {
                leadUid: quotation.leadUid,
                quotationUid: quotation.uid,
                quotationNumber: quotation.quotationNumber,
                packageUid: quotation.packageUid || null,
                packageName,
                packagePrice,
                packageDetails,
                subtotal: Number(quotation.subtotal) || 0,
                gstAmount: Number(quotation.gstAmount) || 0,
                grandTotal: Number(quotation.grandTotal) || 0,
                discount: Number(quotation.discount) || 0,
                netCustomerCost: Number(quotation.netCustomerCost) || 0,
                subsidyAmount,
                subsidyDetails: quotation.subsidyData || [],
                quotationSnapshot: {
                    items: packageProducts,
                    notes: quotation.notes || null,
                    validTill: quotation.validTill || null,
                    extra: quotation.extra || null
                }
            };

            const record = await this.repository.upsertFromQuotation(
                tenantUid,
                lead,
                quotationPayload,
                createdBy
            );

            logger.info(`CustomerHistoryService: Successfully recorded quotation history ${record.uid} for lead ${quotation.leadUid}`);
            return record;
        } catch (error) {
            logger.error("CustomerHistoryService.recordQuotationHistory error:", error);
            return null;
        }
    }

    /**
     * Update customer history when lead is moved to a closed state (Won / Lost / Closed).
     * Enriches the record with project data, milestones, subsidy tracker, and payments.
     */
    async recordLeadClosedHistory(
        tenantUid: string,
        leadUid: string,
        closureStatus: string,
        updatedBy: string,
        closureReason?: string | null
    ): Promise<ICustomerHistory | null> {
        try {
            logger.info(`CustomerHistoryService: Updating closure history for lead ${leadUid} -> status: ${closureStatus}`);

            // 1. Fetch current lead data
            const leadRes = await this.pool.query(
                `SELECT * FROM leads WHERE uid = $1 AND tenant_uid = $2 AND is_deleted = 0 LIMIT 1`,
                [leadUid, tenantUid]
            );
            const lead = leadRes.rows[0] || {};

            // 2. Fetch Project if one exists for this lead
            const projectRes = await this.pool.query(
                `SELECT p.uid, p.project_number, p.project_name, p.project_date, p.remarks,
                        ps.name AS status_name,
                        TRIM(CONCAT(u.first_name, ' ', COALESCE(u.last_name, ''))) AS manager_name,
                        u.email AS manager_email
                 FROM projects p
                 LEFT JOIN project_statuses ps ON p.project_status_uid = ps.uid
                 LEFT JOIN users u ON p.project_manager_uid = u.uid
                 WHERE p.lead_uid::varchar = $1 AND p.tenant_uid::varchar = $2 AND p.is_deleted = 0
                 ORDER BY p.created_at DESC
                 LIMIT 1`,
                [leadUid, tenantUid]
            );
            const project = projectRes.rows[0] || null;

            let projectDetails: any = {};
            if (project) {
                // Fetch milestones
                const milestoneRes = await this.pool.query(
                    `SELECT pim.uid, pim.status, pim.completed_at, im.name AS milestone_name, im.sort_order
                     FROM project_installation_milestones pim
                     LEFT JOIN installation_milestones im ON pim.milestone_uid = im.uid
                     WHERE pim.project_uid = $1
                     ORDER BY im.sort_order ASC`,
                    [project.uid]
                ).catch(() => ({ rows: [] }));

                // Fetch subsidy tracker info
                const subsidyRes = await this.pool.query(
                    `SELECT uid, application_number, status, current_stage, disbursed_amount, created_at
                     FROM subsidy_trackers
                     WHERE lead_uid::varchar = $1 AND tenant_uid::varchar = $2 AND is_deleted = 0
                     LIMIT 1`,
                    [leadUid, tenantUid]
                ).catch(() => ({ rows: [] }));

                projectDetails = {
                    projectUid: project.uid,
                    projectNumber: project.project_number,
                    projectName: project.project_name,
                    statusName: project.status_name,
                    projectDate: project.project_date,
                    projectManager: project.manager_name,
                    remarks: project.remarks,
                    milestones: milestoneRes.rows || [],
                    subsidyTracker: subsidyRes.rows[0] || null
                };
            }

            // 3. Fetch Payments
            const paymentsRes = await this.pool.query(
                `SELECT uid, amount, payment_method, transaction_reference, payment_date, status, notes
                 FROM payments
                 WHERE lead_uid::varchar = $1 AND tenant_uid::varchar = $2 AND is_deleted = 0
                 ORDER BY payment_date DESC`,
                [leadUid, tenantUid]
            ).catch(() => ({ rows: [] }));

            const paymentsList = paymentsRes.rows || [];
            // Status 1 = Paid
            const totalPaid = paymentsList.reduce((sum: number, p: any) => {
                const amt = Number(p.amount) || 0;
                return p.status === 1 || String(p.status).toLowerCase() === "paid" ? sum + amt : sum;
            }, 0);

            const record = await this.repository.updateClosureAndProject(
                tenantUid,
                leadUid,
                {
                    closureStatus,
                    closureReason: closureReason || lead.remarks || null,
                    closedBy: updatedBy,
                    projectUid: project ? project.uid : null,
                    projectNumber: project ? project.project_number : null,
                    projectName: project ? project.project_name : null,
                    projectStatus: project ? project.status_name : null,
                    projectManagerName: project ? project.manager_name : null,
                    projectDetails,
                    totalPaid,
                    paymentDetails: paymentsList,
                    leadSnapshot: lead
                }
            );

            logger.info(`CustomerHistoryService: Successfully updated closure history for lead ${leadUid}`);
            return record;
        } catch (error) {
            logger.error("CustomerHistoryService.recordLeadClosedHistory error:", error);
            return null;
        }
    }

    async getHistoryByLeadUid(tenantUid: string, leadUid: string): Promise<ICustomerHistory | null> {
        return this.repository.findByLeadUid(tenantUid, leadUid);
    }

    async getHistoryByUid(tenantUid: string, uid: string): Promise<ICustomerHistory | null> {
        return this.repository.findByUid(tenantUid, uid);
    }

    async getPaginatedHistories(
        tenantUid: string,
        page = 1,
        limit = 10,
        filters: { isClosed?: number | undefined; search?: string | undefined } = {}
    ): Promise<{ data: ICustomerHistory[]; total: number; page: number; limit: number }> {
        const { rows, total } = await this.repository.findPaginated(tenantUid, page, limit, filters);
        return {
            data: rows,
            total,
            page,
            limit
        };
    }
}
