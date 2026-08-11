import type { SubsidyTrackerRepository } from "../repositories/subsidy-tracker.repository.js";
import type { IUpdateSubsidyTracker, IPaginationQuery, IPaginatedResponse, ISubsidyTrackerSafe } from "../interfaces/subsidy-tracker.interface.js";
import { toSubsidyTrackerSafe } from "../dto/subsidy-tracker.dto.js";
import { SUBSIDY_TRACKER_MESSAGES } from "../constants/subsidy-tracker.constants.js";
import { CustomError } from "../../../middlewares/error.middleware.js";
import { AuditLogService } from "../../audit-logs/services/audit-logs.service.js";
import { AUDIT_LOG_ACTIONS } from "../../audit-logs/constants/audit-logs.constants.js";
export class SubsidyTrackerService {
    private readonly repository: SubsidyTrackerRepository;
    private readonly auditLogService: AuditLogService;

    constructor(
        repository: SubsidyTrackerRepository,
        auditLogService: AuditLogService
    ) {
        this.repository = repository;
        this.auditLogService = auditLogService;
    }

    async getByUid(tenantUid: string, uid: string) {
        const tracker = await this.repository.getByUid(tenantUid, uid);
        if (!tracker) throw new CustomError(SUBSIDY_TRACKER_MESSAGES.NOT_FOUND, 404);
        
        return toSubsidyTrackerSafe(tracker);
    }

    async listPaginated(tenantUid: string, queryParams: IPaginationQuery) {
        return await this.repository.listPaginated(tenantUid, queryParams);
    }

    async update(tenantUid: string, uid: string, data: IUpdateSubsidyTracker, updatedBy: string): Promise<ISubsidyTrackerSafe> {
        const existing = await this.repository.getByUid(tenantUid, uid);
        if (!existing) throw new CustomError(SUBSIDY_TRACKER_MESSAGES.NOT_FOUND, 404);

        const updated = await this.repository.update(tenantUid, uid, data, updatedBy);
        if (!updated) throw new CustomError(SUBSIDY_TRACKER_MESSAGES.NOT_FOUND, 404);

        const auditMessages = [];
        if (data.portalStatus !== undefined && data.portalStatus !== existing.portalStatus) {
            auditMessages.push(`Portal Status updated to ${data.portalStatus}`);
        }
        if (data.netMeterStatus !== undefined && data.netMeterStatus !== existing.netMeterStatus) {
            auditMessages.push(`Net Meter Status updated to ${data.netMeterStatus}`);
        }
        if (data.portalReferenceNumber && data.portalReferenceNumber !== existing.portalReferenceNumber) {
            auditMessages.push(`Portal Reference Number updated`);
        }
        if (data.discomReferenceNumber && data.discomReferenceNumber !== existing.discomReferenceNumber) {
            auditMessages.push(`DISCOM Reference Number updated`);
        }
        if (data.approvedSubsidyAmount !== undefined || data.receivedSubsidyAmount !== undefined) {
            auditMessages.push(`Financials updated`);
        }

        if (auditMessages.length > 0) {
            await this.auditLogService.log({
                tenantUid,
                module: "SubsidyTracker",
                recordUid: updated.uid,
                action: AUDIT_LOG_ACTIONS.UPDATE,
                message: auditMessages.join(", "),
                createdBy: updatedBy
            });
        }

        return toSubsidyTrackerSafe(updated);
    }
}
