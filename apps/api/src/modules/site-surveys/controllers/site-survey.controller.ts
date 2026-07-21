import type { Request, Response, NextFunction } from "express";
import type { SiteSurveyService } from "../services/site-survey.service.js";
import { SITE_SURVEY_MESSAGES } from "../constants/site-survey.constants.js";
import type { IAuthenticatedRequest } from "../../auth/interfaces/auth.interface.js";

export class SiteSurveyController {
    private readonly service: SiteSurveyService;

    constructor(service: SiteSurveyService) {
        this.service = service;
    }

    createSiteSurvey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const userUid = authReq.user.uid;

            const survey = await this.service.createSiteSurvey(tenantUid, req.body, userUid);
            res.status(201).json({
                success: true,
                message: SITE_SURVEY_MESSAGES.CREATED,
                data: survey,
            });
        } catch (error) {
            next(error);
        }
    };

    getSiteSurveyByUid = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const uid = req.params.uid as string;

            const survey = await this.service.getSiteSurveyByUid(tenantUid, uid);
            res.status(200).json({
                success: true,
                message: SITE_SURVEY_MESSAGES.FETCHED_SUCCESSFULLY,
                data: survey,
            });
        } catch (error) {
            next(error);
        }
    };

    getSiteSurveysPaginated = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const query = req.body;

            const result = await this.service.getSiteSurveysPaginated(tenantUid, query);
            res.status(200).json({
                success: true,
                message: SITE_SURVEY_MESSAGES.FETCHED_SUCCESSFULLY,
                data: result.data,
                meta: result.meta,
            });
        } catch (error) {
            next(error);
        }
    };

    getAllSiteSurveys = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const status = req.query.status as "active" | "deleted" | "all" | undefined;

            const surveys = await this.service.getAllSiteSurveys(tenantUid, status);
            res.status(200).json({
                success: true,
                message: SITE_SURVEY_MESSAGES.FETCHED_SUCCESSFULLY,
                data: surveys,
            });
        } catch (error) {
            next(error);
        }
    };

    updateSiteSurvey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const userUid = authReq.user.uid;
            const uid = req.params.uid as string;

            const survey = await this.service.updateSiteSurvey(tenantUid, uid, req.body, userUid);
            res.status(200).json({
                success: true,
                message: SITE_SURVEY_MESSAGES.UPDATED,
                data: survey,
            });
        } catch (error) {
            next(error);
        }
    };

    changeStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const userUid = authReq.user.uid;
            const uid = req.params.uid as string;
            const { status } = req.body;

            const survey = await this.service.changeSiteSurveyStatus(tenantUid, uid, status, userUid);
            res.status(200).json({
                success: true,
                message: SITE_SURVEY_MESSAGES.UPDATED,
                data: survey,
            });
        } catch (error) {
            next(error);
        }
    };

    deleteSiteSurvey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const userUid = authReq.user.uid;
            const uid = req.params.uid as string;

            await this.service.deleteSiteSurvey(tenantUid, uid, userUid);
            res.status(200).json({
                success: true,
                message: SITE_SURVEY_MESSAGES.DELETED,
                data: null,
            });
        } catch (error) {
            next(error);
        }
    };

    restoreSiteSurvey = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const userUid = authReq.user.uid;
            const uid = req.params.uid as string;

            await this.service.restoreSiteSurvey(tenantUid, uid, userUid);
            res.status(200).json({
                success: true,
                message: SITE_SURVEY_MESSAGES.RESTORED,
                data: null,
            });
        } catch (error) {
            next(error);
        }
    };

    saveSurveyDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const userUid = authReq.user.uid;
            const uid = req.params.uid as string;

            const survey = await this.service.saveSurveyDetails(tenantUid, uid, req.body, userUid);
            res.status(201).json({
                success: true,
                message: SITE_SURVEY_MESSAGES.DETAILS_SAVED,
                data: survey,
            });
        } catch (error) {
            next(error);
        }
    };

    updateSurveyDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid;
            const userUid = authReq.user.uid;
            const uid = req.params.uid as string;

            const survey = await this.service.updateSurveyDetails(tenantUid, uid, req.body, userUid);
            res.status(200).json({
                success: true,
                message: SITE_SURVEY_MESSAGES.DETAILS_UPDATED,
                data: survey,
            });
        } catch (error) {
            next(error);
        }
    };
}
