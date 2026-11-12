import type { LeadRepository } from "../repositories/lead.repository.js";
import type { LeadSourceRepository } from "../repositories/lead-source.repository.js";
import type { LeadStatusRepository } from "../repositories/lead-status.repository.js";
import type { UserRepository } from "../../users/repositories/user.repository.js";
import type { NoteService } from "../../notes/services/note.service.js";
import type { RoleRepository } from "../../roles/repositories/role.repository.js";
import type { ICreateLead, IUpdateLead, ILeadSafe, IPaginationQuery, IPaginatedResponse, ICursorPaginationQuery, ICursorPaginatedResponse } from "../interfaces/lead.interface.js";
import { toLeadSafe } from "../dto/lead.dto.js";
import { CustomError } from "../../../middlewares/error.middleware.js";
import { LEAD_MESSAGES, LEAD_SOURCE_MESSAGES, LEAD_STATUS_MESSAGES } from "../constants/lead.constants.js";
import { logger } from "@packages/logger/index.js";
import { notificationService, NOTIFICATION_CHANNEL, NOTIFICATION_TEMPLATE } from "../../notification/index.js";

export class LeadService {
    private readonly repository: LeadRepository;
    private readonly sourceRepository: LeadSourceRepository;
    private readonly statusRepository: LeadStatusRepository;
    private readonly userRepository: UserRepository;
    private readonly noteService: NoteService;
    private readonly roleRepository: RoleRepository;

    constructor(
        repository: LeadRepository,
        sourceRepository: LeadSourceRepository,
        statusRepository: LeadStatusRepository,
        userRepository: UserRepository,
        noteService: NoteService,
        roleRepository: RoleRepository
    ) {
        this.repository = repository;
        this.sourceRepository = sourceRepository;
        this.statusRepository = statusRepository;
        this.userRepository = userRepository;
        this.noteService = noteService;
        this.roleRepository = roleRepository;
    }

    async createLead(tenantUid: string, data: ICreateLead, createdBy: string): Promise<ILeadSafe> {
        logger.info("LeadService.createLead", { tenantUid });

        // Ensure lead source belongs to this tenant if provided
        if (data.leadSourceUid) {
            const leadSource = await this.sourceRepository.getByUid(tenantUid, data.leadSourceUid);
            if (!leadSource) {
                throw new CustomError(LEAD_SOURCE_MESSAGES.NOT_FOUND, 400);
            }
        }

        // Ensure assigned user belongs to this tenant if provided
        if (data.assignedTo) {
            const user = await this.userRepository.getUserByUid(data.assignedTo, tenantUid);
            if (!user) {
                throw new CustomError(LEAD_MESSAGES.VALIDATION_FAILED, 400, [
                    {
                        field: "body.assignedTo",
                        message: LEAD_MESSAGES.USER_NOT_FOUND,
                    }
                ]);
            }
        }

        // Fallback for name -> firstName if only name was supplied
        if (!data.firstName && (data as any).name) {
            data.firstName = (data as any).name;
        }

        // Check for duplicates in mobileNumber or email
        if (data.mobileNumber || data.email) {
            const duplicates = await this.repository.findDuplicates(tenantUid, {
                mobileNumber: data.mobileNumber,
                email: data.email,
            });

            if (duplicates.mobileExists) {
                throw new CustomError(LEAD_MESSAGES.MOBILE_ALREADY_EXISTS, 400, [
                    { field: "mobileNumber", message: LEAD_MESSAGES.MOBILE_ALREADY_EXISTS }
                ]);
            }
            if (duplicates.emailExists) {
                throw new CustomError(LEAD_MESSAGES.EMAIL_ALREADY_EXISTS, 400, [
                    { field: "email", message: LEAD_MESSAGES.EMAIL_ALREADY_EXISTS }
                ]);
            }
        }

        const isQuickLead = Boolean(
            data.isQuickLead === true ||
            data.isQuickLead === 1 ||
            (data as any).isQuickLead === "true" ||
            (data as any).isQuickLead === "1" ||
            (data as any).is_quick_lead === true ||
            (data as any).is_quick_lead === 1
        );

        const isDraft = Boolean(
            isQuickLead ||
            data.isDraft === true ||
            data.isDraft === 1 ||
            (data as any).isDraft === "true" ||
            (data as any).isDraft === "1" ||
            (data as any).isDraft === "draft" ||
            (data as any).is_draft === true ||
            (data as any).is_draft === 1 ||
            (data as any).is_draft === "true" ||
            (data as any).is_draft === "1" ||
            (data as any).draft === true ||
            (data as any).draft === 1 ||
            (data as any).draft === "true" ||
            ((data as any).status && String((data as any).status).trim().toLowerCase() === "draft") ||
            ((data as any).statusName && String((data as any).statusName).trim().toLowerCase() === "draft")
        );

        // For Quick Leads / drafts, if leadSourceUid is missing, fallback to default or first active source
        if (!data.leadSourceUid) {
            const allSources = await this.sourceRepository.getAll(tenantUid, "active");
            const defaultSource = allSources.find((s) => s.isDefault === 1) || allSources[0];
            if (defaultSource) {
                data.leadSourceUid = defaultSource.uid;
            }
        }

        let finalStatusUid: string;

        if (isDraft) {
            const draftStatus = await this.statusRepository.getDraft(tenantUid);
            if (!draftStatus) {
                throw new CustomError("No draft lead status found", 400);
            }
            finalStatusUid = draftStatus.uid;
        } else if (data.statusUid) {
            const existingStatus = await this.statusRepository.getByUid(tenantUid, data.statusUid);
            if (!existingStatus) {
                throw new CustomError(LEAD_STATUS_MESSAGES.NOT_FOUND, 400);
            }
            finalStatusUid = existingStatus.uid;
        } else {
            const defaultStatus = await this.statusRepository.getDefault(tenantUid);
            if (!defaultStatus) {
                throw new CustomError("No default lead status found", 400);
            }
            finalStatusUid = defaultStatus.uid;
        }

        try {
            const lastLeadNumber = await this.repository.getLastLeadNumber();
            let nextLeadNumber = "SS00001";
            
            if (lastLeadNumber) {
                const numStr = lastLeadNumber.replace("SS", "");
                const nextNum = parseInt(numStr, 10) + 1;
                nextLeadNumber = `SS${String(nextNum).padStart(5, "0")}`;
            }

            const createData = {
                ...data,
                statusUid: finalStatusUid,
                leadNumber: nextLeadNumber,
                isQuickLead: isQuickLead ? 1 : 0,
            };
            const lead = await this.repository.create(tenantUid, createData, createdBy);
            
            if (data.remarks) {
                await this.noteService.handleIncomingNote(tenantUid, 'lead', lead.uid, data.remarks, createdBy);
                lead.remarks = data.remarks;
            }

            // Real-time Push Notification to assigned mobile user (Android / iOS)
            if (data.assignedTo && !isDraft) {
                this.sendLeadAssignedPushNotification(tenantUid, lead, data.assignedTo, createdBy).catch(err => {
                    logger.error("Failed to trigger lead assignment push notification:", err);
                });
            }

            // WhatsApp Notification to the created lead customer
            if (!isDraft) {
                this.sendLeadCreatedWhatsAppNotification(tenantUid, lead, createdBy).catch(err => {
                    logger.error("Failed to trigger lead creation WhatsApp notification:", err);
                });
            }
            
            return toLeadSafe(lead);
        } catch (error) {
            logger.error("LeadService.createLead error", { error });
            throw new CustomError(LEAD_MESSAGES.CREATION_FAILED, 500);
        }
    }

    async getLeadByUid(tenantUid: string, uid: string): Promise<ILeadSafe> {
        const lead = await this.repository.getByUid(tenantUid, uid);
        if (!lead) {
            throw new CustomError(LEAD_MESSAGES.NOT_FOUND, 404);
        }
        return toLeadSafe(lead);
    }

    async getLeadsPaginated(
        tenantUid: string,
        userUid: string,
        roleUid: string,
        query: IPaginationQuery
    ): Promise<IPaginatedResponse<ILeadSafe>> {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = query.limit && query.limit > 0 ? query.limit : 10;

        const role = await this.roleRepository.getRoleByUid(roleUid, tenantUid);
        const showAllLeads = role?.show_all_leads === 1;

        // If user does not have show_all_leads = 1, restrict strictly to their assigned leads.
        // If user has show_all_leads = 1, allow viewing all leads or filtering by query.assignedTo.
        const assignedTo = showAllLeads ? query.assignedTo : userUid;

        const result = await this.repository.getPaginated(tenantUid, page, limit, query.search, query.status, assignedTo);

        return {
            data: result.rows.map(toLeadSafe),
            meta: {
                total: result.total,
                page,
                limit,
                totalPages: Math.ceil(result.total / limit),
            },
        };
    }

    async getLeadsCursor(
        tenantUid: string,
        userUid: string,
        roleUid: string,
        query: ICursorPaginationQuery
    ): Promise<ICursorPaginatedResponse<ILeadSafe>> {
        const limit = Math.min(Math.max(Number(query.limit) || 5, 1), 50);

        const role = await this.roleRepository.getRoleByUid(roleUid, tenantUid);
        const showAllLeads = role?.show_all_leads === 1;
        const assignedTo = showAllLeads ? query.assignedTo : userUid;

        let cursorData: { createdAt: Date; id: string } | undefined;
        if (query.cursor) {
            try {
                const decoded = Buffer.from(query.cursor, "base64url").toString("utf8");
                const parsed = JSON.parse(decoded);
                if (parsed.createdAt && parsed.id) {
                    const date = new Date(parsed.createdAt);
                    if (!isNaN(date.getTime())) {
                        cursorData = {
                            createdAt: date,
                            id: String(parsed.id),
                        };
                    }
                }
            } catch (err) {
                logger.warn("Invalid cursor provided, ignoring cursor", { cursor: query.cursor });
            }
        }

        const filters: Parameters<LeadRepository["getLeadsCursor"]>[3] = {};
        if (query.search) filters.search = query.search;
        filters.status = query.status || "active";
        if (query.statusUid) filters.statusUid = query.statusUid;
        if (assignedTo) filters.assignedTo = assignedTo;
        if (query.leadSourceUid) filters.leadSourceUid = query.leadSourceUid;
        if (query.startDate) filters.startDate = query.startDate;
        if (query.endDate) filters.endDate = query.endDate;
        if (query.followUpDate) filters.followUpDate = query.followUpDate;
        if (query.city) filters.city = query.city;
        if (query.state) filters.state = query.state;
        if (query.minCapacity !== undefined) filters.minCapacity = query.minCapacity;
        if (query.maxCapacity !== undefined) filters.maxCapacity = query.maxCapacity;
        filters.sortBy = query.sortBy || "created_at";
        filters.sortOrder = query.sortOrder || "desc";

        const result = await this.repository.getLeadsCursor(tenantUid, limit, cursorData || null, filters);

        let nextCursor: string | null = null;
        if (result.hasMore && result.rows.length > 0) {
            const lastRow = result.rows[result.rows.length - 1];
            if (lastRow) {
                nextCursor = Buffer.from(
                    JSON.stringify({
                        createdAt: lastRow.createdAt,
                        id: String(lastRow.id),
                    })
                ).toString("base64url");
            }
        }

        return {
            data: result.rows.map(toLeadSafe),
            pagination: {
                nextCursor,
                hasMore: result.hasMore,
                ...(cursorData
                    ? {}
                    : {
                          total: result.total,
                          allCount: result.allCount,
                          statusCounts: result.statusCounts,
                      }),
            },
        };
    }


    async getAllLeads(
        tenantUid: string,
        userUid: string,
        roleUid: string,
        status: "active" | "deleted" | "all" = "active"
    ): Promise<ILeadSafe[]> {
        const role = await this.roleRepository.getRoleByUid(roleUid, tenantUid);
        const showAllLeads = role?.show_all_leads === 1;
        const assignedTo = showAllLeads ? undefined : userUid;

        const leads = await this.repository.getAll(tenantUid, status, assignedTo);
        return leads.map(toLeadSafe);
    }

    async updateLead(tenantUid: string, uid: string, data: IUpdateLead, updatedBy: string): Promise<ILeadSafe> {
        const existing = await this.repository.getByUid(tenantUid, uid);
        if (!existing) {
            throw new CustomError(LEAD_MESSAGES.NOT_FOUND, 404);
        }

        if (data.leadSourceUid) {
            const leadSource = await this.sourceRepository.getByUid(tenantUid, data.leadSourceUid);
            if (!leadSource) throw new CustomError(LEAD_SOURCE_MESSAGES.NOT_FOUND, 400);
        }

        // Fallback for name -> firstName if only name was supplied
        if (!data.firstName && (data as any).name) {
            data.firstName = (data as any).name;
        }

        // Auto-assign draft status when isDraft flag is set
        const isDraft = Boolean(
            data.isDraft === true ||
            data.isDraft === 1 ||
            (data as any).isDraft === "true" ||
            (data as any).isDraft === "1" ||
            (data as any).isDraft === "draft" ||
            (data as any).is_draft === true ||
            (data as any).is_draft === 1 ||
            (data as any).is_draft === "true" ||
            (data as any).is_draft === "1" ||
            (data as any).draft === true ||
            (data as any).draft === 1 ||
            (data as any).draft === "true" ||
            ((data as any).status && String((data as any).status).trim().toLowerCase() === "draft") ||
            ((data as any).statusName && String((data as any).statusName).trim().toLowerCase() === "draft")
        );

        if (isDraft) {
            const draftStatus = await this.statusRepository.getDraft(tenantUid);
            if (!draftStatus) {
                throw new CustomError("No draft lead status found", 400);
            }
            data.statusUid = draftStatus.uid;
        } else if (existing.isQuickLead === 1) {
            data.isQuickLead = 0;
        }

        let newStatusName: string | undefined;
        if (data.statusUid) {
            const leadStatus = await this.statusRepository.getByUid(tenantUid, data.statusUid);
            if (!leadStatus) throw new CustomError(LEAD_STATUS_MESSAGES.NOT_FOUND, 400);
            newStatusName = leadStatus.name;
        }

        const previousAssignedTo = existing.assignedTo ? String(existing.assignedTo).trim() : null;
        if (typeof data.assignedTo === "string") {
            data.assignedTo = data.assignedTo.trim() || null;
        }
        const nextAssignedTo = data.assignedTo !== undefined ? (data.assignedTo ?? null) : previousAssignedTo;
        const isReassigned = Boolean(
            nextAssignedTo &&
            (!previousAssignedTo || nextAssignedTo.toLowerCase() !== previousAssignedTo.toLowerCase())
        );
        const wasDraftOrQuickLead = Boolean(existing.statusIsDraft === 1 || existing.isQuickLead === 1);
        const shouldNotifyInitialDraftAssignment = Boolean(
            !isReassigned &&
            wasDraftOrQuickLead &&
            !isDraft &&
            nextAssignedTo
        );
        const shouldSendAssignedNotification = isReassigned || shouldNotifyInitialDraftAssignment;
        const isStatusChanged = Boolean(data.statusUid && data.statusUid !== existing.statusUid);

        if (isReassigned && nextAssignedTo) {
            const user = await this.userRepository.getUserByUid(nextAssignedTo, tenantUid);
            if (!user) {
                throw new CustomError(LEAD_MESSAGES.VALIDATION_FAILED, 400, [
                    {
                        field: "body.assignedTo",
                        message: LEAD_MESSAGES.USER_NOT_FOUND,
                    }
                ]);
            }
        }

        // Check for duplicates when updating mobileNumber or email only if they actually changed
        const cleanExistingMobile = existing.mobileNumber ? existing.mobileNumber.replace(/\D/g, "").slice(-10) : "";
        const cleanNewMobile = data.mobileNumber ? data.mobileNumber.replace(/\D/g, "").slice(-10) : "";
        const isMobileChanged = Boolean(data.mobileNumber !== undefined && cleanNewMobile && cleanNewMobile !== cleanExistingMobile);

        const cleanExistingEmail = existing.email ? existing.email.trim().toLowerCase() : "";
        const cleanNewEmail = data.email ? data.email.trim().toLowerCase() : "";
        const isEmailChanged = Boolean(data.email !== undefined && cleanNewEmail !== cleanExistingEmail);

        if (isMobileChanged || isEmailChanged) {
            const duplicates = await this.repository.findDuplicates(tenantUid, {
                mobileNumber: isMobileChanged ? data.mobileNumber : undefined,
                email: isEmailChanged ? data.email : undefined,
                excludeUid: uid,
            });

            if (isMobileChanged && duplicates.mobileExists) {
                throw new CustomError(LEAD_MESSAGES.MOBILE_ALREADY_EXISTS, 400, [
                    { field: "mobileNumber", message: LEAD_MESSAGES.MOBILE_ALREADY_EXISTS }
                ]);
            }
            if (isEmailChanged && duplicates.emailExists) {
                throw new CustomError(LEAD_MESSAGES.EMAIL_ALREADY_EXISTS, 400, [
                    { field: "email", message: LEAD_MESSAGES.EMAIL_ALREADY_EXISTS }
                ]);
            }
        }

        try {
            if (data.remarks !== undefined) {
                await this.noteService.handleIncomingNote(tenantUid, 'lead', uid, data.remarks, updatedBy);
            }
            const updated = await this.repository.update(tenantUid, uid, data, updatedBy);
            if (!updated) {
                throw new CustomError(LEAD_MESSAGES.UPDATE_FAILED, 500);
            }
            if (data.remarks !== undefined) {
                updated.remarks = data.remarks || null;
            }

            // Real-time Push Notification to newly assigned mobile user (or un-notified draft/quick lead assignee)
            if (shouldSendAssignedNotification && updated.assignedTo) {
                this.sendLeadAssignedPushNotification(tenantUid, updated, updated.assignedTo, updatedBy).catch(err => {
                    logger.error("Failed to trigger lead reassignment push notification:", err);
                });
            }

            // Real-time Push Notification for status changes
            if (isStatusChanged && updated.assignedTo && newStatusName) {
                this.sendLeadStatusChangedPushNotification(tenantUid, updated, newStatusName, updated.assignedTo, updatedBy).catch(err => {
                    logger.error("Failed to trigger lead status change push notification:", err);
                });
            }

            // FCM Push Notification to assigned user for lead update (if not a draft)
            if (updated.assignedTo && !updated.statusIsDraft && !shouldSendAssignedNotification && !isStatusChanged) {
                this.sendLeadUpdatedPushNotification(tenantUid, updated, updated.assignedTo, updatedBy).catch(err => {
                    logger.error("Failed to trigger lead update push notification:", err);
                });
            }

            // WhatsApp Notification to customer for lead update (if not a draft)
            if (!updated.statusIsDraft) {
                this.sendLeadUpdatedWhatsAppNotification(
                    tenantUid,
                    updated,
                    { statusName: newStatusName, isStatusChanged },
                    updatedBy
                ).catch(err => {
                    logger.error("Failed to trigger lead update WhatsApp notification:", err);
                });
            }

            return toLeadSafe(updated);
        } catch (error) {
            logger.error("LeadService.updateLead error", { error });
            throw new CustomError(LEAD_MESSAGES.UPDATE_FAILED, 500);
        }
    }

    async changeLeadStatus(tenantUid: string, uid: string, statusUid: string, updatedBy: string): Promise<ILeadSafe> {
        const existing = await this.repository.getByUid(tenantUid, uid);
        if (!existing) {
            throw new CustomError(LEAD_MESSAGES.NOT_FOUND, 404);
        }

        const leadStatus = await this.statusRepository.getByUid(tenantUid, statusUid);
        if (!leadStatus) throw new CustomError(LEAD_STATUS_MESSAGES.NOT_FOUND, 400);

        // Restriction: Without completing all 4 required creation steps, status cannot be changed to non-draft
        const isTargetDraft = leadStatus.isDraft === 1 || String(leadStatus.name).trim().toLowerCase() === "draft";
        if (!isTargetDraft) {
            const missing: string[] = [];
            if (!existing.firstName || existing.firstName.trim().length < 2) missing.push("First Name");
            const cleanPhone = (existing.mobileNumber || "").replace(/\D/g, "").slice(-10);
            if (!/^[6-9][0-9]{9}$/.test(cleanPhone)) missing.push("10-digit Mobile Number");
            if (!existing.leadSourceUid) missing.push("Lead Source");
            if (!existing.address || existing.address.trim().length < 3) missing.push("Address (min 3 chars)");
            const pin = (existing.pinCode || "").trim();
            if (!/^[1-9][0-9]{5}$/.test(pin) || pin === "000000") missing.push("Valid 6-digit Pin Code");
            if (!existing.state || !existing.state.trim()) missing.push("State");
            if (!existing.city || !existing.city.trim()) missing.push("City");
            const bill = Number(existing.monthlyBillAmount);
            if (existing.monthlyBillAmount === null || existing.monthlyBillAmount === undefined || isNaN(bill) || bill < 0) missing.push("Monthly Bill Amount");
            const size = Number(existing.systemSize);
            if (existing.systemSize === null || existing.systemSize === undefined || isNaN(size) || size <= 0) missing.push("Recommended System Size");
            if (!existing.followUpDate) missing.push("Follow-up Date");
            if (!existing.assignedTo) missing.push("Assigned Salesperson");

            if (missing.length > 0) {
                throw new CustomError(
                    `Cannot change status. Please complete all required lead creation fields (4 steps) first: ${missing.join(", ")}`,
                    400,
                    missing.map(f => ({ field: f, message: `${f} is required` }))
                );
            }
        }

        try {
            const updatePayload: any = { statusUid };
            if (existing.isQuickLead === 1 && !isTargetDraft) {
                updatePayload.isQuickLead = 0;
            }

            const updated = await this.repository.update(tenantUid, uid, updatePayload, updatedBy);
            if (!updated) {
                throw new CustomError(LEAD_MESSAGES.UPDATE_FAILED, 500);
            }

            // Push Notification for status change
            if (updated.assignedTo) {
                this.sendLeadStatusChangedPushNotification(tenantUid, updated, leadStatus.name, updated.assignedTo, updatedBy).catch(err => {
                    logger.error("Failed to trigger lead status change push notification:", err);
                });
            }

            // WhatsApp Notification to customer for status change (if not a draft)
            if (!updated.statusIsDraft) {
                this.sendLeadUpdatedWhatsAppNotification(
                    tenantUid,
                    updated,
                    { statusName: leadStatus.name, isStatusChanged: true },
                    updatedBy
                ).catch(err => {
                    logger.error("Failed to trigger lead status change WhatsApp notification:", err);
                });
            }

            return toLeadSafe(updated);
        } catch (error) {
            logger.error("LeadService.changeLeadStatus error", { error });
            throw new CustomError(LEAD_MESSAGES.UPDATE_FAILED, 500);
        }
    }

    async deleteLead(tenantUid: string, uid: string, deletedBy: string): Promise<void> {
        const existing = await this.repository.getByUid(tenantUid, uid);
        if (!existing) {
            throw new CustomError(LEAD_MESSAGES.NOT_FOUND, 404);
        }

        const success = await this.repository.softDelete(tenantUid, uid, deletedBy);
        if (!success) {
            throw new CustomError(LEAD_MESSAGES.DELETE_FAILED, 500);
        }
    }

    async restoreLead(tenantUid: string, uid: string, updatedBy: string): Promise<void> {
        const success = await this.repository.restore(tenantUid, uid, updatedBy);
        if (!success) {
            throw new CustomError(LEAD_MESSAGES.RESTORE_FAILED, 404);
        }
    }

    /**
     * Helper to dispatch real-time FCM Push Notification to assigned mobile device(s)
     */
    private async sendLeadAssignedPushNotification(
        tenantUid: string,
        lead: any,
        assignedUserUid: string,
        createdBy?: string
    ): Promise<void> {
        try {
            await notificationService.send({
                channel: NOTIFICATION_CHANNEL.PUSH,
                template: NOTIFICATION_TEMPLATE.LEAD_ASSIGNED,
                recipient: assignedUserUid,
                module: "lead",
                referenceUid: lead.uid,
                tenantUid,
                createdBy: createdBy || "SYSTEM",
                variables: {
                    lead_number: lead.leadNumber || "Lead",
                    customer_name: `${lead.firstName || ""} ${lead.lastName || ""}`.trim() || "Customer",
                    system_size: lead.systemSize ? `${lead.systemSize} kW` : "",
                    city: lead.city || "",
                    lead_uid: lead.uid,
                }
            });
        } catch (err) {
            logger.error("Error dispatching lead assigned push notification:", err);
        }
    }

    /**
     * Helper to dispatch real-time FCM Push Notification when lead status changes
     */
    private async sendLeadStatusChangedPushNotification(
        tenantUid: string,
        lead: any,
        statusName: string,
        recipientUserUid: string,
        createdBy?: string
    ): Promise<void> {
        try {
            await notificationService.send({
                channel: NOTIFICATION_CHANNEL.PUSH,
                template: NOTIFICATION_TEMPLATE.LEAD_STATUS_CHANGED,
                recipient: recipientUserUid,
                module: "lead",
                referenceUid: lead.uid,
                tenantUid,
                createdBy: createdBy || "SYSTEM",
                variables: {
                    lead_number: lead.leadNumber || "Lead",
                    customer_name: `${lead.firstName || ""} ${lead.lastName || ""}`.trim() || "Customer",
                    status_name: statusName,
                    lead_uid: lead.uid,
                }
            });
        } catch (err) {
            logger.error("Error dispatching lead status changed push notification:", err);
        }
    }

    /**
     * Helper to dispatch real-time FCM Push Notification when lead details are updated
     */
    private async sendLeadUpdatedPushNotification(
        tenantUid: string,
        lead: any,
        recipientUserUid: string,
        updatedBy?: string
    ): Promise<void> {
        try {
            await notificationService.send({
                channel: NOTIFICATION_CHANNEL.PUSH,
                template: NOTIFICATION_TEMPLATE.LEAD_UPDATED,
                recipient: recipientUserUid,
                module: "lead",
                referenceUid: lead.uid,
                tenantUid,
                createdBy: updatedBy || "SYSTEM",
                variables: {
                    lead_number: lead.leadNumber || "Lead",
                    customer_name: `${lead.firstName || ""} ${lead.lastName || ""}`.trim() || "Customer",
                    city: lead.city || "",
                    lead_uid: lead.uid,
                }
            });
        } catch (err) {
            logger.error("Error dispatching lead updated push notification:", err);
        }
    }

    /**
     * Helper to dispatch WhatsApp notification to customer when lead is created
     */
    private async sendLeadCreatedWhatsAppNotification(
        tenantUid: string,
        lead: any,
        createdBy?: string
    ): Promise<void> {
        try {
            if (!lead.mobileNumber) return;

            const customerName = `${lead.firstName || ""} ${lead.lastName || ""}`.trim() || "Customer";
            const leadNum = lead.leadNumber || "your lead";

            await notificationService.send({
                channel: NOTIFICATION_CHANNEL.WHATSAPP,
                template: NOTIFICATION_TEMPLATE.LEAD_CREATED_WHATSAPP,
                recipient: lead.mobileNumber,
                module: "lead",
                referenceUid: lead.uid,
                tenantUid,
                createdBy: createdBy || "SYSTEM",
                variables: {
                    customer_name: customerName,
                    lead_number: leadNum,
                    text: `Hello ${customerName}! Your lead (${leadNum}) has been created successfully with SunSelect Solar. Our team will contact you shortly. Thank you!`
                }
            });
        } catch (err) {
            logger.error("Error dispatching lead created WhatsApp notification:", err);
        }
    }

    /**
     * Helper to dispatch WhatsApp notification to customer when lead details or status are updated
     */
    private async sendLeadUpdatedWhatsAppNotification(
        tenantUid: string,
        lead: any,
        updateDetails?: { statusName?: string | undefined; isStatusChanged?: boolean | undefined },
        updatedBy?: string
    ): Promise<void> {
        try {
            if (!lead.mobileNumber) return;

            const customerName = `${lead.firstName || ""} ${lead.lastName || ""}`.trim() || "Customer";
            const leadNum = lead.leadNumber || "your lead";

            let messageText: string;
            if (updateDetails?.isStatusChanged && updateDetails.statusName) {
                messageText = `Hello ${customerName}! Your lead (${leadNum}) status has been updated to "${updateDetails.statusName}" with SunSelect Solar. Thank you!`;
            } else {
                messageText = `Hello ${customerName}! Your lead (${leadNum}) details have been updated successfully with SunSelect Solar. Thank you!`;
            }

            await notificationService.send({
                channel: NOTIFICATION_CHANNEL.WHATSAPP,
                template: NOTIFICATION_TEMPLATE.LEAD_UPDATED_WHATSAPP,
                recipient: lead.mobileNumber,
                module: "lead",
                referenceUid: lead.uid,
                tenantUid,
                createdBy: updatedBy || "SYSTEM",
                variables: {
                    customer_name: customerName,
                    lead_number: leadNum,
                    status_name: updateDetails?.statusName || lead.statusName || "",
                    text: messageText
                }
            });
        } catch (err) {
            logger.error("Error dispatching lead updated WhatsApp notification:", err);
        }
    }

    async checkDuplicateLead(
        tenantUid: string,
        params: {
            mobileNumber?: string | null | undefined;
            email?: string | null | undefined;
            excludeUid?: string | null | undefined;
        }
    ) {
        return await this.repository.findDuplicates(tenantUid, params);
    }
}
