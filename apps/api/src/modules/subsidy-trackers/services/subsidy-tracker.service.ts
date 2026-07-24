import type { SubsidyTrackerRepository } from "../repositories/subsidy-tracker.repository.js";
import type { IUpdateSubsidyTracker, IPaginationQuery, IPaginatedResponse, ISubsidyTrackerSafe } from "../interfaces/subsidy-tracker.interface.js";
import { toSubsidyTrackerSafe } from "../dto/subsidy-tracker.dto.js";
import { SUBSIDY_TRACKER_MESSAGES } from "../constants/subsidy-tracker.constants.js";
import { CustomError } from "../../../middlewares/error.middleware.js";
import { AuditLogService } from "../../audit-logs/services/audit-logs.service.js";
import { AUDIT_LOG_ACTIONS } from "../../audit-logs/constants/audit-logs.constants.js";
import type { ProjectSubsidyDocumentRepository } from "../../projects/repositories/project-subsidy-document.repository.js";

export class SubsidyTrackerService {
    private readonly repository: SubsidyTrackerRepository;
    private readonly documentRepository: ProjectSubsidyDocumentRepository;
    private readonly auditLogService: AuditLogService;

    constructor(
        repository: SubsidyTrackerRepository,
        documentRepository: ProjectSubsidyDocumentRepository,
        auditLogService: AuditLogService
    ) {
        this.repository = repository;
        this.documentRepository = documentRepository;
        this.auditLogService = auditLogService;
    }

    async getByUid(tenantUid: string, uid: string) {
        const tracker = await this.repository.getByUid(tenantUid, uid);
        if (!tracker) throw new CustomError(SUBSIDY_TRACKER_MESSAGES.NOT_FOUND, 404);
        
        // Also fetch documents
        const documents = await this.documentRepository.getByProjectUid(tenantUid, tracker.projectUid);
        
        return {
            ...toSubsidyTrackerSafe(tracker),
            documents
        };
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
    
    // Uses the existing project_subsidy_documents table logic since the document belongs to a project.
    async uploadDocument(
        tenantUid: string, 
        uid: string, 
        data: {
            documentTypeUid: string;
            originalName: string;
            fileName: string;
            fileUrl: string;
            mimeType: string;
            fileSize: number;
            remarks?: string;
        }, 
        createdBy: string
    ) {
        const tracker = await this.repository.getByUid(tenantUid, uid);
        if (!tracker) throw new CustomError(SUBSIDY_TRACKER_MESSAGES.NOT_FOUND, 404);
        
        // Use the existing project subsidy document repo to store the doc
        const document = await this.documentRepository.create({
            tenantUid,
            projectUid: tracker.projectUid,
            ...data,
            createdBy
        });

        await this.auditLogService.log({
            tenantUid,
            module: "SubsidyTracker",
            recordUid: tracker.uid,
            action: AUDIT_LOG_ACTIONS.CREATE,
            message: `Document uploaded`,
            createdBy
        });

        return document;
    }
    
    async deleteDocument(tenantUid: string, uid: string, documentUid: string, deletedBy: string) {
        const tracker = await this.repository.getByUid(tenantUid, uid);
        if (!tracker) throw new CustomError(SUBSIDY_TRACKER_MESSAGES.NOT_FOUND, 404);
        
        // This is a soft delete from the project subsidy document repo
        await this.documentRepository.delete(documentUid, tenantUid, deletedBy);

        await this.auditLogService.log({
            tenantUid,
            module: "SubsidyTracker",
            recordUid: tracker.uid,
            action: AUDIT_LOG_ACTIONS.DELETE,
            message: `Document deleted`,
            createdBy: deletedBy
        });
        
        return true;
    }
}
