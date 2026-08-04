import { logger } from "@packages/logger/logger.js";
import { getQuotationQueue } from "../queues/quotation.queue.js";
import { QuotationRepository } from "../repositories/quotation.repository.js";
import { QUOTATION_QUEUE } from "../constants/quotation.constants.js";

export interface ISnapshotJobData {
    tenantUid: string;
    quotationUid: string;
    createdBy: string;
}

export interface ISnapshotStrategy {
    execute(tenantUid: string, quotationUid: string, createdBy: string): Promise<void>;
}

export class QueueSnapshotStrategy implements ISnapshotStrategy {
    async execute(tenantUid: string, quotationUid: string, createdBy: string): Promise<void> {
        try {
            const queue = getQuotationQueue();
            const jobData: ISnapshotJobData = { tenantUid, quotationUid, createdBy };
            
            await queue.add(QUOTATION_QUEUE.NAME, jobData, {
                jobId: `snapshot_${quotationUid}_${Date.now()}`
            });
            logger.info(`Snapshot job added to queue for Quotation: ${quotationUid}`);
        } catch (error) {
            logger.error(`Failed to push snapshot job to queue for Quotation: ${quotationUid}`, error);
            // Fallback to direct strategy if queue pushing fails unexpectedly
            const directStrategy = new DirectSnapshotStrategy();
            await directStrategy.execute(tenantUid, quotationUid, createdBy);
        }
    }
}

export class DirectSnapshotStrategy implements ISnapshotStrategy {
    private repository: QuotationRepository;

    constructor() {
        this.repository = new QuotationRepository();
    }

    async execute(tenantUid: string, quotationUid: string, createdBy: string): Promise<void> {
        try {
            logger.info(`Executing direct (synchronous) snapshot generation for Quotation: ${quotationUid}`);
            
            // We use setTimeout to decouple from the current request thread (poor man's background job)
            setTimeout(async () => {
                try {
                    // Fetch quotation
                    const quotation = await this.repository.findByUid(tenantUid, quotationUid);
                    if (!quotation) {
                        logger.error(`Direct snapshot failed: Quotation ${quotationUid} not found`);
                        return;
                    }

                    // Fetch lead
                    const lead = await this.repository.getLeadDetails(tenantUid, quotation.leadUid);
                    
                    // Fetch items
                    const items = await this.repository.findItemsByQuotationUid(quotationUid);
                    
                    // Fetch franchise
                    const franchise = await this.repository.getFranchiseDetails(tenantUid);
                    
                    // Fetch scope & terms
                    const scopeOfWork = await this.repository.findScopeOfWorkByQuotationUid(quotationUid);
                    const terms = await this.repository.findTermsConditionsByQuotationUid(quotationUid);

                    // Build JSON
                    const snapshotData = {
                        quotation,
                        lead,
                        franchise,
                        items,
                        scopeOfWork,
                        termsConditions: terms,
                        snapshottedAt: new Date().toISOString()
                    };

                    await this.repository.updateSnapshotData(quotationUid, JSON.stringify(snapshotData));
                    logger.info(`Direct snapshot generated successfully for Quotation: ${quotationUid}`);
                } catch (innerError) {
                    logger.error(`Error during direct snapshot processing for Quotation: ${quotationUid}`, innerError);
                }
            }, 0);
        } catch (error) {
            logger.error(`Failed to initiate direct snapshot for Quotation: ${quotationUid}`, error);
        }
    }
}
