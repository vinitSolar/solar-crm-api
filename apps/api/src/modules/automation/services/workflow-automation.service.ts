import type { Pool, PoolClient } from "pg";
import pool from "@packages/connection.js";
import { logger } from "@packages/logger/index.js";
import { STATUS_EVENTS, SEMANTIC_STATUS } from "../constants/status-events.constants.js";
import { statusEventBus, type IStatusEventPayload } from "./status-event-bus.service.js";

import { AuditLogService } from "../../audit-logs/services/audit-logs.service.js";
import { AuditLogRepository } from "../../audit-logs/repositories/audit-logs.repository.js";
import { AUDIT_LOG_ACTIONS } from "../../audit-logs/constants/audit-logs.constants.js";

import { ProjectRepository } from "../../projects/repositories/project.repository.js";
import { ProjectStatusRepository } from "../../projects/repositories/project-status.repository.js";
import { ProjectInstallationMilestoneRepository } from "../../projects/repositories/project-installation-milestone.repository.js";
import { SubsidyTrackerRepository } from "../../subsidy-trackers/repositories/subsidy-tracker.repository.js";

import { QuotationRepository } from "../../quotations/repositories/quotation.repository.js";
import { LeadRepository } from "../../leads/repositories/lead.repository.js";
import { LeadStatusRepository } from "../../leads/repositories/lead-status.repository.js";

import { notificationService, NOTIFICATION_CHANNEL, NOTIFICATION_TEMPLATE } from "../../notification/index.js";
import { WorkflowAutomationRuleRepository } from "../repositories/workflow-automation-rule.repository.js";

export class WorkflowAutomationService {
    private readonly pool: Pool;
    private readonly auditLogService: AuditLogService;
    private readonly projectRepository: ProjectRepository;
    private readonly projectStatusRepository: ProjectStatusRepository;
    private readonly milestoneRepository: ProjectInstallationMilestoneRepository;
    private readonly subsidyTrackerRepository: SubsidyTrackerRepository;
    private readonly quotationRepository: QuotationRepository;
    private readonly leadRepository: LeadRepository;
    private readonly leadStatusRepository: LeadStatusRepository;
    private readonly ruleRepository: WorkflowAutomationRuleRepository;

    constructor(dbPool: Pool = pool) {
        this.pool = dbPool;
        this.auditLogService = new AuditLogService(new AuditLogRepository(dbPool));
        this.projectRepository = new ProjectRepository(dbPool);
        this.projectStatusRepository = new ProjectStatusRepository(dbPool);
        this.milestoneRepository = new ProjectInstallationMilestoneRepository(dbPool);
        this.subsidyTrackerRepository = new SubsidyTrackerRepository(dbPool);
        this.quotationRepository = new QuotationRepository();
        this.leadRepository = new LeadRepository(dbPool);
        this.leadStatusRepository = new LeadStatusRepository(dbPool);
        this.ruleRepository = new WorkflowAutomationRuleRepository(dbPool);

        this.registerEventListeners();
    }

    /**
     * Check if a specific automation rule is enabled for the tenant.
     * Defaults to true if no rule record found (backward compatible).
     */
    private async isRuleEnabled(tenantUid: string, ruleKey: string): Promise<boolean> {
        return this.ruleRepository.isRuleEnabled(tenantUid, ruleKey);
    }

    /**
     * Bind listeners to the domain event bus
     */
    private registerEventListeners(): void {
        statusEventBus.on(STATUS_EVENTS.FOLLOWUP_SCHEDULED, async (payload: IStatusEventPayload) => {
            try {
                await this.onFollowUpScheduled(payload.tenantUid, payload.entityUid, payload.actorUid);
            } catch (err) {
                logger.error("[WorkflowAutomation] Error in FOLLOWUP_SCHEDULED handler", { err });
            }
        });

        statusEventBus.on(STATUS_EVENTS.SURVEY_COMPLETED, async (payload: IStatusEventPayload) => {
            try {
                await this.onSiteSurveyCompleted(payload.tenantUid, payload.entityUid, payload.actorUid);
            } catch (err) {
                logger.error("[WorkflowAutomation] Error in SURVEY_COMPLETED handler", { err });
            }
        });

        statusEventBus.on(STATUS_EVENTS.QUOTATION_SENT, async (payload: IStatusEventPayload) => {
            try {
                await this.onQuotationSent(payload.tenantUid, payload.entityUid, payload.actorUid);
            } catch (err) {
                logger.error("[WorkflowAutomation] Error in QUOTATION_SENT handler", { err });
            }
        });

        statusEventBus.on(STATUS_EVENTS.QUOTATION_APPROVED, async (payload: IStatusEventPayload) => {
            try {
                await this.onQuotationApproved(payload.tenantUid, payload.entityUid, payload.actorUid);
            } catch (err) {
                logger.error("[WorkflowAutomation] Error in QUOTATION_APPROVED handler", { err });
            }
        });

        statusEventBus.on(STATUS_EVENTS.MILESTONE_UPDATED, async (payload: IStatusEventPayload) => {
            try {
                await this.onMilestoneCompleted(payload.tenantUid, payload.entityUid, payload.metadata?.milestoneUid, payload.actorUid);
            } catch (err) {
                logger.error("[WorkflowAutomation] Error in MILESTONE_UPDATED handler", { err });
            }
        });

        statusEventBus.on(STATUS_EVENTS.PAYMENT_RECEIVED, async (payload: IStatusEventPayload) => {
            try {
                await this.onPaymentReceived(payload.tenantUid, payload.entityUid, payload.actorUid, payload.metadata);
            } catch (err) {
                logger.error("[WorkflowAutomation] Error in PAYMENT_RECEIVED handler", { err });
            }
        });
    }

    // =========================================================================
    // RESOLVERS (Decouple hardcoded status IDs)
    // =========================================================================

    /**
     * Resolves matching lead status UID by semantic intent or fuzzy name
     */
    async resolveLeadStatus(tenantUid: string, semantic: keyof typeof SEMANTIC_STATUS.LEAD, client?: PoolClient): Promise<{ uid: string; name: string; color?: string | null } | null> {
        const executor = client || this.pool;

        let query = "";
        const values: any[] = [tenantUid];

        switch (semantic) {
            case "SURVEY_COMPLETED":
                query = `
                    SELECT uid, name, color FROM lead_statuses 
                    WHERE tenant_uid = $1 AND is_deleted = 0 
                      AND (name ILIKE '%survey%' OR name ILIKE '%feasible%' OR name ILIKE '%feasibility%')
                    ORDER BY sort_order ASC LIMIT 1
                `;
                break;
            case "QUOTATION_SENT":
                query = `
                    SELECT uid, name, color FROM lead_statuses 
                    WHERE tenant_uid = $1 AND is_deleted = 0 
                      AND (name ILIKE '%quotation sent%' OR name ILIKE '%quote sent%' OR name ILIKE '%proposal%')
                    ORDER BY sort_order ASC LIMIT 1
                `;
                break;
            case "WON":
                query = `
                    SELECT uid, name, color FROM lead_statuses 
                    WHERE tenant_uid = $1 AND is_deleted = 0 
                      AND ((is_closed = 1 AND is_draft = 0 AND name ILIKE '%won%') OR name ILIKE '%won%')
                    ORDER BY sort_order ASC LIMIT 1
                `;
                break;
            case "FOLLOW_UP":
                query = `
                    SELECT uid, name, color FROM lead_statuses 
                    WHERE tenant_uid = $1 AND is_deleted = 0 
                      AND (name ILIKE '%follow up%' OR name ILIKE '%follow-up%' OR name ILIKE '%contacted%')
                    ORDER BY sort_order ASC LIMIT 1
                `;
                break;
            case "CONTACTED":
                query = `
                    SELECT uid, name, color FROM lead_statuses 
                    WHERE tenant_uid = $1 AND is_deleted = 0 AND name ILIKE '%contacted%'
                    ORDER BY sort_order ASC LIMIT 1
                `;
                break;
            default:
                return null;
        }

        const res = await executor.query(query, values);
        if (res.rows.length > 0 && res.rows[0]) {
            return { uid: res.rows[0].uid, name: res.rows[0].name, color: res.rows[0].color || null };
        }
        return null;
    }

    /**
     * Resolves matching project status UID by semantic intent or fuzzy name
     */
    async resolveProjectStatus(tenantUid: string, semantic: keyof typeof SEMANTIC_STATUS.PROJECT, client?: PoolClient): Promise<{ uid: string; name: string; color?: string | null } | null> {
        const executor = client || this.pool;

        let query = "";
        const values: any[] = [tenantUid];

        switch (semantic) {
            case "IN_PROGRESS":
                query = `
                    SELECT uid, name, color FROM project_statuses 
                    WHERE tenant_uid = $1::uuid AND is_deleted = 0 
                      AND (name ILIKE '%in progress%' OR name ILIKE '%progress%')
                    ORDER BY sort_order ASC LIMIT 1
                `;
                break;
            case "COMMISSIONED":
                query = `
                    SELECT uid, name, color FROM project_statuses 
                    WHERE tenant_uid = $1::uuid AND is_deleted = 0 
                      AND (name ILIKE '%commissioned%' OR name ILIKE '%complete%' OR (is_closed = 1 AND name NOT ILIKE '%cancel%' AND name NOT ILIKE '%hold%'))
                    ORDER BY sort_order ASC LIMIT 1
                `;
                break;
            case "NOT_STARTED":
                query = `
                    SELECT uid, name, color FROM project_statuses 
                    WHERE tenant_uid = $1::uuid AND is_deleted = 0 
                      AND (is_default = 1 OR name ILIKE '%not started%')
                    ORDER BY sort_order ASC LIMIT 1
                `;
                break;
            default:
                return null;
        }

        const res = await executor.query(query, values);
        if (res.rows.length > 0 && res.rows[0]) {
            return { uid: res.rows[0].uid, name: res.rows[0].name, color: res.rows[0].color || null };
        }
        return null;
    }

    // =========================================================================
    // EVENT HANDLERS
    // =========================================================================

    /**
     * 1. When a follow-up is scheduled on a lead:
     * If the lead is currently in 'New' status, automatically advance to 'Follow Up' / 'Contacted'.
     */
    async onFollowUpScheduled(tenantUid: string, leadUid: string, actorUid: string): Promise<void> {
        if (!await this.isRuleEnabled(tenantUid, "FOLLOWUP_TO_CONTACTED")) return;

        const lead = await this.leadRepository.getByUid(tenantUid, leadUid);
        if (!lead || !lead.statusUid) return;

        const currentStatus = await this.leadStatusRepository.getByUid(tenantUid, lead.statusUid);
        if (!currentStatus) return;

        // Only transition if the lead is currently New or Draft
        const isNew = currentStatus.isDefault === 1 || currentStatus.name.toLowerCase().includes("new");
        if (!isNew) return;

        const targetStatus = await this.resolveLeadStatus(tenantUid, "FOLLOW_UP");
        if (!targetStatus || targetStatus.uid === currentStatus.uid) return;

        await this.pool.query(
            `UPDATE leads SET status_uid = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2 WHERE tenant_uid = $3 AND uid = $4`,
            [targetStatus.uid, actorUid, tenantUid, leadUid]
        );

        logger.info(`[WorkflowAutomation] Lead ${leadUid} auto-advanced to '${targetStatus.name}' via Follow-up.`);

        await this.auditLogService.log({
            tenantUid,
            module: "Lead",
            recordUid: leadUid,
            action: AUDIT_LOG_ACTIONS.UPDATE,
            message: `Lead status automatically updated from '${currentStatus.name}' to '${targetStatus.name}' upon scheduling a follow-up.`,
            createdBy: actorUid || "SYSTEM"
        });
    }

    /**
     * 2. When a site survey is completed:
     * Auto-advance parent lead to 'Site Survey Completed' if it exists.
     */
    async onSiteSurveyCompleted(tenantUid: string, surveyUid: string, actorUid: string): Promise<void> {
        if (!await this.isRuleEnabled(tenantUid, "SURVEY_TO_LEAD_STATUS")) return;

        const surveyRes = await this.pool.query(
            `SELECT lead_uid, status FROM site_surveys WHERE tenant_uid = $1 AND uid = $2`,
            [tenantUid, surveyUid]
        );
        if (surveyRes.rows.length === 0 || !surveyRes.rows[0]?.lead_uid) return;

        const leadUid = surveyRes.rows[0].lead_uid;
        const lead = await this.leadRepository.getByUid(tenantUid, leadUid);
        if (!lead || !lead.statusUid) return;

        const currentStatus = await this.leadStatusRepository.getByUid(tenantUid, lead.statusUid);
        if (!currentStatus || currentStatus.isClosed === 1) return; // Do not touch Won or Lost leads

        // If tenant has a dedicated "Site Survey Completed" status
        const targetStatus = await this.resolveLeadStatus(tenantUid, "SURVEY_COMPLETED");
        if (!targetStatus || targetStatus.uid === currentStatus.uid) return;

        await this.pool.query(
            `UPDATE leads SET status_uid = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2 WHERE tenant_uid = $3 AND uid = $4`,
            [targetStatus.uid, actorUid, tenantUid, leadUid]
        );

        logger.info(`[WorkflowAutomation] Lead ${leadUid} auto-advanced to '${targetStatus.name}' via Survey Completion.`);

        await this.auditLogService.log({
            tenantUid,
            module: "Lead",
            recordUid: leadUid,
            action: AUDIT_LOG_ACTIONS.UPDATE,
            message: `Lead status automatically updated to '${targetStatus.name}' following site survey completion.`,
            createdBy: actorUid || "SYSTEM"
        });

        if (lead.assignedTo) {
            notificationService.send({
                channel: NOTIFICATION_CHANNEL.PUSH,
                template: NOTIFICATION_TEMPLATE.LEAD_STATUS_CHANGED,
                recipient: lead.assignedTo,
                module: "lead",
                referenceUid: lead.uid,
                tenantUid,
                createdBy: actorUid || "SYSTEM",
                variables: {
                    statusName: targetStatus.name,
                    leadName: `${lead.firstName || ""} ${lead.lastName || ""}`.trim(),
                }
            }).catch(err => {
                logger.error("[WorkflowAutomation] Failed to send push notification on survey complete:", err);
            });
        }
    }

    /**
     * 3. When a quotation is created and dispatched:
     * Auto-advance lead status to 'Quotation Sent'.
     */
    async onQuotationSent(tenantUid: string, quotationUid: string, actorUid: string): Promise<void> {
        if (!await this.isRuleEnabled(tenantUid, "QUOTE_TO_LEAD_STATUS")) return;

        const quote = await this.quotationRepository.findByUid(tenantUid, quotationUid);
        if (!quote || !quote.leadUid) return;

        const lead = await this.leadRepository.getByUid(tenantUid, quote.leadUid);
        if (!lead || !lead.statusUid) return;

        const currentStatus = await this.leadStatusRepository.getByUid(tenantUid, lead.statusUid);
        if (!currentStatus || currentStatus.isClosed === 1) return; // Do not alter Won/Lost

        const targetStatus = await this.resolveLeadStatus(tenantUid, "QUOTATION_SENT");
        if (!targetStatus || targetStatus.uid === currentStatus.uid) return;

        await this.pool.query(
            `UPDATE leads SET status_uid = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2 WHERE tenant_uid = $3 AND uid = $4`,
            [targetStatus.uid, actorUid, tenantUid, lead.uid]
        );

        logger.info(`[WorkflowAutomation] Lead ${lead.uid} auto-advanced to '${targetStatus.name}' via Quotation Sent.`);

        await this.auditLogService.log({
            tenantUid,
            module: "Lead",
            recordUid: lead.uid,
            action: AUDIT_LOG_ACTIONS.UPDATE,
            message: `Lead status automatically updated to '${targetStatus.name}' upon sending quotation ${quote.quotationNumber}.`,
            createdBy: actorUid || "SYSTEM"
        });
    }

    /**
     * 4. When a quotation is approved (status = 2 or 4):
     * - Auto-advance Lead status to 'Won'
     * - Auto-create Project with 6 Milestones & Subsidy Tracker
     */
    async onQuotationApproved(tenantUid: string, quotationUid: string, actorUid: string): Promise<{ projectUid?: string }> {
        const quote = await this.quotationRepository.findByUid(tenantUid, quotationUid);
        if (!quote || !quote.leadUid) return {};

        const lead = await this.leadRepository.getByUid(tenantUid, quote.leadUid);
        if (!lead) return {};

        // 1. Advance Lead to Won (if enabled)
        const advanceToWon = await this.isRuleEnabled(tenantUid, "APPROVAL_TO_WON");
        if (advanceToWon) {
            const wonStatus = await this.resolveLeadStatus(tenantUid, "WON");
            if (wonStatus && lead.statusUid !== wonStatus.uid) {
                await this.pool.query(
                    `UPDATE leads SET status_uid = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2 WHERE tenant_uid = $3 AND uid = $4`,
                    [wonStatus.uid, actorUid, tenantUid, lead.uid]
                );

                await this.auditLogService.log({
                    tenantUid,
                    module: "Lead",
                    recordUid: lead.uid,
                    action: AUDIT_LOG_ACTIONS.UPDATE,
                    message: `Lead status automatically advanced to '${wonStatus.name}' after Quotation ${quote.quotationNumber} approval.`,
                    createdBy: actorUid || "SYSTEM"
                });
            }
        }

        // Check if auto-project creation is enabled
        const autoCreateProj = await this.isRuleEnabled(tenantUid, "APPROVAL_TO_PROJECT");
        if (!autoCreateProj) {
            return {};
        }

        // 2. Check if active project already exists
        const existingProject = await this.projectRepository.getActiveProjectByQuotationUid(tenantUid, quotationUid);
        if (existingProject) {
            return { projectUid: existingProject.uid };
        }

        // 3. Resolve default project status
        let defaultStatus = await this.projectStatusRepository.getDefault(tenantUid);
        if (!defaultStatus) {
            const activeStatuses = await this.projectStatusRepository.getAll(tenantUid, "active");
            if (activeStatuses.length > 0 && activeStatuses[0]) {
                defaultStatus = activeStatuses[0];
            }
        }
        if (!defaultStatus) {
            logger.warn(`[WorkflowAutomation] Cannot auto-create project: No default project status for tenant ${tenantUid}`);
            return {};
        }

        // 4. Generate Project Details
        const projectNumber = await this.projectRepository.generateProjectNumber(tenantUid);
        const firstName = lead.firstName ? lead.firstName.trim() : "Customer";
        const lastName = lead.lastName ? ` ${lead.lastName.trim()}` : "";
        const fullName = `${firstName}${lastName}`;
        const systemSize = lead.systemSize || "0";
        const projectName = `${fullName} - ${systemSize}kW - ${projectNumber}`;

        const project = await this.projectRepository.create(
            tenantUid,
            {
                quotationUid,
                leadUid: lead.uid,
                projectName,
                statusUid: defaultStatus.uid,
                projectNumber,
                projectDate: new Date()
            },
            actorUid
        );

        // Seed 6 milestones from templates
        await this.milestoneRepository.bulkInsertFromTemplates(tenantUid, project.uid, actorUid);

        // Auto-create Subsidy Tracker
        await this.subsidyTrackerRepository.create(tenantUid, {
            projectUid: project.uid,
            leadUid: project.leadUid,
            name: project.projectName,
        }, actorUid);

        // Update quotation status to 4 (Converted)
        const client = await this.quotationRepository.getPoolClient();
        try {
            await this.quotationRepository.update(client, tenantUid, quotationUid, { status: 4 }, actorUid);
        } finally {
            client.release();
        }

        await this.auditLogService.log({
            tenantUid,
            module: "Project",
            recordUid: project.uid,
            action: AUDIT_LOG_ACTIONS.CREATE,
            message: `Project ${project.projectNumber} automatically created and initialized from approved quotation ${quote.quotationNumber}.`,
            createdBy: actorUid || "SYSTEM"
        });

        logger.info(`[WorkflowAutomation] Project ${project.uid} (${project.projectNumber}) auto-created from quotation ${quotationUid}`);
        return { projectUid: project.uid };
    }

    /**
     * 5. When a milestone status is updated:
     * Check if ALL milestones for the project are now completed (status = 2).
     * If so, auto-advance the Project to 'Commissioned' and record actualEndDate.
     */
    async onMilestoneCompleted(tenantUid: string, projectUid: string, milestoneUid: string | undefined, actorUid: string): Promise<void> {
        if (!await this.isRuleEnabled(tenantUid, "MILESTONES_TO_COMMISSIONED")) return;

        const statsRes = await this.pool.query(
            `SELECT 
                COUNT(*) as total, 
                COUNT(*) FILTER (WHERE status = 2) as completed 
             FROM project_installation_milestones 
             WHERE tenant_uid = $1 AND project_uid = $2 AND is_deleted = 0`,
            [tenantUid, projectUid]
        );

        const row = statsRes.rows[0];
        if (!row) return;

        const total = Number(row.total || 0);
        const completed = Number(row.completed || 0);

        if (total > 0 && total === completed) {
            // All milestones completed! Advance project to Commissioned
            const commissionedStatus = await this.resolveProjectStatus(tenantUid, "COMMISSIONED");
            if (!commissionedStatus) return;

            const project = await this.projectRepository.getByUid(tenantUid, projectUid);
            if (!project || project.projectStatusUid === commissionedStatus.uid) return;

            await this.pool.query(
                `UPDATE projects 
                 SET project_status_uid = $1::uuid, updated_at = CURRENT_TIMESTAMP, updated_by = $2 
                 WHERE tenant_uid = $3::uuid AND uid = $4::uuid`,
                [commissionedStatus.uid, actorUid, tenantUid, projectUid]
            );

            logger.info(`[WorkflowAutomation] Project ${projectUid} auto-advanced to '${commissionedStatus.name}' as all milestones are complete.`);

            await this.auditLogService.log({
                tenantUid,
                module: "Project",
                recordUid: projectUid,
                action: AUDIT_LOG_ACTIONS.UPDATE,
                message: `Project status automatically advanced to '${commissionedStatus.name}' as all ${total} installation milestones were completed.`,
                createdBy: actorUid || "SYSTEM"
            });
        }
    }

    /**
     * 6. When a payment is recorded against a project or lead:
     * If the project is still in 'Not Started', advance to 'In Progress'.
     */
    async onPaymentReceived(tenantUid: string, entityUid: string, actorUid: string, metadata?: Record<string, any>): Promise<void> {
        if (!await this.isRuleEnabled(tenantUid, "PAYMENT_TO_IN_PROGRESS")) return;

        let projectUid = entityUid;
        if (metadata?.leadUid) {
            const res = await this.pool.query(
                `SELECT uid FROM projects WHERE tenant_uid = $1::uuid AND lead_uid = $2::uuid AND is_deleted = 0 ORDER BY created_at DESC LIMIT 1`,
                [tenantUid, metadata.leadUid]
            );
            if (res.rows.length > 0 && res.rows[0]?.uid) {
                projectUid = res.rows[0].uid;
            } else {
                return;
            }
        }

        const project = await this.projectRepository.getByUid(tenantUid, projectUid);
        if (!project || !project.projectStatusUid) return;

        const currentStatus = await this.projectStatusRepository.getByUid(tenantUid, project.projectStatusUid);
        if (!currentStatus) return;

        const isNotStarted = currentStatus.isDefault === 1 || currentStatus.name.toLowerCase().includes("not started");
        if (!isNotStarted) return;

        const inProgressStatus = await this.resolveProjectStatus(tenantUid, "IN_PROGRESS");
        if (!inProgressStatus || inProgressStatus.uid === currentStatus.uid) return;

        await this.pool.query(
            `UPDATE projects 
             SET project_status_uid = $1::uuid, updated_at = CURRENT_TIMESTAMP, updated_by = $2 
             WHERE tenant_uid = $3::uuid AND uid = $4::uuid`,
            [inProgressStatus.uid, actorUid, tenantUid, projectUid]
        );

        logger.info(`[WorkflowAutomation] Project ${projectUid} auto-advanced to '${inProgressStatus.name}' upon payment reception.`);

        await this.auditLogService.log({
            tenantUid,
            module: "Project",
            recordUid: projectUid,
            action: AUDIT_LOG_ACTIONS.UPDATE,
            message: `Project status automatically advanced to '${inProgressStatus.name}' upon payment reception.`,
            createdBy: actorUid || "SYSTEM"
        });
    }
}

export const workflowAutomationService = new WorkflowAutomationService();
