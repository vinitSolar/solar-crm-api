import pool from "@packages/connection.js";
import { QuotationRepository } from "../repositories/quotation.repository.js";
import { QuotationScopeOfWorkRepository } from "../../quotation-scope-of-work/repositories/quotation-scope-of-work.repository.js";
import { QuotationTermsConditionRepository } from "../../quotation-terms-conditions/repositories/quotation-terms-condition.repository.js";
import { CustomError } from "../../../middlewares/error.middleware.js";
import { isRedisAvailable } from "../../notification/helpers/redis-health.helper.js";
import { QueueSnapshotStrategy, DirectSnapshotStrategy } from "../strategies/snapshot.strategy.js";
import { QUOTATION_VALIDATION_MESSAGES } from "../constants/quotation.constants.js";
import { toSafeQuotation, type SafeQuotationResponse } from "../dto/quotation.dto.js";
import { storageService } from "@packages/storage/index.js";
import { QuotationPdfGenerator } from "./pdf-generator.service.js";
import type {
    ICreateQuotationRequest,
    IUpdateQuotationRequest,
    IQuotationPaginationQuery,
    IQuotationItem,
    IQuotationScopeOfWorkItem,
    IQuotationTermsConditionsItem
} from "../interfaces/quotation.interface.js";
import { logger } from "@packages/logger/logger.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { notificationService, NOTIFICATION_CHANNEL, NOTIFICATION_TEMPLATE } from "../../notification/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let cachedDefaultLogoBase64: string | null = null;

function getDefaultLogoBase64(): string {
    if (cachedDefaultLogoBase64 !== null) {
        return cachedDefaultLogoBase64;
    }
    const pathsToTry = [
        path.join(process.cwd(), "apps/api/public/uploads/sticky-logo.svg"),
        path.join(__dirname, "../../../../public/uploads/sticky-logo.svg"),
        path.join(__dirname, "../../../../../apps/api/public/uploads/sticky-logo.svg"),
        path.join(__dirname, "../../../../../../apps/api/public/uploads/sticky-logo.svg")
    ];
    for (const p of pathsToTry) {
        if (fs.existsSync(p)) {
            try {
                const fileBuffer = fs.readFileSync(p);
                cachedDefaultLogoBase64 = `data:image/svg+xml;base64,${fileBuffer.toString("base64")}`;
                return cachedDefaultLogoBase64;
            } catch (err) {
                logger.error(`Failed to read default logo from path: ${p}`, err);
            }
        }
    }
    logger.warn("Default logo file not found in any of the search paths.");
    return "";
}

export class QuotationService {
    private readonly repository: QuotationRepository;
    private readonly scopeOfWorkRepo: QuotationScopeOfWorkRepository;
    private readonly termsConditionRepo: QuotationTermsConditionRepository;

    constructor() {
        this.repository = new QuotationRepository();
        this.scopeOfWorkRepo = new QuotationScopeOfWorkRepository();
        this.termsConditionRepo = new QuotationTermsConditionRepository();
    }

    async create(tenantUid: string, data: ICreateQuotationRequest, createdBy: string): Promise<SafeQuotationResponse> {
        // 1. Validate Lead exists for this tenant and fetch its details
        const lead = await this.repository.getLeadDetails(tenantUid, data.leadUid);
        if (!lead) {
            throw new CustomError(QUOTATION_VALIDATION_MESSAGES.LEAD_NOT_FOUND, 400);
        }

        // Determine system size from lead first, fall back to input if lead does not have it, or throw if neither has it
        const systemSize = lead.systemSize ?? data.systemSize ?? 0;
        if (systemSize <= 0) {
            throw new CustomError("System size must be a positive number (not found on lead or input)", 400);
        }

        const client = await this.repository.getPoolClient();
        try {
            await client.query("BEGIN");

            // 2. Generate sequential quote number on backend (thread-safe locking)
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, "0");
            const day = String(now.getDate()).padStart(2, "0");
            const dateStr = `${year}${month}${day}`;

            const lastQuoteNumber = await this.repository.getLastQuotationNumberForDate(client, dateStr);
            let nextQuoteNumber = "";
            if (lastQuoteNumber) {
                const lastSuffix = parseInt(lastQuoteNumber.slice(-4), 10);
                const nextSuffix = String(lastSuffix + 1).padStart(4, "0");
                nextQuoteNumber = `QT-${dateStr}${nextSuffix}`;
            } else {
                nextQuoteNumber = `QT-${dateStr}0001`;
            }

            // 3. Create basic quotation
            const payload: {
                leadUid: string;
                packageUid?: string;
                subtotal: number;
                gstAmount: number;
                grandTotal: number;
                subsidyData?: any[];
                netCustomerCost: number;
                quotationNumber: string;
                systemSize: number;
                validTill: string;
                status?: number;
                notes?: string | null;
            } = {
                leadUid: data.leadUid,
                subtotal: data.subtotal,
                gstAmount: data.gstAmount,
                grandTotal: data.grandTotal,
                netCustomerCost: data.netCustomerCost,
                quotationNumber: nextQuoteNumber,
                systemSize: systemSize,
                validTill: data.validTill,
                status: 0,
                notes: data.notes ?? null
            };
            if (data.packageUid !== undefined) payload.packageUid = data.packageUid;
            if (data.subsidyData !== undefined) payload.subsidyData = data.subsidyData;

            const quotation = await this.repository.create(client, tenantUid, payload, createdBy);

            // 4. Resolve and save products snapshot
            const allProducts = [...(data.packageProducts || []), ...(data.extraProducts || [])];
            
            if (allProducts.length === 0) {
                throw new CustomError("Quotation must have at least one product.", 400);
            }

            const uniqueProductUids = Array.from(new Set(allProducts.map(p => p.productUid)));
            const catalogProductsList = await this.repository.getCatalogProductsDetails(uniqueProductUids);
            const catalogProductsMap = new Map(catalogProductsList.map(cp => [cp.productUid, cp]));

            const itemInsertPromises = allProducts.map(async (itemInput) => {
                let productName = itemInput.productName;
                let pricePerUnit = itemInput.pricePerUnit;
                let gstPercentage = itemInput.gstPercentage;
                let brandName = "Generic";
                let unitName = "Units";

                const catalogProduct = catalogProductsMap.get(itemInput.productUid);
                if (catalogProduct) {
                    productName = productName ?? catalogProduct.name;
                    pricePerUnit = pricePerUnit ?? catalogProduct.pricePerUnit;
                    gstPercentage = gstPercentage ?? catalogProduct.gstPercentage;
                    brandName = catalogProduct.brandName;
                    unitName = catalogProduct.unitName;
                }

                if (!productName || pricePerUnit === undefined || gstPercentage === undefined) {
                    throw new CustomError(`Product details missing for ${itemInput.productUid}`, 400);
                }

                const lineTotal = Math.round(itemInput.quantity * pricePerUnit * 100) / 100;

                return this.repository.createItem(client, quotation.uid, {
                    productUid: itemInput.productUid,
                    productName,
                    brandName,
                    unitName,
                    quantity: itemInput.quantity,
                    pricePerUnit,
                    gstPercentage,
                    lineTotal,
                    description: itemInput.description ?? null,
                    isExtra: (itemInput as any).isExtra
                }, createdBy);
            });

            const createdItems: IQuotationItem[] = await Promise.all(itemInsertPromises);

            // 5. Resolve and save scope of work snapshot
            const createdSows: IQuotationScopeOfWorkItem[] = [];
            const allScopeOfWork = [
                ...(data.scopeOfWork?.map(s => ({ ...s, isExtra: false })) || []),
                ...(data.extraScopeOfWork?.map(s => ({ ...s, isExtra: true })) || [])
            ];

            const shouldLoadDefaults = 
                data.scopeOfWork === undefined && 
                data.extraScopeOfWork === undefined && 
                data.termsConditions === undefined;

            if (shouldLoadDefaults) {
                const defaultSows = await this.scopeOfWorkRepo.findAllActive(tenantUid);
                const defaultSowInsertPromises = defaultSows.map(defaultSow => 
                    this.repository.createScopeOfWorkItem(client, quotation.uid, {
                        scopeOfWorkUid: defaultSow.uid,
                        title: defaultSow.title,
                        value: defaultSow.value,
                        sortOrder: defaultSow.sortOrder
                    }, createdBy)
                );
                createdSows.push(...(await Promise.all(defaultSowInsertPromises)));
            } else if (allScopeOfWork.length > 0) {
                const sowUids = allScopeOfWork.map(s => s.scopeOfWorkUid).filter((uid): uid is string => Boolean(uid));
                const uniqueSowUids = Array.from(new Set(sowUids));
                const dbSows = await this.scopeOfWorkRepo.findByUids(tenantUid, uniqueSowUids);
                const sowsMap = new Map(dbSows.map(s => [s.uid, s]));

                const sowInsertPromises = allScopeOfWork.map(async (sowInput, i) => {
                    const dbSow = sowInput.scopeOfWorkUid ? sowsMap.get(sowInput.scopeOfWorkUid) : undefined;
                    
                    if (sowInput.scopeOfWorkUid && !dbSow && (!sowInput.title || !sowInput.value)) {
                        throw new CustomError(`Invalid Scope of Work UID: ${sowInput.scopeOfWorkUid}`, 400);
                    }

                    const title = sowInput.title ?? dbSow?.title;
                    const value = sowInput.value ?? dbSow?.value;

                    if (!title || !value) {
                         throw new CustomError(`Scope of Work title and value are required.`, 400);
                    }

                    return this.repository.createScopeOfWorkItem(client, quotation.uid, {
                        scopeOfWorkUid: sowInput.scopeOfWorkUid ?? null,
                        title: title,
                        value: value,
                        sortOrder: sowInput.sortOrder ?? (i + 1),
                        isExtra: sowInput.isExtra
                    }, createdBy);
                });
                createdSows.push(...(await Promise.all(sowInsertPromises)));
            }

            // 6. Resolve and save terms and conditions snapshot
            const createdTcs: IQuotationTermsConditionsItem[] = [];
            if (shouldLoadDefaults) {
                const defaultTcs = await this.termsConditionRepo.findAllActive(tenantUid);
                const defaultTcInsertPromises = defaultTcs.map(defaultTc => 
                    this.repository.createTermsConditionsItem(client, quotation.uid, {
                        title: defaultTc.title,
                        description: defaultTc.description,
                        sortOrder: defaultTc.sortOrder
                    }, createdBy)
                );
                createdTcs.push(...(await Promise.all(defaultTcInsertPromises)));
            } else if (data.termsConditions && data.termsConditions.length > 0) {
                const tcInsertPromises = data.termsConditions.map((tcInput, i) => 
                    this.repository.createTermsConditionsItem(client, quotation.uid, {
                        title: tcInput.title,
                        description: tcInput.description,
                        sortOrder: tcInput.sortOrder ?? (i + 1)
                    }, createdBy)
                );
                createdTcs.push(...(await Promise.all(tcInsertPromises)));
            }

            await client.query("COMMIT");

            // Deactivate other quotations for this lead in the background
            this.repository.deactivateOtherQuotations(tenantUid, quotation.leadUid, quotation.uid, createdBy).catch(err => {
                logger.error(`Failed to deactivate older quotations for lead ${quotation.leadUid}`, err);
            });

            // Trigger background snapshot generation using Strategy Pattern
            const strategy = isRedisAvailable() ? new QueueSnapshotStrategy() : new DirectSnapshotStrategy();
            await strategy.execute(tenantUid, quotation.uid, createdBy);

            // Auto-generate PDF during creation in the background
            this.generatePdf(tenantUid, quotation.uid, createdBy).then(pdfResult => {
                const pdfUrl = pdfResult.pdfUrl;
                if (pdfUrl) {
                    this.sendQuotationEmailBackground(tenantUid, quotation.uid, pdfUrl, createdBy).catch(err => {
                        logger.error(`Failed to trigger background quotation email sending:`, err);
                    });
                }
            }).catch(err => {
                logger.error(`Failed to auto-generate PDF for Quote: ${quotation.uid}`, err);
            });

            const quotationWithPdf = {
                ...quotation,
                pdfUrl: null,
                pdfPath: null
            };

            return toSafeQuotation(quotationWithPdf, createdItems, createdSows, createdTcs);
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    async getByUid(tenantUid: string, uid: string): Promise<SafeQuotationResponse> {
        const quotation = await this.repository.findByUid(tenantUid, uid);
        if (!quotation) {
            throw new CustomError(QUOTATION_VALIDATION_MESSAGES.RECORD_NOT_FOUND, 404);
        }

        const [items, sows, tcs] = await Promise.all([
            this.repository.findItemsByQuotationUid(quotation.uid),
            this.repository.findScopeOfWorkByQuotationUid(quotation.uid),
            this.repository.findTermsConditionsByQuotationUid(quotation.uid)
        ]);

        return toSafeQuotation(quotation, items, sows, tcs);
    }

    async update(tenantUid: string, uid: string, data: IUpdateQuotationRequest, updatedBy: string): Promise<SafeQuotationResponse> {
        const existing = await this.repository.findByUid(tenantUid, uid);
        if (!existing) {
            throw new CustomError(QUOTATION_VALIDATION_MESSAGES.RECORD_NOT_FOUND, 404);
        }

        if (existing.status === 4) {
            throw new CustomError(QUOTATION_VALIDATION_MESSAGES.CANNOT_EDIT_CONVERTED, 400);
        }

        if (data.leadUid) {
            const leadExists = await this.repository.leadExists(tenantUid, data.leadUid);
            if (!leadExists) {
                throw new CustomError(QUOTATION_VALIDATION_MESSAGES.LEAD_NOT_FOUND, 400);
            }
        }

        const client = await this.repository.getPoolClient();
        try {
            await client.query("BEGIN");

            // Update basic quotation fields dynamically to avoid exactOptionalPropertyTypes constraint conflicts
            const updatePayload: {
                leadUid?: string;
                packageUid?: string;
                subtotal?: number;
                gstAmount?: number;
                grandTotal?: number;
                subsidyData?: any[];
                netCustomerCost?: number;
                systemSize?: number;
                validTill?: string;
                status?: number;
                notes?: string | null;
            } = {};

            if (data.leadUid !== undefined) updatePayload.leadUid = data.leadUid;
            if (data.packageUid !== undefined) updatePayload.packageUid = data.packageUid;
            if (data.subtotal !== undefined) updatePayload.subtotal = data.subtotal;
            if (data.gstAmount !== undefined) updatePayload.gstAmount = data.gstAmount;
            if (data.grandTotal !== undefined) updatePayload.grandTotal = data.grandTotal;
            if (data.subsidyData !== undefined) updatePayload.subsidyData = data.subsidyData;
            if (data.netCustomerCost !== undefined) updatePayload.netCustomerCost = data.netCustomerCost;
            if (data.systemSize !== undefined) updatePayload.systemSize = data.systemSize;
            if (data.validTill !== undefined) updatePayload.validTill = data.validTill;
            if (data.status !== undefined) updatePayload.status = data.status;
            if (data.notes !== undefined) updatePayload.notes = data.notes ?? null;

            const updatedQuotation = await this.repository.update(client, tenantUid, uid, updatePayload, updatedBy);

            if (!updatedQuotation) {
                throw new CustomError("Failed to update quotation", 500);
            }

            // Products update (replacement strategy)
            let items: IQuotationItem[] = [];
            if (data.packageProducts !== undefined || data.extraProducts !== undefined) {
                await this.repository.deleteItemsByQuotationUid(client, updatedQuotation.uid);
                
                const allProducts = [...(data.packageProducts || []), ...(data.extraProducts || [])];
                if (allProducts.length === 0) {
                    throw new CustomError("Quotation must have at least one product.", 400);
                }

                const uniqueProductUids = Array.from(new Set(allProducts.map(p => p.productUid)));
                const catalogProductsList = await this.repository.getCatalogProductsDetails(uniqueProductUids);
                const catalogProductsMap = new Map(catalogProductsList.map(cp => [cp.productUid, cp]));

                const itemInsertPromises = allProducts.map(async (itemInput) => {
                    let productName = itemInput.productName;
                    let pricePerUnit = itemInput.pricePerUnit;
                    let gstPercentage = itemInput.gstPercentage;
                    let brandName = "Generic";
                    let unitName = "Units";

                    const catalogProduct = catalogProductsMap.get(itemInput.productUid);
                    if (catalogProduct) {
                        productName = productName ?? catalogProduct.name;
                        pricePerUnit = pricePerUnit ?? catalogProduct.pricePerUnit;
                        gstPercentage = gstPercentage ?? catalogProduct.gstPercentage;
                        brandName = catalogProduct.brandName;
                        unitName = catalogProduct.unitName;
                    }

                    if (!productName || pricePerUnit === undefined || gstPercentage === undefined) {
                        throw new CustomError(`Product details missing for ${itemInput.productUid}`, 400);
                    }

                    const lineTotal = Math.round(itemInput.quantity * pricePerUnit * 100) / 100;

                    return this.repository.createItem(client, updatedQuotation.uid, {
                        productUid: itemInput.productUid,
                        productName,
                        brandName,
                        unitName,
                        quantity: itemInput.quantity,
                        pricePerUnit,
                        gstPercentage,
                        lineTotal,
                        description: itemInput.description ?? null,
                        isExtra: (itemInput as any).isExtra
                    }, updatedBy);
                });
                
                items.push(...(await Promise.all(itemInsertPromises)));
            } else {
                items = await this.repository.findItemsByQuotationUid(updatedQuotation.uid);
            }

            // Scope of work update (replacement strategy)
            let sows: IQuotationScopeOfWorkItem[] = [];
            if (data.scopeOfWork !== undefined || data.extraScopeOfWork !== undefined) {
                await this.repository.deleteScopeOfWorkItemsByQuotationUid(client, updatedQuotation.uid);
                
                const allScopeOfWork = [
                    ...(data.scopeOfWork?.map(s => ({ ...s, isExtra: false })) || []),
                    ...(data.extraScopeOfWork?.map(s => ({ ...s, isExtra: true })) || [])
                ];

                const sowUids = allScopeOfWork.map(s => s.scopeOfWorkUid).filter((uid): uid is string => Boolean(uid));
                const uniqueSowUids = Array.from(new Set(sowUids));
                const dbSows = await this.scopeOfWorkRepo.findByUids(tenantUid, uniqueSowUids);
                const sowsMap = new Map(dbSows.map(s => [s.uid, s]));

                const sowInsertPromises = allScopeOfWork.map(async (sowInput, i) => {
                    const dbSow = sowInput.scopeOfWorkUid ? sowsMap.get(sowInput.scopeOfWorkUid) : undefined;
                    
                    if (sowInput.scopeOfWorkUid && !dbSow && (!sowInput.title || !sowInput.value)) {
                        throw new CustomError(`Invalid Scope of Work UID: ${sowInput.scopeOfWorkUid}`, 400);
                    }

                    const title = sowInput.title ?? dbSow?.title;
                    const value = sowInput.value ?? dbSow?.value;

                    if (!title || !value) {
                         throw new CustomError(`Scope of Work title and value are required.`, 400);
                    }

                    return this.repository.createScopeOfWorkItem(client, updatedQuotation.uid, {
                        scopeOfWorkUid: sowInput.scopeOfWorkUid ?? null,
                        title: title,
                        value: value,
                        sortOrder: sowInput.sortOrder ?? (i + 1),
                        isExtra: sowInput.isExtra
                    }, updatedBy);
                });
                sows.push(...(await Promise.all(sowInsertPromises)));
            } else {
                sows = await this.repository.findScopeOfWorkByQuotationUid(updatedQuotation.uid);
            }

            // Terms and conditions update (replacement strategy)
            let tcs: IQuotationTermsConditionsItem[] = [];
            if (data.termsConditions !== undefined) {
                await this.repository.deleteTermsConditionsItemsByQuotationUid(client, updatedQuotation.uid);
                const tcInsertPromises = data.termsConditions.map((tcInput, i) => 
                    this.repository.createTermsConditionsItem(client, updatedQuotation.uid, {
                        title: tcInput.title,
                        description: tcInput.description,
                        sortOrder: tcInput.sortOrder ?? (i + 1)
                    }, updatedBy)
                );
                tcs.push(...(await Promise.all(tcInsertPromises)));
            } else {
                tcs = await this.repository.findTermsConditionsByQuotationUid(updatedQuotation.uid);
            }

            // Fetch final items for return
            const finalItems = await this.repository.findItemsByQuotationUid(updatedQuotation.uid);

            await client.query("COMMIT");

            // Trigger background snapshot generation using Strategy Pattern
            const strategy = isRedisAvailable() ? new QueueSnapshotStrategy() : new DirectSnapshotStrategy();
            await strategy.execute(tenantUid, updatedQuotation.uid, updatedBy);

            // Auto-regenerate PDF during update to sync details in the background
            this.generatePdf(tenantUid, updatedQuotation.uid, updatedBy).catch(err => {
                logger.error(`Failed to auto-regenerate PDF for Quote: ${updatedQuotation.uid}`, err);
            });

            const updatedQuotationWithPdf = {
                ...updatedQuotation,
                pdfUrl: null,
                pdfPath: null
            };

            return toSafeQuotation(updatedQuotationWithPdf, items, sows, tcs);
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    async list(tenantUid: string, query: IQuotationPaginationQuery): Promise<{
        data: SafeQuotationResponse[];
        meta: { total: number; page: number; limit: number; totalPages: number };
    }> {
        const page = query.page ?? 1;
        const limit = query.limit ?? 10;
        const search = query.search;
        const status = query.status ?? "active";
        const leadUid = query.leadUid;

        const { data: quotations, total } = await this.repository.list(tenantUid, page, limit, search, status, leadUid);

        if (quotations.length === 0) {
            return {
                data: [],
                meta: { total, page, limit, totalPages: 0 }
            };
        }

        const quoteUids = quotations.map(q => q.uid);

        const [allItems, allSows, allTcs] = await Promise.all([
            pool.query(`SELECT * FROM quotation_items WHERE quotation_uid = ANY($1) AND is_deleted = 0`, [quoteUids]),
            pool.query(`SELECT * FROM quotation_scope_of_work_items WHERE quotation_uid = ANY($1) AND is_deleted = 0`, [quoteUids]),
            pool.query(`SELECT * FROM quotation_terms_conditions_items WHERE quotation_uid = ANY($1) AND is_deleted = 0`, [quoteUids])
        ]);

        const itemsMap = new Map<string, any[]>();
        allItems.rows.forEach((row: any) => {
            const item = {
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
                updatedAt: row.updated_at
            };
            const list = itemsMap.get(item.quotationUid) || [];
            list.push(item);
            itemsMap.set(item.quotationUid, list);
        });

        const sowsMap = new Map<string, any[]>();
        allSows.rows.forEach((row: any) => {
            const sow = {
                id: row.id,
                uid: row.uid,
                quotationUid: row.quotation_uid,
                title: row.title,
                value: row.value,
                sortOrder: row.sort_order,
                isActive: row.is_active,
                isDeleted: row.is_deleted,
                createdAt: row.created_at,
                updatedAt: row.updated_at
            };
            const list = sowsMap.get(sow.quotationUid) || [];
            list.push(sow);
            sowsMap.set(sow.quotationUid, list);
        });

        const tcsMap = new Map<string, any[]>();
        allTcs.rows.forEach((row: any) => {
            const tc = {
                id: row.id,
                uid: row.uid,
                quotationUid: row.quotation_uid,
                title: row.title,
                description: row.description,
                sortOrder: row.sort_order,
                isActive: row.is_active,
                isDeleted: row.is_deleted,
                createdAt: row.created_at,
                updatedAt: row.updated_at
            };
            const list = tcsMap.get(tc.quotationUid) || [];
            list.push(tc);
            tcsMap.set(tc.quotationUid, list);
        });

        const safeQuotations = quotations.map(q => {
            const items = itemsMap.get(q.uid) || [];
            const sows = sowsMap.get(q.uid) || [];
            const tcs = tcsMap.get(q.uid) || [];
            return toSafeQuotation(q, items, sows, tcs);
        });

        return {
            data: safeQuotations,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async getDropdown(tenantUid: string): Promise<Array<{ uid: string; quotationNumber: string }>> {
        const quotations = await this.repository.findAllActive(tenantUid);
        return quotations.map(q => ({
            uid: q.uid,
            quotationNumber: q.quotationNumber
        }));
    }

    async delete(tenantUid: string, uid: string, deletedBy: string): Promise<void> {
        const existing = await this.repository.findByUid(tenantUid, uid);
        if (!existing) {
            throw new CustomError(QUOTATION_VALIDATION_MESSAGES.RECORD_NOT_FOUND, 404);
        }

        const success = await this.repository.softDelete(tenantUid, uid, deletedBy);
        if (!success) {
            throw new CustomError("Failed to delete quotation", 500);
        }
    }

    async restore(tenantUid: string, uid: string, updatedBy: string): Promise<void> {
        const success = await this.repository.restore(tenantUid, uid, updatedBy);
        if (!success) {
            throw new CustomError(QUOTATION_VALIDATION_MESSAGES.RECORD_NOT_FOUND, 404);
        }
    }

    async convertToProject(tenantUid: string, uid: string, updatedBy: string): Promise<SafeQuotationResponse> {
        const existing = await this.repository.findByUid(tenantUid, uid);
        if (!existing) {
            throw new CustomError(QUOTATION_VALIDATION_MESSAGES.RECORD_NOT_FOUND, 404);
        }

        const client = await this.repository.getPoolClient();
        try {
            await client.query("BEGIN");

            const updated = await this.repository.update(client, tenantUid, uid, {
                status: 4
            }, updatedBy);

            if (!updated) {
                throw new CustomError("Failed to convert quotation", 500);
            }

            await client.query("COMMIT");

            const [items, sows, tcs] = await Promise.all([
                this.repository.findItemsByQuotationUid(updated.uid),
                this.repository.findScopeOfWorkByQuotationUid(updated.uid),
                this.repository.findTermsConditionsByQuotationUid(updated.uid)
            ]);

            return toSafeQuotation(updated, items, sows, tcs);
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Orchestrates fetching snapshots, lead details, franchise details,
     * calculating subsidies (Central PM-Surya Ghar + State dynamically),
     * rendering the HTML via Puppeteer, uploading the PDF to R2/Local storage,
     * and saving the resulting URL.
     * 
     * @param tenantUid Tenant franchise identifier
     * @param uid Quotation unique identifier
     * @param createdBy Authenticated user performing the generation
     * @returns Object containing public PDF storage URL and path key
     */
    async generatePdf(tenantUid: string, uid: string, createdBy: string): Promise<{ pdfUrl: string; pdfPath: string }> {
        // 1. Fetch complete quotation details from snapshotted tables
        const quotation = await this.repository.findByUid(tenantUid, uid);
        if (!quotation) {
            throw new CustomError(QUOTATION_VALIDATION_MESSAGES.RECORD_NOT_FOUND, 404);
        }

        const [items, scopeOfWork, termsConditions] = await Promise.all([
            this.repository.findItemsByQuotationUid(quotation.uid),
            this.repository.findScopeOfWorkByQuotationUid(quotation.uid),
            this.repository.findTermsConditionsByQuotationUid(quotation.uid)
        ]);

        // 2. Fetch Lead details for customer info
        const customer = await this.repository.getLeadDetails(tenantUid, quotation.leadUid);
        if (!customer) {
            throw new CustomError("Lead details not found for this quotation", 404);
        }

        // 3. Fetch Franchise details
        const franchise = await this.repository.getFranchiseDetails(tenantUid);
        if (!franchise) {
            throw new CustomError("Franchise details not found", 404);
        }

        // 4. Calculate Subtotal, GST and Grand Total
        const mappedItems = items.map(item => {
            const lineTotal = Number(item.lineTotal);
            return {
                productName: item.productName,
                brandName: item.brandName,
                unitName: item.unitName,
                quantity: Number(item.quantity),
                pricePerUnit: Number(item.pricePerUnit),
                gstPercentage: Number(item.gstPercentage),
                lineTotal: lineTotal,
                description: item.description
            };
        });

        const showSubsidy = quotation.subsidyData && quotation.subsidyData.length > 0;
        const systemSize = Number(quotation.systemSize);

        // Status text mapping
        const statusMap: Record<number, string> = {
            0: "Draft",
            1: "Sent",
            2: "Approved",
            3: "Rejected",
            4: "Converted"
        };
        const statusText = statusMap[quotation.status] || "Draft";

        // Date formatting helper
        const formatDate = (date: Date) => {
            return new Date(date).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            });
        };

        // Prepare PDF Data payload
        const pdfData = {
            franchise: {
                ...franchise,
                logo: franchise.logo || getDefaultLogoBase64()
            },
            customer,
            quotation: {
                quotationNumber: quotation.quotationNumber,
                validTill: formatDate(quotation.validTill),
                systemSize,
                statusText,
                subtotal: quotation.subtotal,
                gstAmount: quotation.gstAmount,
                grandTotal: quotation.grandTotal,
                notes: quotation.notes,
                createdAt: formatDate(quotation.createdAt)
            },
            items: mappedItems,
            scopeOfWork: scopeOfWork.map(s => ({ title: s.title, value: s.value })),
            termsConditions: termsConditions.map(t => ({ title: t.title, description: t.description })),
            subsidy: {
                subsidyData: quotation.subsidyData as Array<{ uid: string; name: string; amount: number }>,
                netCustomerCost: quotation.netCustomerCost,
                showSubsidy
            }
        };

        // 6. Generate PDF Buffer using Puppeteer
        const startTime = performance.now();
        const pdfBuffer = await QuotationPdfGenerator.generatePdfBuffer(pdfData);
        const generationTime = performance.now() - startTime;
        logger.info(`PDF Generation for Quote ${quotation.uid} completed in ${generationTime.toFixed(2)} ms`);

        // 7. Upload PDF to Storage
        const uploadStartTime = performance.now();
        const fileName = `${quotation.quotationNumber}.pdf`;
        const mimeType = "application/pdf";
        const uploadFolder = `franchises/${franchise.code || "HO"}_${tenantUid}/quotations`;
        const { url: pdfUrl, path: pdfPath } = await storageService.uploadFileWithPath(pdfBuffer, fileName, mimeType, uploadFolder);
        const uploadTime = performance.now() - uploadStartTime;
        logger.info(`PDF Upload for Quote ${quotation.uid} completed in ${uploadTime.toFixed(2)} ms`);

        // 8. Save PDF URL & Path in Database
        await this.repository.updatePdfInfo(quotation.uid, pdfUrl, pdfPath, createdBy);

        return { pdfUrl, pdfPath };
    }

    /**
     * Sends the quotation generated email to the customer asynchronously in the background.
     */
    private async sendQuotationEmailBackground(
        tenantUid: string,
        quotationUid: string,
        pdfUrl: string,
        createdBy: string
    ): Promise<void> {
        try {
            logger.info(`Starting notification dispatch for Quotation UID: ${quotationUid}`);

            // 1. Fetch complete quotation
            const quotation = await this.repository.findByUid(tenantUid, quotationUid);
            if (!quotation) {
                logger.error(`Failed to send quotation notification: Quotation not found [UID: ${quotationUid}]`);
                return;
            }

            // 2. Fetch Lead details
            const lead = await this.repository.getLeadDetails(tenantUid, quotation.leadUid);
            if (!lead) {
                logger.warn(`Skipping quotation notification: Lead not found for Lead UID: ${quotation.leadUid}`);
                return;
            }

            if (!lead.email || !lead.email.trim()) {
                logger.warn(`Skipping quotation notification: Customer email is empty for Lead UID: ${quotation.leadUid}`);
                return;
            }

            // 3. Fetch Franchise details
            const franchise = await this.repository.getFranchiseDetails(tenantUid);
            if (!franchise) {
                logger.error(`Failed to send quotation notification: Franchise not found for Tenant UID: ${tenantUid}`);
                return;
            }

            // 4. Calculate total amount
            const items = await this.repository.findItemsByQuotationUid(quotation.uid);
            let subtotal = 0;
            let gstAmount = 0;
            for (const item of items) {
                const lineTotal = Number(item.lineTotal);
                subtotal += lineTotal;
                gstAmount += lineTotal * (Number(item.gstPercentage) / 100);
            }
            const grandTotal = Math.round((subtotal + gstAmount) * 100) / 100;

            // Formatter helpers
            const formatDate = (date: Date) => {
                return new Date(date).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric"
                });
            };
            const formatINR = (amount: number) => {
                return "\u20B9" + Number(amount).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
            };

            // 5. Send via NotificationService (auto-selects BullMQ or Direct fallback)
            await notificationService.send({
                channel: NOTIFICATION_CHANNEL.EMAIL,
                template: NOTIFICATION_TEMPLATE.QUOTATION_GENERATED,
                recipient: lead.email,
                module: "quotation",
                referenceUid: quotation.uid,
                tenantUid,
                createdBy,
                variables: {
                    customer_name: `${lead.firstName} ${lead.lastName || ""}`.trim(),
                    quotation_number: quotation.quotationNumber,
                    quotation_date: formatDate(quotation.createdAt),
                    quotation_amount: formatINR(grandTotal),
                    project_capacity: Number(quotation.systemSize).toString(),
                    valid_until: formatDate(quotation.validTill),
                    company_name: franchise.name,
                    company_logo: franchise.logo || "",
                    company_email: franchise.email || "",
                    company_phone: franchise.mobile || "",
                    quotation_download_link: pdfUrl
                }
            });
        } catch (error) {
            logger.error(`Error in quotation notification dispatch:`, error);
        }
    }
}
