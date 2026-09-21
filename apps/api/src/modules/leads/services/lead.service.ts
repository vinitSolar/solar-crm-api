import type { LeadRepository } from "../repositories/lead.repository.js";
import type { LeadSourceRepository } from "../repositories/lead-source.repository.js";
import type { LeadStatusRepository } from "../repositories/lead-status.repository.js";
import type { UserRepository } from "../../users/repositories/user.repository.js";
import type { NoteService } from "../../notes/services/note.service.js";
import type { RoleRepository } from "../../roles/repositories/role.repository.js";
import type { ICreateLead, IUpdateLead, ILeadSafe, IPaginationQuery, IPaginatedResponse } from "../interfaces/lead.interface.js";
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

        const isDraft = Boolean(
            data.isDraft === true ||
            data.isDraft === 1 ||
            (data as any).isDraft === "true" ||
            (data as any).isDraft === "1" ||
            (data as any).is_draft === true ||
            (data as any).is_draft === 1 ||
            (data as any).is_draft === "true" ||
            (data as any).is_draft === "1"
        );

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

            const createData = { ...data, statusUid: finalStatusUid, leadNumber: nextLeadNumber };
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

        // Auto-assign draft status when isDraft flag is set
        const isDraft = Boolean(
            data.isDraft === true ||
            data.isDraft === 1 ||
            (data as any).isDraft === "true" ||
            (data as any).isDraft === "1" ||
            (data as any).is_draft === true ||
            (data as any).is_draft === 1 ||
            (data as any).is_draft === "true" ||
            (data as any).is_draft === "1"
        );

        if (isDraft) {
            const draftStatus = await this.statusRepository.getDraft(tenantUid);
            if (!draftStatus) {
                throw new CustomError("No draft lead status found", 400);
            }
            data.statusUid = draftStatus.uid;
        }

        let newStatusName: string | undefined;
        if (data.statusUid) {
            const leadStatus = await this.statusRepository.getByUid(tenantUid, data.statusUid);
            if (!leadStatus) throw new CustomError(LEAD_STATUS_MESSAGES.NOT_FOUND, 400);
            newStatusName = leadStatus.name;
        }

        const isReassigned = Boolean(data.assignedTo && data.assignedTo !== existing.assignedTo);
        const isStatusChanged = Boolean(data.statusUid && data.statusUid !== existing.statusUid);

        if (isReassigned && data.assignedTo) {
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

            // Real-time Push Notification to newly assigned mobile user (Android / iOS)
            if (isReassigned && updated.assignedTo) {
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
            if (updated.assignedTo && !updated.statusIsDraft && !isReassigned && !isStatusChanged) {
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

        try {
            const updated = await this.repository.update(tenantUid, uid, { statusUid }, updatedBy);
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
}
