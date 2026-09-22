import type { SiteSurveyDetailsRepository } from "../repositories/site-survey-details.repository.js";
import type { SiteSurveyRepository } from "../repositories/site-survey.repository.js";
import type { LeadRepository } from "../../leads/repositories/lead.repository.js";
// Assume UserRepository is available in users module
import type { UserRepository } from "../../users/repositories/user.repository.js";
import type { RoleRepository } from "../../roles/repositories/role.repository.js";
import type { NoteService } from "../../notes/services/note.service.js";
import type { ICreateSiteSurvey, IUpdateSiteSurvey, ISiteSurveySafe, IPaginationQuery, IPaginatedResponse } from "../interfaces/site-survey.interface.js";
import type { ISaveSiteSurveyDetails, IUpdateSiteSurveyDetails, ISiteSurveyDetailsSafe } from "../interfaces/site-survey-details.interface.js";
import { toSiteSurveySafe, toSiteSurveyDetailsSafe } from "../dto/site-survey.dto.js";
import { CustomError } from "../../../middlewares/error.middleware.js";
import { SITE_SURVEY_MESSAGES } from "../constants/site-survey.constants.js";
import { logger } from "@packages/logger/index.js";
import { notificationService } from "../../notification/services/notification.service.js";
import { NOTIFICATION_CHANNEL, NOTIFICATION_TEMPLATE } from "../../notification/constants/notification.constants.js";

export class SiteSurveyService {
    private readonly repository: SiteSurveyRepository;
    private readonly detailsRepository: SiteSurveyDetailsRepository;
    private readonly leadRepository: LeadRepository;
    private readonly userRepository: UserRepository;
    private readonly roleRepository: RoleRepository;
    private readonly noteService: NoteService;

    constructor(
        repository: SiteSurveyRepository,
        detailsRepository: SiteSurveyDetailsRepository,
        leadRepository: LeadRepository,
        userRepository: UserRepository,
        roleRepository: RoleRepository,
        noteService: NoteService
    ) {
        this.repository = repository;
        this.detailsRepository = detailsRepository;
        this.leadRepository = leadRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.noteService = noteService;
    }

    async createSiteSurvey(tenantUid: string, data: ICreateSiteSurvey, createdBy: string): Promise<ISiteSurveySafe> {
        logger.info("SiteSurveyService.createSiteSurvey", { tenantUid, leadUid: data.leadUid });

        // Validate Lead exists and belongs to tenant
        const lead = await this.leadRepository.getByUid(tenantUid, data.leadUid);
        if (!lead) {
            throw new CustomError(SITE_SURVEY_MESSAGES.LEAD_NOT_FOUND, 400);
        }

        if (lead.isDeleted || !lead.isActive) {
            throw new CustomError(SITE_SURVEY_MESSAGES.INACTIVE_LEAD, 400);
        }

        // Validate assigned user exists and belongs to tenant
        const user = await this.userRepository.getUserByUid(data.assignedTo, tenantUid);
        if (!user) {
            throw new CustomError(SITE_SURVEY_MESSAGES.VALIDATION_FAILED, 400, [
                {
                    field: "body.assignedTo",
                    message: SITE_SURVEY_MESSAGES.USER_NOT_FOUND,
                }
            ]);
        }

        try {
            const survey = await this.repository.create(tenantUid, data, createdBy);
            if (data.remarks) {
                await this.noteService.handleIncomingNote(tenantUid, 'site_survey', survey.uid, data.remarks, createdBy);
                survey.remarks = data.remarks;
            }

            // Push Notification to assigned Survey Engineer
            if (data.assignedTo) {
                this.sendSurveyScheduledPushNotification(tenantUid, survey, lead, data.assignedTo, createdBy).catch(err => {
                    logger.error("Failed to trigger survey scheduled push notification:", err);
                });
            }

            return toSiteSurveySafe(survey);
        } catch (error) {
            logger.error("SiteSurveyService.createSiteSurvey error", { error });
            throw new CustomError(SITE_SURVEY_MESSAGES.CREATION_FAILED, 500);
        }
    }

    /**
     * Checks if a user can view all site surveys (via show_all_surveys = 1, isOwner = 1, or admin/owner role).
     */
    private async canUserViewAllSurveys(userUid: string, roleUid: string | undefined, tenantUid: string): Promise<boolean> {
        if (roleUid) {
            const role = await this.roleRepository.getRoleByUid(roleUid, tenantUid);
            if (role?.show_all_surveys === 1) {
                return true;
            }
        }
        return this.isUserAdminOrOwner(userUid, tenantUid);
    }

    /**
     * Checks if a user is an Admin or Tenant Owner with full visibility across all site surveys.
     */
    private async isUserAdminOrOwner(userUid: string, tenantUid: string): Promise<boolean> {
        const user = await this.userRepository.getUserByUid(userUid, tenantUid);
        if (!user) {
            return false;
        }

        if (user.isOwner === 1) {
            return true;
        }

        if (user.roleName) {
            const role = user.roleName.trim();
            const lowerRole = role.toLowerCase();
            if (
                role === "Master" ||
                role === "Franchise Owner(Admin)" ||
                lowerRole.includes("admin") ||
                lowerRole.includes("owner")
            ) {
                return true;
            }
        }

        return false;
    }

    async getSiteSurveyByUid(tenantUid: string, uid: string, currentUserUid?: string, roleUid?: string): Promise<ISiteSurveySafe> {
        const survey = await this.repository.getByUid(tenantUid, uid);
        if (!survey) {
            throw new CustomError(SITE_SURVEY_MESSAGES.NOT_FOUND, 404);
        }

        if (currentUserUid) {
            const showAllSurveys = await this.canUserViewAllSurveys(currentUserUid, roleUid, tenantUid);
            if (!showAllSurveys) {
                const isAssigned = survey.assignedTo === currentUserUid;
                if (!isAssigned) {
                    throw new CustomError(SITE_SURVEY_MESSAGES.UNAUTHORIZED_USER, 403);
                }
            }
        }

        const details = await this.detailsRepository.getBySiteSurveyUid(tenantUid, uid);
        const detailsSafe = details ? toSiteSurveyDetailsSafe(details) : undefined;

        return toSiteSurveySafe(survey, detailsSafe);
    }

    async getSiteSurveysPaginated(
        tenantUid: string,
        userUid: string,
        roleUid: string | undefined,
        query: IPaginationQuery
    ): Promise<IPaginatedResponse<ISiteSurveySafe>> {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = query.limit && query.limit > 0 ? query.limit : 10;
        
        const showAllSurveys = await this.canUserViewAllSurveys(userUid, roleUid, tenantUid);

        // If user does not have show_all_surveys = 1, restrict strictly to their assigned surveys.
        // If user has show_all_surveys = 1, allow viewing all surveys or filtering by query.assignedTo.
        const assignedTo = showAllSurveys ? query.assignedTo : userUid;

        const result = await this.repository.getPaginated(
            tenantUid, 
            page, 
            limit, 
            query.search, 
            query.surveyStatus,
            query.status,
            query.scheduledDate,
            query.fromDate,
            query.toDate,
            assignedTo,
            query.leadUid
        );

        return {
            data: result.rows.map(survey => toSiteSurveySafe(survey)),
            meta: {
                total: result.total,
                page,
                limit,
                totalPages: Math.ceil(result.total / limit),
            },
        };
    }

    async getAllSiteSurveys(
        tenantUid: string,
        userUid: string,
        roleUid: string | undefined,
        status: "active" | "deleted" | "all" = "active"
    ): Promise<ISiteSurveySafe[]> {
        const showAllSurveys = await this.canUserViewAllSurveys(userUid, roleUid, tenantUid);
        const assignedTo = showAllSurveys ? undefined : userUid;

        const surveys = await this.repository.getAll(tenantUid, status, assignedTo);
        return surveys.map(survey => toSiteSurveySafe(survey));
    }

    async updateSiteSurvey(tenantUid: string, uid: string, data: IUpdateSiteSurvey, updatedBy: string, roleUid?: string): Promise<ISiteSurveySafe> {
        const existing = await this.repository.getByUid(tenantUid, uid);
        if (!existing) {
            throw new CustomError(SITE_SURVEY_MESSAGES.NOT_FOUND, 404);
        }

        const showAllSurveys = await this.canUserViewAllSurveys(updatedBy, roleUid, tenantUid);
        if (!showAllSurveys) {
            const isAssigned = existing.assignedTo === updatedBy;
            if (!isAssigned) {
                throw new CustomError(SITE_SURVEY_MESSAGES.UNAUTHORIZED_USER, 403);
            }
        }

        if (data.assignedTo && data.assignedTo !== existing.assignedTo) {
            const user = await this.userRepository.getUserByUid(data.assignedTo, tenantUid);
            if (!user) {
                throw new CustomError(SITE_SURVEY_MESSAGES.VALIDATION_FAILED, 400, [
                    {
                        field: "body.assignedTo",
                        message: SITE_SURVEY_MESSAGES.USER_NOT_FOUND,
                    }
                ]);
            }
        }

        if (data.status !== undefined && (data.status < 0 || data.status > 3)) {
            throw new CustomError(SITE_SURVEY_MESSAGES.INVALID_STATUS, 400);
        }

        try {
            if (data.remarks !== undefined) {
                await this.noteService.handleIncomingNote(tenantUid, 'site_survey', uid, data.remarks, updatedBy);
            }
            const updated = await this.repository.update(tenantUid, uid, data, updatedBy);
            if (data.remarks !== undefined) {
                updated.remarks = data.remarks || null;
            }

            // Push Notification if survey was reassigned to a different engineer
            const isReassigned = Boolean(data.assignedTo && data.assignedTo !== existing.assignedTo);
            if (isReassigned && updated.assignedTo) {
                this.leadRepository.getByUid(tenantUid, updated.leadUid).then(lead => {
                    if (lead) {
                        this.sendSurveyScheduledPushNotification(tenantUid, updated, lead, updated.assignedTo, updatedBy);
                    }
                }).catch(err => {
                    logger.error("Failed to trigger survey reassignment push notification:", err);
                });
            }

            return toSiteSurveySafe(updated);
        } catch (error) {
            if (error instanceof CustomError) throw error;
            logger.error("SiteSurveyService.updateSiteSurvey error", { error });
            throw new CustomError(SITE_SURVEY_MESSAGES.UPDATE_FAILED, 500);
        }
    }

    async changeSiteSurveyStatus(tenantUid: string, uid: string, status: number, updatedBy: string, roleUid?: string): Promise<ISiteSurveySafe> {
        const existing = await this.repository.getByUid(tenantUid, uid);
        if (!existing) {
            throw new CustomError(SITE_SURVEY_MESSAGES.NOT_FOUND, 404);
        }

        const showAllSurveys = await this.canUserViewAllSurveys(updatedBy, roleUid, tenantUid);
        if (!showAllSurveys) {
            const isAssigned = existing.assignedTo === updatedBy;
            if (!isAssigned) {
                throw new CustomError(SITE_SURVEY_MESSAGES.UNAUTHORIZED_USER, 403);
            }
        }

        if (status < 0 || status > 3) {
            throw new CustomError(SITE_SURVEY_MESSAGES.INVALID_STATUS, 400);
        }

        try {
            const updated = await this.repository.update(tenantUid, uid, { status }, updatedBy);
            return toSiteSurveySafe(updated);
        } catch (error) {
            if (error instanceof CustomError) throw error;
            logger.error("SiteSurveyService.changeSiteSurveyStatus error", { error });
            throw new CustomError(SITE_SURVEY_MESSAGES.UPDATE_FAILED, 500);
        }
    }

    async deleteSiteSurvey(tenantUid: string, uid: string, deletedBy: string, roleUid?: string): Promise<void> {
        const existing = await this.repository.getByUid(tenantUid, uid);
        if (!existing) {
            throw new CustomError(SITE_SURVEY_MESSAGES.NOT_FOUND, 404);
        }

        const showAllSurveys = await this.canUserViewAllSurveys(deletedBy, roleUid, tenantUid);
        if (!showAllSurveys) {
            const isAssigned = existing.assignedTo === deletedBy;
            if (!isAssigned) {
                throw new CustomError(SITE_SURVEY_MESSAGES.UNAUTHORIZED_USER, 403);
            }
        }

        const success = await this.repository.softDelete(tenantUid, uid, deletedBy);
        if (!success) {
            throw new CustomError(SITE_SURVEY_MESSAGES.DELETE_FAILED, 500);
        }
    }

    async restoreSiteSurvey(tenantUid: string, uid: string, updatedBy: string, roleUid?: string): Promise<void> {
        const showAllSurveys = await this.canUserViewAllSurveys(updatedBy, roleUid, tenantUid);
        if (!showAllSurveys) {
            const existing = await this.repository.getByUid(tenantUid, uid);
            if (!existing || existing.assignedTo !== updatedBy) {
                throw new CustomError(SITE_SURVEY_MESSAGES.UNAUTHORIZED_USER, 403);
            }
        }

        const success = await this.repository.restore(tenantUid, uid, updatedBy);
        if (!success) {
            throw new CustomError(SITE_SURVEY_MESSAGES.RESTORE_FAILED, 500);
        }
    }

    async saveSurveyDetails(tenantUid: string, uid: string, data: ISaveSiteSurveyDetails, userUid: string, roleUid?: string): Promise<ISiteSurveySafe> {
        const survey = await this.repository.getByUid(tenantUid, uid);
        if (!survey) {
            throw new CustomError(SITE_SURVEY_MESSAGES.NOT_FOUND, 404);
        }

        const showAllSurveys = await this.canUserViewAllSurveys(userUid, roleUid, tenantUid);
        if (!showAllSurveys && survey.assignedTo !== userUid) {
            throw new CustomError(SITE_SURVEY_MESSAGES.UNAUTHORIZED_USER, 403);
        }

        if (survey.status !== 0 && survey.status !== 3) {
            throw new CustomError(SITE_SURVEY_MESSAGES.INVALID_SURVEY_STATUS, 400);
        }

        const existingDetails = await this.detailsRepository.getBySiteSurveyUid(tenantUid, uid);
        if (existingDetails) {
            throw new CustomError(SITE_SURVEY_MESSAGES.DETAILS_ALREADY_EXIST, 400);
        }

        try {
            const details = await this.detailsRepository.create(tenantUid, uid, data, userUid);
            if (data.notes) {
                await this.noteService.handleIncomingNote(tenantUid, 'site_survey_details', details.uid, data.notes, userUid);
                details.notes = data.notes;
            }
            // Update survey status to Completed (1)
            const updatedSurvey = await this.repository.update(tenantUid, uid, { status: 1 }, userUid);

            // Push Notification to assigned Sales Executive
            this.leadRepository.getByUid(tenantUid, survey.leadUid).then(lead => {
                if (lead) {
                    const feasibility = data.recommendedKw ? `${data.recommendedKw} kW Recommended` : "Completed";
                    this.sendSurveyCompletedPushNotification(tenantUid, updatedSurvey, lead, feasibility, userUid);
                }
            }).catch(err => {
                logger.error("Failed to trigger survey completed push notification:", err);
            });

            return toSiteSurveySafe(updatedSurvey, toSiteSurveyDetailsSafe(details));
        } catch (error) {
            logger.error("SiteSurveyService.saveSurveyDetails error", { error });
            throw new CustomError(SITE_SURVEY_MESSAGES.UPDATE_FAILED, 500);
        }
    }

    async updateSurveyDetails(tenantUid: string, uid: string, data: IUpdateSiteSurveyDetails, userUid: string, roleUid?: string): Promise<ISiteSurveySafe> {
        const survey = await this.repository.getByUid(tenantUid, uid);
        if (!survey) {
            throw new CustomError(SITE_SURVEY_MESSAGES.NOT_FOUND, 404);
        }

        const showAllSurveys = await this.canUserViewAllSurveys(userUid, roleUid, tenantUid);
        if (!showAllSurveys && survey.assignedTo !== userUid) {
            throw new CustomError(SITE_SURVEY_MESSAGES.UNAUTHORIZED_USER, 403);
        }

        if (!showAllSurveys && survey.status === 1) {
            // Once completed, regular users cannot update. Assume admins might reopen it by setting status back to 0 or 3.
            throw new CustomError(SITE_SURVEY_MESSAGES.SURVEY_COMPLETED, 400);
        }

        const existingDetails = await this.detailsRepository.getBySiteSurveyUid(tenantUid, uid);
        if (!existingDetails) {
            throw new CustomError(SITE_SURVEY_MESSAGES.DETAILS_NOT_FOUND, 404);
        }

        try {
            if (data.notes !== undefined) {
                await this.noteService.handleIncomingNote(tenantUid, 'site_survey_details', existingDetails.uid, data.notes, userUid);
            }
            const details = await this.detailsRepository.update(tenantUid, uid, data, userUid);
            if (data.notes !== undefined) {
                details.notes = data.notes || null;
            } else {
                details.notes = existingDetails.notes || null;
            }
            return toSiteSurveySafe(survey, toSiteSurveyDetailsSafe(details));
        } catch (error) {
            if (error instanceof CustomError) throw error;
            logger.error("SiteSurveyService.updateSurveyDetails error", { error });
            throw new CustomError(SITE_SURVEY_MESSAGES.UPDATE_FAILED, 500);
        }
    }

    /**
     * Helper to dispatch real-time FCM Push Notification when site survey is scheduled
     */
    private async sendSurveyScheduledPushNotification(
        tenantUid: string,
        survey: any,
        lead: any,
        assignedUserUid: string,
        createdBy?: string
    ): Promise<void> {
        try {
            const scheduledDate = survey.scheduledDate 
                ? (typeof survey.scheduledDate === 'string' ? survey.scheduledDate : new Date(survey.scheduledDate).toLocaleDateString('en-IN'))
                : "Scheduled Date";

            await notificationService.send({
                channel: NOTIFICATION_CHANNEL.PUSH,
                template: NOTIFICATION_TEMPLATE.SITE_SURVEY_SCHEDULED,
                recipient: assignedUserUid,
                module: "site_survey",
                referenceUid: survey.uid,
                tenantUid,
                createdBy: createdBy || "SYSTEM",
                variables: {
                    lead_number: lead.leadNumber || "Lead",
                    customer_name: `${lead.firstName || ""} ${lead.lastName || ""}`.trim() || "Customer",
                    scheduled_date: scheduledDate,
                    lead_uid: lead.uid,
                }
            });
        } catch (err) {
            logger.error("Error dispatching site survey scheduled push notification:", err);
        }
    }

    /**
     * Helper to dispatch real-time FCM Push Notification when site survey is completed
     */
    private async sendSurveyCompletedPushNotification(
        tenantUid: string,
        survey: any,
        lead: any,
        feasibility?: string,
        userUid?: string
    ): Promise<void> {
        try {
            if (!lead || !lead.assignedTo) return;

            await notificationService.send({
                channel: NOTIFICATION_CHANNEL.PUSH,
                template: NOTIFICATION_TEMPLATE.SITE_SURVEY_COMPLETED,
                recipient: lead.assignedTo,
                module: "site_survey",
                referenceUid: survey.uid,
                tenantUid,
                createdBy: userUid || "SYSTEM",
                variables: {
                    lead_number: lead.leadNumber || "Lead",
                    customer_name: `${lead.firstName || ""} ${lead.lastName || ""}`.trim() || "Customer",
                    feasibility: feasibility || "Completed",
                    lead_uid: lead.uid,
                }
            });
        } catch (err) {
            logger.error("Error dispatching site survey completed push notification:", err);
        }
    }
}
