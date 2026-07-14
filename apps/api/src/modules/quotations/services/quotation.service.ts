import pool from "@packages/connection.js";
import { QuotationRepository } from "../repositories/quotation.repository.js";
import { QuotationScopeOfWorkRepository } from "../../quotation-scope-of-work/repositories/quotation-scope-of-work.repository.js";
import { QuotationTermsConditionRepository } from "../../quotation-terms-conditions/repositories/quotation-terms-condition.repository.js";
import { CustomError } from "../../../middlewares/error.middleware.js";
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
            const quotation = await this.repository.create(client, tenantUid, {
                leadUid: data.leadUid,
                quotationNumber: nextQuoteNumber,
                systemSize: systemSize,
                validTill: data.validTill,
                status: 0,
                notes: data.notes ?? null
            }, createdBy);

            // 4. Resolve and save products snapshot
            const createdItems: IQuotationItem[] = [];
            for (const itemInput of data.products) {
                const catalogProduct = await this.repository.getCatalogProductDetails(itemInput.productUid);
                if (!catalogProduct) {
                    throw new CustomError(`${QUOTATION_VALIDATION_MESSAGES.PRODUCT_NOT_FOUND}: ${itemInput.productUid}`, 400);
                }

                const productName = itemInput.productName ?? catalogProduct.name;
                const pricePerUnit = itemInput.pricePerUnit !== undefined ? itemInput.pricePerUnit : catalogProduct.pricePerUnit;
                const gstPercentage = itemInput.gstPercentage !== undefined ? itemInput.gstPercentage : catalogProduct.gstPercentage;
                const lineTotal = Math.round(itemInput.quantity * pricePerUnit * 100) / 100;

                const createdItem = await this.repository.createItem(client, quotation.uid, {
                    productUid: itemInput.productUid,
                    productName,
                    brandName: catalogProduct.brandName,
                    unitName: catalogProduct.unitName,
                    quantity: itemInput.quantity,
                    pricePerUnit,
                    gstPercentage,
                    lineTotal,
                    description: itemInput.description ?? null
                }, createdBy);

                createdItems.push(createdItem);
            }

            // 5. Resolve and save scope of work snapshot
            const createdSows: IQuotationScopeOfWorkItem[] = [];
            if (data.scopeOfWork && data.scopeOfWork.length > 0) {
                for (const sowInput of data.scopeOfWork) {
                    const createdSow = await this.repository.createScopeOfWorkItem(client, quotation.uid, {
                        title: sowInput.title,
                        value: sowInput.value,
                        sortOrder: sowInput.sortOrder ?? 0
                    }, createdBy);
                    createdSows.push(createdSow);
                }
            } else {
                const defaultSows = await this.scopeOfWorkRepo.findAllActive(tenantUid);
                for (const defaultSow of defaultSows) {
                    const createdSow = await this.repository.createScopeOfWorkItem(client, quotation.uid, {
                        title: defaultSow.title,
                        value: defaultSow.value,
                        sortOrder: defaultSow.sortOrder
                    }, createdBy);
                    createdSows.push(createdSow);
                }
            }

            // 6. Resolve and save terms and conditions snapshot
            const createdTcs: IQuotationTermsConditionsItem[] = [];
            if (data.termsConditions && data.termsConditions.length > 0) {
                for (const tcInput of data.termsConditions) {
                    const createdTc = await this.repository.createTermsConditionsItem(client, quotation.uid, {
                        title: tcInput.title,
                        description: tcInput.description,
                        sortOrder: tcInput.sortOrder ?? 0
                    }, createdBy);
                    createdTcs.push(createdTc);
                }
            } else {
                const defaultTcs = await this.termsConditionRepo.findAllActive(tenantUid);
                for (const defaultTc of defaultTcs) {
                    const createdTc = await this.repository.createTermsConditionsItem(client, quotation.uid, {
                        title: defaultTc.title,
                        description: defaultTc.description,
                        sortOrder: defaultTc.sortOrder
                    }, createdBy);
                    createdTcs.push(createdTc);
                }
            }

            await client.query("COMMIT");

            // Auto-generate PDF during creation
            let pdfUrl: string | null = null;
            let pdfPath: string | null = null;
            try {
                const pdfResult = await this.generatePdf(tenantUid, quotation.uid, createdBy);
                pdfUrl = pdfResult.pdfUrl;
                pdfPath = pdfResult.pdfPath;
            } catch (err) {
                logger.error(`Failed to auto-generate PDF for Quote: ${quotation.uid}`, err);
            }

            const quotationWithPdf = {
                ...quotation,
                pdfUrl,
                pdfPath
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
                systemSize?: number;
                validTill?: string;
                status?: number;
                notes?: string | null;
            } = {};

            if (data.leadUid !== undefined) updatePayload.leadUid = data.leadUid;
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
            if (data.products !== undefined) {
                await this.repository.deleteItemsByQuotationUid(client, updatedQuotation.uid);
                for (const itemInput of data.products) {
                    const catalogProduct = await this.repository.getCatalogProductDetails(itemInput.productUid);
                    if (!catalogProduct) {
                        throw new CustomError(`${QUOTATION_VALIDATION_MESSAGES.PRODUCT_NOT_FOUND}: ${itemInput.productUid}`, 400);
                    }

                    const productName = itemInput.productName ?? catalogProduct.name;
                    const pricePerUnit = itemInput.pricePerUnit !== undefined ? itemInput.pricePerUnit : catalogProduct.pricePerUnit;
                    const gstPercentage = itemInput.gstPercentage !== undefined ? itemInput.gstPercentage : catalogProduct.gstPercentage;
                    const lineTotal = Math.round(itemInput.quantity * pricePerUnit * 100) / 100;

                    const createdItem = await this.repository.createItem(client, updatedQuotation.uid, {
                        productUid: itemInput.productUid,
                        productName,
                        brandName: catalogProduct.brandName,
                        unitName: catalogProduct.unitName,
                        quantity: itemInput.quantity,
                        pricePerUnit,
                        gstPercentage,
                        lineTotal,
                        description: itemInput.description ?? null
                    }, updatedBy);

                    items.push(createdItem);
                }
            } else {
                items = await this.repository.findItemsByQuotationUid(updatedQuotation.uid);
            }

            // Scope of work update (replacement strategy)
            let sows: IQuotationScopeOfWorkItem[] = [];
            if (data.scopeOfWork !== undefined) {
                await this.repository.deleteScopeOfWorkItemsByQuotationUid(client, updatedQuotation.uid);
                for (const sowInput of data.scopeOfWork) {
                    const createdSow = await this.repository.createScopeOfWorkItem(client, updatedQuotation.uid, {
                        title: sowInput.title,
                        value: sowInput.value,
                        sortOrder: sowInput.sortOrder ?? 0
                    }, updatedBy);
                    sows.push(createdSow);
                }
            } else {
                sows = await this.repository.findScopeOfWorkByQuotationUid(updatedQuotation.uid);
            }

            // Terms and conditions update (replacement strategy)
            let tcs: IQuotationTermsConditionsItem[] = [];
            if (data.termsConditions !== undefined) {
                await this.repository.deleteTermsConditionsItemsByQuotationUid(client, updatedQuotation.uid);
                for (const tcInput of data.termsConditions) {
                    const createdTc = await this.repository.createTermsConditionsItem(client, updatedQuotation.uid, {
                        title: tcInput.title,
                        description: tcInput.description,
                        sortOrder: tcInput.sortOrder ?? 0
                    }, updatedBy);
                    tcs.push(createdTc);
                }
            } else {
                tcs = await this.repository.findTermsConditionsByQuotationUid(updatedQuotation.uid);
            }

            await client.query("COMMIT");

            // Auto-regenerate PDF during update to sync details
            let pdfUrl: string | null = null;
            let pdfPath: string | null = null;
            try {
                const pdfResult = await this.generatePdf(tenantUid, updatedQuotation.uid, updatedBy);
                pdfUrl = pdfResult.pdfUrl;
                pdfPath = pdfResult.pdfPath;
            } catch (err) {
                logger.error(`Failed to auto-regenerate PDF for Quote: ${updatedQuotation.uid}`, err);
            }

            const updatedQuotationWithPdf = {
                ...updatedQuotation,
                pdfUrl,
                pdfPath
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

        const { data: quotations, total } = await this.repository.list(tenantUid, page, limit, search, status);

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
        let subtotal = 0;
        let gstAmount = 0;
        const mappedItems = items.map(item => {
            const lineTotal = Number(item.lineTotal);
            subtotal += lineTotal;
            gstAmount += lineTotal * (Number(item.gstPercentage) / 100);
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

        subtotal = Math.round(subtotal * 100) / 100;
        gstAmount = Math.round(gstAmount * 100) / 100;
        const grandTotal = Math.round((subtotal + gstAmount) * 100) / 100;

        // 5. Calculate Subsidies dynamically if rule exists
        let centralSubsidy = 0;
        let stateSubsidy = 0;
        let showSubsidy = false;

        const systemSize = Number(quotation.systemSize);
        if (systemSize > 0) {
            // Central Subsidy PM Surya Ghar calculation
            if (systemSize <= 2) {
                centralSubsidy = systemSize * 30000;
            } else {
                centralSubsidy = Math.min(60000 + (systemSize - 2) * 18000, 78000);
            }
            centralSubsidy = Math.round(centralSubsidy * 100) / 100;

            // State Subsidy calculation
            if (customer.state) {
                const stateRule = await this.repository.getStateSubsidyRule(customer.state);
                if (stateRule) {
                    stateSubsidy = Math.min(systemSize * stateRule.subsidyPerKw, stateRule.maximumSubsidyAmount);
                    stateSubsidy = Math.round(stateSubsidy * 100) / 100;
                }
            }

            if (centralSubsidy > 0 || stateSubsidy > 0) {
                showSubsidy = true;
            }
        }

        const netCustomerCost = Math.max(0, Math.round((grandTotal - centralSubsidy - stateSubsidy) * 100) / 100);

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
                subtotal,
                gstAmount,
                grandTotal,
                notes: quotation.notes,
                createdAt: formatDate(quotation.createdAt)
            },
            items: mappedItems,
            scopeOfWork: scopeOfWork.map(s => ({ title: s.title, value: s.value })),
            termsConditions: termsConditions.map(t => ({ title: t.title, description: t.description })),
            subsidy: {
                centralSubsidy,
                stateSubsidy,
                netCustomerCost,
                showSubsidy
            }
        };

        // 6. Generate PDF Buffer using Puppeteer
        const pdfBuffer = await QuotationPdfGenerator.generatePdfBuffer(pdfData);

        // 7. Upload PDF to Storage
        const fileName = `${quotation.quotationNumber}.pdf`;
        const mimeType = "application/pdf";
        const uploadFolder = `franchises/${franchise.code || "HO"}_${tenantUid}/quotations`;
        const { url: pdfUrl, path: pdfPath } = await storageService.uploadFileWithPath(pdfBuffer, fileName, mimeType, uploadFolder);

        // 8. Save PDF URL & Path in Database
        await this.repository.updatePdfInfo(quotation.uid, pdfUrl, pdfPath, createdBy);

        return { pdfUrl, pdfPath };
    }
}
