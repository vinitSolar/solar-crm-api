import type { Pool, PoolClient } from "pg";
import pool from "@packages/connection.js";
import { logger } from "@packages/logger/logger.js";
import { notificationService } from "../../notification/index.js";
import {
    NOTIFICATION_CHANNEL,
    NOTIFICATION_TEMPLATE,
} from "../../notification/constants/notification.constants.js";
import dayjs from "dayjs";

export interface IDueFollowUp {
    id: number;
    uid: string;
    tenantUid: string;
    leadUid: string;
    followUpDate: Date | string;
    status: string;
    notes: string | null;
    assignedTo: string | null;
    createdBy: string | null;
    customerName: string;
    leadNumber: string | null;
    mobileNumber: string | null;
}

export class FollowUpReminderService {
    private readonly pool: Pool;
    private intervalId: NodeJS.Timeout | null = null;
    private isProcessing = false;

    constructor(dbPool?: Pool) {
        this.pool = dbPool || pool;
    }

    /**
     * Finds active scheduled follow-ups whose follow_up_date <= NOW()
     * and whose reminder has not yet been dispatched.
     * Uses row-level lock `FOR UPDATE OF fu SKIP LOCKED` to prevent duplicate processing.
     */
    async processDueFollowUps(): Promise<number> {
        let client: PoolClient | null = null;
        const dueFollowUps: IDueFollowUp[] = [];

        try {
            client = await this.pool.connect();
            await client.query("BEGIN");

            const query = `
                SELECT 
                    fu.id,
                    fu.uid,
                    fu.tenant_uid AS "tenantUid",
                    fu.lead_uid AS "leadUid",
                    fu.follow_up_date AS "followUpDate",
                    fu.status,
                    fu.notes,
                    fu.assigned_to AS "assignedTo",
                    fu.created_by AS "createdBy",
                    COALESCE(NULLIF(TRIM(CONCAT(l.first_name, ' ', COALESCE(l.last_name, ''))), ''), 'Customer') AS "customerName",
                    l.lead_number AS "leadNumber",
                    l.mobile_number AS "mobileNumber"
                FROM follow_ups fu
                JOIN leads l ON fu.lead_uid = l.uid AND l.tenant_uid = fu.tenant_uid
                WHERE fu.is_active = 1
                  AND fu.is_deleted = 0
                  AND fu.status = 'scheduled'
                  AND fu.reminder_sent_at IS NULL
                  AND fu.follow_up_date <= NOW()
                ORDER BY fu.follow_up_date ASC
                FOR UPDATE OF fu SKIP LOCKED
                LIMIT 50;
            `;

            const result = await client.query(query);

            if (result.rows.length > 0) {
                const ids = result.rows.map((row: any) => row.id);
                await client.query(
                    `
                    UPDATE follow_ups
                    SET 
                        reminder_sent_at = CURRENT_TIMESTAMP,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ANY($1::bigint[])
                    `,
                    [ids]
                );
                dueFollowUps.push(...(result.rows as IDueFollowUp[]));
            }

            await client.query("COMMIT");
        } catch (error) {
            if (client) {
                try {
                    await client.query("ROLLBACK");
                } catch {
                    // Ignore rollback error
                }
            }
            logger.error("[FollowUpReminderService] Error querying due follow-ups:", error);
            return 0;
        } finally {
            if (client) {
                client.release();
            }
        }

        if (dueFollowUps.length === 0) {
            return 0;
        }

        logger.info(`[FollowUpReminderService] Processing ${dueFollowUps.length} due follow-up reminder(s)...`);

        // Outside transaction, dispatch push and in-app notifications
        for (const item of dueFollowUps) {
            try {
                const recipients = new Set<string>();
                if (item.createdBy && item.createdBy !== "SYSTEM") {
                    recipients.add(item.createdBy);
                }
                if (item.assignedTo && item.assignedTo !== "SYSTEM") {
                    recipients.add(item.assignedTo);
                }

                if (recipients.size === 0) {
                    continue;
                }

                const scheduledTime = dayjs(item.followUpDate).format("DD/MM/YYYY hh:mm A");

                for (const recipientUid of recipients) {
                    await notificationService.send({
                        channel: NOTIFICATION_CHANNEL.PUSH,
                        template: NOTIFICATION_TEMPLATE.FOLLOW_UP_REMINDER,
                        recipient: recipientUid,
                        module: "follow_up",
                        referenceUid: item.leadUid,
                        tenantUid: item.tenantUid,
                        createdBy: item.createdBy || "SYSTEM",
                        variables: {
                            lead_uid: item.leadUid,
                            follow_up_uid: item.uid,
                            customer_name: item.customerName,
                            lead_number: item.leadNumber || "",
                            scheduled_time: scheduledTime,
                            notes: item.notes ? (item.notes.length > 100 ? `${item.notes.substring(0, 100)}...` : item.notes) : "",
                        },
                    });
                }
            } catch (notifyError) {
                logger.error(`[FollowUpReminderService] Failed to dispatch reminder for follow-up ${item.uid}:`, notifyError);
            }
        }

        return dueFollowUps.length;
    }

    startScheduler(intervalMs = 30_000): void {
        if (this.intervalId) {
            return;
        }

        logger.info(`Follow-up reminder scheduler started (polling interval: ${intervalMs}ms).`);

        const tick = async () => {
            if (this.isProcessing) return;
            this.isProcessing = true;
            try {
                await this.processDueFollowUps();
            } catch (err) {
                logger.error("[FollowUpReminderService] Scheduler execution failed:", err);
            } finally {
                this.isProcessing = false;
            }
        };

        // Run initial check shortly after startup
        setTimeout(tick, 3000);
        this.intervalId = setInterval(tick, intervalMs);
    }

    stopScheduler(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            logger.info("Follow-up reminder scheduler stopped.");
        }
    }
}

export const followUpReminderService = new FollowUpReminderService();

export function startFollowUpReminderScheduler(): void {
    followUpReminderService.startScheduler();
}
