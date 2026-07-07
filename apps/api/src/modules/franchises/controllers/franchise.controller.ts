import type { Request, Response, NextFunction } from "express";
import type { FranchiseService } from "../services/franchise.service.js";
import type { IAuthenticatedRequest } from "../../auth/interfaces/auth.interface.js";
import type { ICreateFranchiseRequest, IUpdateFranchiseRequest, IFranchisePaginationQuery } from "../interfaces/franchise.interface.js";
import { FRANCHISE_MESSAGES } from "../constants/franchise.constants.js";
import { logger } from "@packages/logger/index.js";

/**
 * Franchise Controller.
 *
 * Thin controller — validates request, calls service, returns response.
 * No business logic allowed here.
 */
export class FranchiseController {
    private readonly franchiseService: FranchiseService;

    constructor(franchiseService: FranchiseService) {
        this.franchiseService = franchiseService;
    }

    createFranchise = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const data = req.body as ICreateFranchiseRequest;

            logger.info("FranchiseController.createFranchise", { code: data.franchise.code, createdBy: authReq.user.uid });

            const franchise = await this.franchiseService.createFranchise(data, authReq.user.uid);

            res.status(201).json({
                success: true,
                message: FRANCHISE_MESSAGES.CREATED_SUCCESS,
                data: { franchise },
            });
        } catch (error) {
            next(error);
        }
    };

    getFranchises = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            logger.info("FranchiseController.getFranchises", { userUid: authReq.user.uid });

            const page = req.body.page ? parseInt(req.body.page as string, 10) : 1;
            const limit = req.body.limit ? parseInt(req.body.limit as string, 10) : 10;
            const search = req.body.search as string | undefined;
            const status = req.body.status as "active" | "deleted" | "all" | undefined;

            const query: IFranchisePaginationQuery = { page, limit };
            if (search) query.search = search;
            if (status) query.status = status;

            const paginatedResponse = await this.franchiseService.getFranchisesByPagination(query);

            res.status(200).json({
                success: true,
                message: FRANCHISE_MESSAGES.FETCHED_SUCCESS,
                ...paginatedResponse,
            });
        } catch (error) {
            next(error);
        }
    };

    getAllFranchises = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const status = req.query.status as "active" | "deleted" | "all" | undefined;
            logger.info("FranchiseController.getAllFranchises", { userUid: authReq.user.uid, status });

            const franchises = await this.franchiseService.getAllFranchises(status);

            res.status(200).json({
                success: true,
                message: FRANCHISE_MESSAGES.FETCHED_ALL_SUCCESS,
                data: franchises,
            });
        } catch (error) {
            next(error);
        }
    };

    getFranchiseByUid = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const uid = req.params.uid as string;
            logger.info("FranchiseController.getFranchiseByUid", { uid, userUid: authReq.user.uid });

            const detail = await this.franchiseService.getFranchiseByUid(uid);

            res.status(200).json({
                success: true,
                message: FRANCHISE_MESSAGES.FETCHED_ONE_SUCCESS,
                data: detail,
            });
        } catch (error) {
            next(error);
        }
    };

    updateFranchise = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const uid = req.params.uid as string;
            const data = req.body as IUpdateFranchiseRequest;

            logger.info("FranchiseController.updateFranchise", { uid, userUid: authReq.user.uid });

            const detail = await this.franchiseService.updateFranchise(uid, data, authReq.user.uid);

            res.status(200).json({
                success: true,
                message: FRANCHISE_MESSAGES.UPDATED_SUCCESS,
                data: detail,
            });
        } catch (error) {
            next(error);
        }
    };

    deleteFranchise = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const uid = req.params.uid as string;

            logger.info("FranchiseController.deleteFranchise", { uid, userUid: authReq.user.uid });

            await this.franchiseService.deleteFranchise(uid, authReq.user.uid);

            res.status(200).json({
                success: true,
                message: FRANCHISE_MESSAGES.DELETED_SUCCESS,
                data: null,
            });
        } catch (error) {
            next(error);
        }
    };

    restoreFranchise = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const uid = req.params.uid as string;

            logger.info("FranchiseController.restoreFranchise", { uid, userUid: authReq.user.uid });

            await this.franchiseService.restoreFranchise(uid, authReq.user.uid);

            res.status(200).json({
                success: true,
                message: FRANCHISE_MESSAGES.RESTORED_SUCCESS,
                data: null,
            });
        } catch (error) {
            next(error);
        }
    };
}
