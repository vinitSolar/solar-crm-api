import { AuditLogRepository } from "../repositories/audit-logs.repository.js";
import type { 
    IAuditLogPayload, 
    IAuditLogUpdatePayload, 
    IAuditLogListRequest,
    IAuditLog
} from "../types/audit-logs.types.js";
import { AUDIT_LOG_ACTIONS } from "../constants/audit-logs.constants.js";
import { logger } from "@packages/logger/index.js";
import _ from "lodash";
const { omit, isEqual, startCase, camelCase } = _;

export class AuditLogService {
    private repository: AuditLogRepository;

    constructor(repository: AuditLogRepository) {
        this.repository = repository;
    }

    /**
     * Log a simple action (CREATE, DELETE, etc.) where the message is already formulated.
     */
    async log(payload: IAuditLogPayload): Promise<IAuditLog> {
        try {
            return await this.repository.create(payload);
        } catch (error) {
            logger.error(`Failed to create audit log for module ${payload.module}`, error);
            throw error; // Or swallow if we don't want audit failures to break main flows
        }
    }

    /**
     * Compare old and new records to generate audit logs for every changed field.
     */
    async logUpdate(payload: IAuditLogUpdatePayload): Promise<void> {
        try {
            const { 
                oldRecord, 
                newRecord, 
                excludeFields = ["updated_at", "updatedAt", "updated_by", "updatedBy"], 
                fieldLabels = {},
                moduleNameLabel = payload.module,
                actionByName = "User" // Or could be passed in payload
            } = payload;

            const changedFields: string[] = [];

            // Get all unique keys from both records
            const allKeys = new Set([...Object.keys(oldRecord), ...Object.keys(newRecord)]);

            const logs: IAuditLogPayload[] = [];

            allKeys.forEach((key) => {
                if (excludeFields.includes(key)) return;
                // Avoid logging sensitive fields completely
                if (key.match(/password|token|otp|secret|hash/i)) return;

                const oldValue = oldRecord[key];
                const newValue = newRecord[key];

                if (!isEqual(oldValue, newValue)) {
                    // Check if it's practically unchanged (e.g., null vs undefined vs empty string)
                    if ((oldValue === null || oldValue === undefined) && (newValue === null || newValue === undefined)) return;

                    const fieldLabel = fieldLabels[key] || startCase(camelCase(key));
                    
                    let oldDisplay = oldValue;
                    let newDisplay = newValue;

                    // Mask confidential if needed or stringify objects
                    if (typeof oldValue === "object" && oldValue !== null) oldDisplay = JSON.stringify(oldValue);
                    if (typeof newValue === "object" && newValue !== null) newDisplay = JSON.stringify(newValue);

                    // Handle empty display values
                    oldDisplay = (oldDisplay === null || oldDisplay === undefined || oldDisplay === "") ? "Empty" : oldDisplay;
                    newDisplay = (newDisplay === null || newDisplay === undefined || newDisplay === "") ? "Empty" : newDisplay;

                    const message = `${actionByName} changed ${fieldLabel} from '${oldDisplay}' to '${newDisplay}'.`;

                    logs.push({
                        tenantUid: payload.tenantUid,
                        module: payload.module,
                        recordUid: payload.recordUid,
                        action: AUDIT_LOG_ACTIONS.UPDATE,
                        message,
                        metadata: {
                            field: key,
                            old: oldValue,
                            new: newValue
                        },
                        ipAddress: payload.ipAddress,
                        userAgent: payload.userAgent,
                        createdBy: payload.createdBy
                    });
                }
            });

            if (logs.length > 0) {
                await this.repository.createMany(logs);
            }
        } catch (error) {
            logger.error(`Failed to calculate and create update audit logs for module ${payload.module}`, error);
        }
    }

    /**
     * Get paginated audit logs
     */
    async getLogs(request: IAuditLogListRequest): Promise<{ logs: IAuditLog[], total: number }> {
        return await this.repository.list(request);
    }
}
