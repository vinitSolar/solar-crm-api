import type { SiteSurveyDetailsRepository } from "../repositories/site-survey-details.repository.js";
import type { SiteSurveyRepository } from "../repositories/site-survey.repository.js";
import type { LeadRepository } from "../../leads/repositories/lead.repository.js";
// Assume UserRepository is available in users module
import type { UserRepository } from "../../users/repositories/user.repository.js";
import type { ICreateSiteSurvey, IUpdateSiteSurvey, ISiteSurveySafe, IPaginationQuery, IPaginatedResponse } from "../interfaces/site-survey.interface.js";
import type { ISaveSiteSurveyDetails, IUpdateSiteSurveyDetails, ISiteSurveyDetailsSafe } from "../interfaces/site-survey-details.interface.js";
import { toSiteSurveySafe, toSiteSurveyDetailsSafe } from "../dto/site-survey.dto.js";
import { CustomError } from "../../../middlewares/error.middleware.js";
import { SITE_SURVEY_MESSAGES } from "../constants/site-survey.constants.js";
import { logger } from "@packages/logger/index.js";

export class SiteSurveyService {
    private readonly repository: SiteSurveyRepository;
    private readonly detailsRepository: SiteSurveyDetailsRepository;
    private readonly leadRepository: LeadRepository;
    private readonly userRepository: UserRepository;

    constructor(
        repository: SiteSurveyRepository,
        detailsRepository: SiteSurveyDetailsRepository,
        leadRepository: LeadRepository,
        userRepository: UserRepository
    ) {
        this.repository = repository;
        this.detailsRepository = detailsRepository;
        this.leadRepository = leadRepository;
        this.userRepository = userRepository;
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
            throw new CustomError(SITE_SURVEY_MESSAGES.USER_NOT_FOUND, 400);
        }

        try {
            const survey = await this.repository.create(tenantUid, data, createdBy);
            return toSiteSurveySafe(survey);
        } catch (error) {
            logger.error("SiteSurveyService.createSiteSurvey error", { error });
            throw new CustomError(SITE_SURVEY_MESSAGES.CREATION_FAILED, 500);
        }
    }

    async getSiteSurveyByUid(tenantUid: string, uid: string): Promise<ISiteSurveySafe> {
        const survey = await this.repository.getByUid(tenantUid, uid);
        if (!survey) {
            throw new CustomError(SITE_SURVEY_MESSAGES.NOT_FOUND, 404);
        }

        const details = await this.detailsRepository.getBySiteSurveyUid(tenantUid, uid);
        const detailsSafe = details ? toSiteSurveyDetailsSafe(details) : undefined;

        return toSiteSurveySafe(survey, detailsSafe);
    }

    async getSiteSurveysPaginated(tenantUid: string, query: IPaginationQuery): Promise<IPaginatedResponse<ISiteSurveySafe>> {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = query.limit && query.limit > 0 ? query.limit : 10;
        
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
            query.assignedTo,
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

    async getAllSiteSurveys(tenantUid: string, status: "active" | "deleted" | "all" = "active"): Promise<ISiteSurveySafe[]> {
        const surveys = await this.repository.getAll(tenantUid, status);
        return surveys.map(survey => toSiteSurveySafe(survey));
    }

    async updateSiteSurvey(tenantUid: string, uid: string, data: IUpdateSiteSurvey, updatedBy: string): Promise<ISiteSurveySafe> {
        const existing = await this.repository.getByUid(tenantUid, uid);
        if (!existing) {
            throw new CustomError(SITE_SURVEY_MESSAGES.NOT_FOUND, 404);
        }

        if (data.assignedTo && data.assignedTo !== existing.assignedTo) {
            const user = await this.userRepository.getUserByUid(data.assignedTo, tenantUid);
            if (!user) {
                throw new CustomError(SITE_SURVEY_MESSAGES.USER_NOT_FOUND, 400);
            }
        }

        if (data.status !== undefined && (data.status < 0 || data.status > 3)) {
            throw new CustomError(SITE_SURVEY_MESSAGES.INVALID_STATUS, 400);
        }

        try {
            const updated = await this.repository.update(tenantUid, uid, data, updatedBy);
            return toSiteSurveySafe(updated);
        } catch (error) {
            logger.error("SiteSurveyService.updateSiteSurvey error", { error });
            throw new CustomError(SITE_SURVEY_MESSAGES.UPDATE_FAILED, 500);
        }
    }

    async changeSiteSurveyStatus(tenantUid: string, uid: string, status: number, updatedBy: string): Promise<ISiteSurveySafe> {
        const existing = await this.repository.getByUid(tenantUid, uid);
        if (!existing) {
            throw new CustomError(SITE_SURVEY_MESSAGES.NOT_FOUND, 404);
        }

        if (status < 0 || status > 3) {
            throw new CustomError(SITE_SURVEY_MESSAGES.INVALID_STATUS, 400);
        }

        try {
            const updated = await this.repository.update(tenantUid, uid, { status }, updatedBy);
            return toSiteSurveySafe(updated);
        } catch (error) {
            logger.error("SiteSurveyService.changeSiteSurveyStatus error", { error });
            throw new CustomError(SITE_SURVEY_MESSAGES.UPDATE_FAILED, 500);
        }
    }

    async deleteSiteSurvey(tenantUid: string, uid: string, deletedBy: string): Promise<void> {
        const existing = await this.repository.getByUid(tenantUid, uid);
        if (!existing) {
            throw new CustomError(SITE_SURVEY_MESSAGES.NOT_FOUND, 404);
        }

        const success = await this.repository.softDelete(tenantUid, uid, deletedBy);
        if (!success) {
            throw new CustomError(SITE_SURVEY_MESSAGES.DELETE_FAILED, 500);
        }
    }

    async restoreSiteSurvey(tenantUid: string, uid: string, updatedBy: string): Promise<void> {
        const success = await this.repository.restore(tenantUid, uid, updatedBy);
        if (!success) {
            throw new CustomError(SITE_SURVEY_MESSAGES.RESTORE_FAILED, 500);
        }
    }

    async saveSurveyDetails(tenantUid: string, uid: string, data: ISaveSiteSurveyDetails, userUid: string): Promise<ISiteSurveySafe> {
        const survey = await this.repository.getByUid(tenantUid, uid);
        if (!survey) {
            throw new CustomError(SITE_SURVEY_MESSAGES.NOT_FOUND, 404);
        }

        if (survey.assignedTo !== userUid) {
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
            // Update survey status to Completed (1)
            const updatedSurvey = await this.repository.update(tenantUid, uid, { status: 1 }, userUid);
            return toSiteSurveySafe(updatedSurvey, toSiteSurveyDetailsSafe(details));
        } catch (error) {
            logger.error("SiteSurveyService.saveSurveyDetails error", { error });
            throw new CustomError(SITE_SURVEY_MESSAGES.UPDATE_FAILED, 500);
        }
    }

    async updateSurveyDetails(tenantUid: string, uid: string, data: IUpdateSiteSurveyDetails, userUid: string): Promise<ISiteSurveySafe> {
        const survey = await this.repository.getByUid(tenantUid, uid);
        if (!survey) {
            throw new CustomError(SITE_SURVEY_MESSAGES.NOT_FOUND, 404);
        }

        if (survey.assignedTo !== userUid) {
            throw new CustomError(SITE_SURVEY_MESSAGES.UNAUTHORIZED_USER, 403);
        }

        if (survey.status === 1) {
            // Once completed, regular users cannot update. Assume admins might reopen it by setting status back to 0 or 3.
            throw new CustomError(SITE_SURVEY_MESSAGES.SURVEY_COMPLETED, 400);
        }

        const existingDetails = await this.detailsRepository.getBySiteSurveyUid(tenantUid, uid);
        if (!existingDetails) {
            throw new CustomError(SITE_SURVEY_MESSAGES.DETAILS_NOT_FOUND, 404);
        }

        try {
            const details = await this.detailsRepository.update(tenantUid, uid, data, userUid);
            return toSiteSurveySafe(survey, toSiteSurveyDetailsSafe(details));
        } catch (error) {
            logger.error("SiteSurveyService.updateSurveyDetails error", { error });
            throw new CustomError(SITE_SURVEY_MESSAGES.UPDATE_FAILED, 500);
        }
    }
}
