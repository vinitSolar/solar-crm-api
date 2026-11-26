import { Router, type Request, type Response } from "express";
import pool from "@packages/connection.js";
import { WorkflowAutomationRuleRepository } from "../repositories/workflow-automation-rule.repository.js";
import { workflowAutomationService } from "../services/workflow-automation.service.js";
import { authenticate } from "../../auth/middleware/auth.middleware.js";
import { logger } from "@packages/logger/index.js";

function createAutomationRouter(): Router {
    const router = Router();
    const ruleRepo = new WorkflowAutomationRuleRepository(pool);

    /**
     * GET /automation/settings
     * Returns all automation rules for the authenticated tenant with live status mappings
     */
    router.get("/settings", authenticate, async (req: Request, res: Response) => {
        try {
            const tenantUid = (req as any).user?.tenantUid;
            if (!tenantUid) {
                res.status(401).json({ success: false, message: "Unauthorized" });
                return;
            }

            const rules = await ruleRepo.getAllByTenant(tenantUid);

            const enrichedRules = await Promise.all(rules.map(async (r) => {
                let module = "Lead";
                let trigger = "";
                let fromStatuses: string[] = [];
                let targetStatus: { name: string; color: string } = { name: "Default", color: "#10B981" };

                switch (r.ruleKey) {
                    case "FOLLOWUP_TO_CONTACTED":
                        module = "Lead";
                        trigger = "First callback scheduled";
                        fromStatuses = ["New", "Draft"];
                        const fStatus = await workflowAutomationService.resolveLeadStatus(tenantUid, "FOLLOW_UP");
                        targetStatus = { name: fStatus?.name || "Follow Up", color: fStatus?.color || "#8B5CF6" };
                        break;
                    case "SURVEY_TO_LEAD_STATUS":
                        module = "Lead";
                        trigger = "Roof feasibility submitted";
                        fromStatuses = ["Draft", "New", "Contacted", "Follow Up"];
                        const sStatus = await workflowAutomationService.resolveLeadStatus(tenantUid, "SURVEY_COMPLETED");
                        targetStatus = { name: sStatus?.name || "Site Survey Completed", color: sStatus?.color || "#06B6D4" };
                        break;
                    case "QUOTE_TO_LEAD_STATUS":
                        module = "Lead";
                        trigger = "Quotation PDF generated & dispatched";
                        fromStatuses = ["Draft", "New", "Contacted", "Follow Up", "Survey Done"];
                        const qStatus = await workflowAutomationService.resolveLeadStatus(tenantUid, "QUOTATION_SENT");
                        targetStatus = { name: qStatus?.name || "Quotation Sent", color: qStatus?.color || "#0284C7" };
                        break;
                    case "APPROVAL_TO_WON":
                        module = "Lead";
                        trigger = "Quotation accepted / approved";
                        fromStatuses = ["Quotation Sent", "Negotiation", "Contacted"];
                        const wStatus = await workflowAutomationService.resolveLeadStatus(tenantUid, "WON");
                        targetStatus = { name: wStatus?.name || "Won", color: wStatus?.color || "#10B981" };
                        break;
                    case "APPROVAL_TO_PROJECT":
                        module = "Project";
                        trigger = "Quotation accepted / approved";
                        fromStatuses = ["Won Lead"];
                        const pStartStatus = await workflowAutomationService.resolveProjectStatus(tenantUid, "NOT_STARTED");
                        targetStatus = { name: `Project Initialized (${pStartStatus?.name || "Not Started"})`, color: pStartStatus?.color || "#9CA3AF" };
                        break;
                    case "PAYMENT_TO_IN_PROGRESS":
                        module = "Project";
                        trigger = "Advance / booking payment logged";
                        fromStatuses = ["Not Started"];
                        const ipStatus = await workflowAutomationService.resolveProjectStatus(tenantUid, "IN_PROGRESS");
                        targetStatus = { name: ipStatus?.name || "In Progress", color: ipStatus?.color || "#3B82F6" };
                        break;
                    case "MILESTONES_TO_COMMISSIONED":
                        module = "Project";
                        trigger = "All 6 milestones approved";
                        fromStatuses = ["In Progress"];
                        const cStatus = await workflowAutomationService.resolveProjectStatus(tenantUid, "COMMISSIONED");
                        targetStatus = { name: cStatus?.name || "Completed", color: cStatus?.color || "#10B981" };
                        break;
                }

                return {
                    uid: r.uid,
                    ruleKey: r.ruleKey,
                    ruleName: r.ruleName,
                    description: r.description,
                    isEnabled: r.isEnabled === 1,
                    sortOrder: r.sortOrder,
                    module,
                    trigger,
                    fromStatuses,
                    targetStatus,
                };
            }));

            res.json({
                success: true,
                data: enrichedRules
            });
        } catch (error) {
            logger.error("Failed to fetch automation settings", { error });
            res.status(500).json({ success: false, message: "Failed to fetch automation settings" });
        }
    });

    /**
     * PUT /automation/settings
     * Toggle one or more automation rules
     * Body: { rules: [{ ruleKey: "FOLLOWUP_TO_CONTACTED", isEnabled: true }, ...] }
     */
    router.put("/settings", authenticate, async (req: Request, res: Response) => {
        try {
            const tenantUid = (req as any).user?.tenantUid;
            const userUid = (req as any).user?.uid;
            if (!tenantUid || !userUid) {
                res.status(401).json({ success: false, message: "Unauthorized" });
                return;
            }

            const { rules } = req.body;
            if (!Array.isArray(rules) || rules.length === 0) {
                res.status(400).json({ success: false, message: "Please provide an array of rules to update." });
                return;
            }

            const updated = await ruleRepo.bulkToggle(tenantUid, rules, userUid);

            res.json({
                success: true,
                message: `${updated.length} automation rule(s) updated.`,
                data: updated.map(r => ({
                    uid: r.uid,
                    ruleKey: r.ruleKey,
                    ruleName: r.ruleName,
                    isEnabled: r.isEnabled === 1,
                }))
            });
        } catch (error) {
            logger.error("Failed to update automation settings", { error });
            res.status(500).json({ success: false, message: "Failed to update automation settings" });
        }
    });

    /**
     * GET /automation/lead-pipeline/:leadUid
     * Returns the current pipeline stage data for a specific lead
     */
    router.get("/lead-pipeline/:leadUid", authenticate, async (req: Request, res: Response) => {
        try {
            const tenantUid = (req as any).user?.tenantUid;
            if (!tenantUid) {
                res.status(401).json({ success: false, message: "Unauthorized" });
                return;
            }

            const { leadUid } = req.params;

            // Fetch lead with current status details
            const leadRes = await pool.query(
                `SELECT l.uid, l.first_name, l.last_name, l.status_uid,
                        ls.name AS "statusName", ls.sort_order AS "statusSortOrder", ls.is_closed AS "statusIsClosed", ls.is_draft AS "statusIsDraft",
                        l.is_follow_up AS "isFollowUp",
                        l.follow_up_date AS "followUpDate"
                 FROM leads l
                 LEFT JOIN lead_statuses ls ON l.status_uid = ls.uid
                 WHERE l.tenant_uid = $1 AND l.uid = $2 AND l.is_deleted = 0`,
                [tenantUid, leadUid]
            );

            if (leadRes.rows.length === 0) {
                res.status(404).json({ success: false, message: "Lead not found" });
                return;
            }

            const lead = leadRes.rows[0];

            // Fetch survey status for this lead
            const surveyRes = await pool.query(
                `SELECT uid, status FROM site_surveys 
                 WHERE tenant_uid = $1 AND lead_uid = $2 AND is_deleted = 0 
                 ORDER BY created_at DESC LIMIT 1`,
                [tenantUid, leadUid]
            );

            // Fetch latest quotation for this lead
            const quoteRes = await pool.query(
                `SELECT uid, status, quotation_number AS "quotationNumber"
                 FROM quotations 
                 WHERE tenant_uid = $1 AND lead_uid = $2 AND is_deleted = 0 
                 ORDER BY created_at DESC LIMIT 1`,
                [tenantUid, leadUid]
            );

            // Fetch project linked to this lead
            const projectRes = await pool.query(
                `SELECT p.uid, p.project_number AS "projectNumber", p.project_status_uid AS "projectStatusUid",
                        ps.name AS "statusName", ps.is_closed AS "statusIsClosed"
                 FROM projects p
                 LEFT JOIN project_statuses ps ON p.project_status_uid = ps.uid
                 WHERE p.tenant_uid = $1::uuid AND p.lead_uid = $2 AND p.is_deleted = 0
                 ORDER BY p.created_at DESC LIMIT 1`,
                [tenantUid, leadUid]
            );

            // Fetch milestone progress if project exists
            let milestoneProgress = null;
            if (projectRes.rows.length > 0) {
                const projectUid = projectRes.rows[0].uid;
                const msRes = await pool.query(
                    `SELECT 
                        COUNT(*) AS total,
                        COUNT(*) FILTER (WHERE status = 2) AS completed,
                        COUNT(*) FILTER (WHERE status = 1) AS "inProgress"
                     FROM project_installation_milestones 
                     WHERE tenant_uid = $1 AND project_uid = $2 AND is_deleted = 0`,
                    [tenantUid, projectUid]
                );
                if (msRes.rows[0]) {
                    milestoneProgress = {
                        total: Number(msRes.rows[0].total),
                        completed: Number(msRes.rows[0].completed),
                        inProgress: Number(msRes.rows[0].inProgress),
                    };
                }
            }

            // Build pipeline stages
            const survey = surveyRes.rows[0] || null;
            const quotation = quoteRes.rows[0] || null;
            const project = projectRes.rows[0] || null;

            const stages = [
                {
                    key: "new",
                    label: "New Lead",
                    completed: true, // Lead always exists at this point
                    active: lead.statusSortOrder <= 1 && !lead.statusIsClosed,
                },
                {
                    key: "followup",
                    label: "Follow Up",
                    completed: lead.isFollowUp === 1 || lead.statusSortOrder >= 2,
                    active: (lead.statusName || "").toLowerCase().includes("follow") || (lead.statusName || "").toLowerCase().includes("contacted"),
                },
                {
                    key: "survey",
                    label: "Site Survey",
                    completed: survey?.status === 1 || lead.statusSortOrder >= 3,
                    active: survey?.status === 0,
                    surveyUid: survey?.uid || null,
                },
                {
                    key: "quotation",
                    label: "Quotation",
                    completed: quotation !== null && (quotation.status >= 1),
                    active: quotation?.status === 0,
                    quotationUid: quotation?.uid || null,
                    quotationNumber: quotation?.quotationNumber || null,
                },
                {
                    key: "won",
                    label: "Won",
                    completed: lead.statusIsClosed === 1 && (lead.statusName || "").toLowerCase().includes("won"),
                    active: (lead.statusName || "").toLowerCase().includes("negotiation"),
                },
                {
                    key: "project",
                    label: "Project",
                    completed: project !== null,
                    active: project !== null && !project.statusIsClosed,
                    projectUid: project?.uid || null,
                    projectNumber: project?.projectNumber || null,
                    projectStatus: project?.statusName || null,
                    milestoneProgress,
                },
                {
                    key: "commissioned",
                    label: "Completed",
                    completed: project?.statusIsClosed === 1,
                    active: false,
                },
            ];

            res.json({
                success: true,
                data: {
                    leadUid,
                    currentStatus: lead.statusName,
                    stages,
                }
            });
        } catch (error) {
            logger.error("Failed to fetch lead pipeline", { error });
            res.status(500).json({ success: false, message: "Failed to fetch lead pipeline" });
        }
    });

    /**
     * GET /automation/activity-log/:leadUid
     * Returns the audit trail of automated status changes for a lead
     */
    router.get("/activity-log/:leadUid", authenticate, async (req: Request, res: Response) => {
        try {
            const tenantUid = (req as any).user?.tenantUid;
            if (!tenantUid) {
                res.status(401).json({ success: false, message: "Unauthorized" });
                return;
            }

            const { leadUid } = req.params;

            // Get audit logs for this lead and its linked project
            const logsRes = await pool.query(
                `SELECT uid, module, record_uid AS "recordUid", action, message, 
                        created_at AS "createdAt", created_by AS "createdBy"
                 FROM audit_logs 
                 WHERE tenant_uid::varchar = $1 
                   AND (
                       (module = 'Lead' AND record_uid::varchar = $2)
                       OR (module = 'Project' AND record_uid::varchar IN (
                           SELECT uid::varchar FROM projects WHERE lead_uid::varchar = $2 AND tenant_uid::varchar = $1
                       ))
                   )
                   AND message ILIKE '%automatically%'
                 ORDER BY created_at DESC
                 LIMIT 50`,
                [tenantUid, leadUid]
            );

            res.json({
                success: true,
                data: logsRes.rows.map(log => ({
                    uid: log.uid,
                    module: log.module,
                    action: log.action,
                    message: log.message,
                    createdAt: log.createdAt,
                    isAutomated: true,
                }))
            });
        } catch (error) {
            logger.error("Failed to fetch activity log", { error });
            res.status(500).json({ success: false, message: "Failed to fetch activity log" });
        }
    });

    return router;
}

export const automationRoutes = createAutomationRouter();

