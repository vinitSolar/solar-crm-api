import { Worker, type Job } from "bullmq";
import { env } from "@packages/config/index.js";
import { logger } from "@packages/logger/logger.js";
import { QuotationRepository } from "../repositories/quotation.repository.js";
import { QUOTATION_QUEUE, QUOTATION_WORKER_MESSAGES } from "../constants/quotation.constants.js";
import type { ISnapshotJobData } from "../strategies/snapshot.strategy.js";
import { isRedisAvailable } from "../../notification/helpers/redis-health.helper.js"; // Assuming helper exists, or we will check

const repository = new QuotationRepository();

async function processSnapshotJob(job: Job<ISnapshotJobData>): Promise<void> {
    const { tenantUid, quotationUid } = job.data;
    
    logger.info(`Processing snapshot job [Job ID: ${job.id}, Quotation: ${quotationUid}]`);

    // Fetch quotation
    const quotation = await repository.findByUid(tenantUid, quotationUid);
    if (!quotation) {
        throw new Error(`Quotation ${quotationUid} not found`);
    }

    // Fetch related details
    const lead = await repository.getLeadDetails(tenantUid, quotation.leadUid);
    const items = await repository.findItemsByQuotationUid(quotationUid);
    const franchise = await repository.getFranchiseDetails(tenantUid);
    const scopeOfWork = await repository.findScopeOfWorkByQuotationUid(quotationUid);
    const termsConditions = await repository.findTermsConditionsByQuotationUid(quotationUid);

    // Build JSON
    const snapshotData = {
        quotation,
        lead,
        franchise,
        items,
        scopeOfWork,
        termsConditions,
        snapshottedAt: new Date().toISOString()
    };

    // Save Snapshot
    await repository.updateSnapshotData(quotationUid, JSON.stringify(snapshotData));

    logger.info(`${QUOTATION_WORKER_MESSAGES.WORKER_JOB_COMPLETED} [Job ID: ${job.id}, Quotation: ${quotationUid}]`);
}

let workerInstance: Worker<ISnapshotJobData> | null = null;
let lastErrorLogTimestamp = 0;
const ERROR_LOG_THROTTLE_MS = 60_000;

export function startQuotationWorker(): void {
    try {
        if (!isRedisAvailable()) {
            logger.warn(`${QUOTATION_WORKER_MESSAGES.WORKER_FAILED}: Redis is not available. Worker will not start.`);
            return;
        }

        const redisConnection = {
            host: env.REDIS.HOST,
            port: env.REDIS.PORT,
            password: env.REDIS.PASSWORD || undefined,
            maxRetriesPerRequest: null
        };

        workerInstance = new Worker<ISnapshotJobData>(
            QUOTATION_QUEUE.NAME,
            processSnapshotJob,
            {
                connection: redisConnection,
                concurrency: 5,
                limiter: {
                    max: 10,
                    duration: 1000
                }
            }
        );

        workerInstance.on("completed", (job) => {
            logger.info(`Quotation worker: Job ${job?.id} completed successfully.`);
        });

        workerInstance.on("failed", (job, error) => {
            logger.error(`${QUOTATION_WORKER_MESSAGES.WORKER_JOB_FAILED} [Job ID: ${job?.id}]: ${error.message}`);
        });

        workerInstance.on("error", (error) => {
            const now = Date.now();
            if (now - lastErrorLogTimestamp >= ERROR_LOG_THROTTLE_MS) {
                lastErrorLogTimestamp = now;
                logger.error(`Quotation worker connection error: ${error.message}`);
            }
        });

        logger.info(QUOTATION_WORKER_MESSAGES.WORKER_STARTED);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        logger.warn(`${QUOTATION_WORKER_MESSAGES.WORKER_FAILED}: ${message}.`);
    }
}
