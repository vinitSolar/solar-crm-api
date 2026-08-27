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
            
            if (req.body.service_area_city_uids) {
                req.body.serviceAreaCityUids = req.body.service_area_city_uids;
            }
            
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
            if (req.body.service_area_city_uids) {
                req.body.serviceAreaCityUids = req.body.service_area_city_uids;
            }

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

    /**
     * Upload franchise logo.
     */
    public uploadLogo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const uid = req.params.uid as string;
            const updatedBy = authReq.user?.uid || "system"; // Assumes auth middleware populates req.user

            if (!req.file) {
                res.status(400).json({
                    success: false,
                    message: "No logo file provided",
                    errors: [{ message: "File is required", path: "file" }],
                });
                return;
            }

            const file = req.file;
            const { storageService } = await import("@packages/storage/index.js");

            // Fetch franchise to get the code
            const franchiseData = await this.franchiseService.getFranchiseByUid(uid);
            const code = franchiseData.franchise.code;

            // Upload the file
            const logoUrl = await storageService.uploadFile(file.buffer, file.originalname, file.mimetype, `franchises/${code}_${uid}/logos`);

            // Update the franchise
            await this.franchiseService.updateLogo(uid, logoUrl, updatedBy);

            res.status(200).json({
                success: true,
                message: "Logo uploaded successfully",
                data: { logo: logoUrl },
            });
        } catch (error) {
            next(error);
        }
    };


    /**
     * Get service areas for a specific franchise.
     */
    getServiceAreas = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const uid = req.params.uid as string;
            logger.info("FranchiseController.getServiceAreas", { uid, userUid: authReq.user.uid });

            const serviceAreas = await this.franchiseService.getServiceAreas(uid);

            res.status(200).json({
                success: true,
                message: "Service areas fetched successfully.",
                data: serviceAreas,
            });
        } catch (error) {
            next(error);
        }
    };

    // ─── Documents ──────────────────────────────────────────────────

    getDocumentTypes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const uid = req.params.uid as string;
            logger.info("FranchiseController.getDocumentTypes", { uid, userUid: authReq.user.uid });

            const types = await this.franchiseService.getDocumentTypes(uid);

            res.status(200).json({
                success: true,
                message: "Document types fetched successfully.",
                data: types,
            });
        } catch (error) {
            next(error);
        }
    };

    getDocuments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const uid = req.params.uid as string;
            logger.info("FranchiseController.getDocuments", { uid, userUid: authReq.user.uid });

            const docs = await this.franchiseService.getDocuments(uid);

            res.status(200).json({
                success: true,
                message: "Documents fetched successfully.",
                data: docs,
            });
        } catch (error) {
            next(error);
        }
    };

    uploadDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const uid = req.params.uid as string;
            const createdBy = authReq.user.uid;

            if (!req.file) {
                res.status(400).json({
                    success: false,
                    message: "No document file provided",
                    errors: [{ message: "File is required", path: "file" }],
                });
                return;
            }

            const documentTypeUid = req.body.documentTypeUid as string;
            if (!documentTypeUid) {
                res.status(400).json({
                    success: false,
                    message: "documentTypeUid is required",
                    errors: [{ message: "documentTypeUid is required", path: "documentTypeUid" }],
                });
                return;
            }
            const documentNumber = req.body.documentNumber as string | undefined;

            const doc = await this.franchiseService.uploadDocument(uid, documentTypeUid, req.file, documentNumber, createdBy);

            res.status(200).json({
                success: true,
                message: "Document uploaded successfully",
                data: doc,
            });
        } catch (error) {
            next(error);
        }
    };

    deleteDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const uid = req.params.uid as string;
            const documentUid = req.params.documentUid as string;
            const deletedBy = authReq.user.uid;

            await this.franchiseService.deleteDocument(uid, documentUid, deletedBy);

            res.status(200).json({
                success: true,
                message: "Document deleted successfully",
                data: null,
            });
        } catch (error) {
            next(error);
        }
    };
    getSettingsMetadata = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const targetUid = req.params.uid || authReq.user.tenantUid;
            const metadata = await this.franchiseService.getSettingsMetadata(targetUid);

            res.status(200).json({
                success: true,
                message: "Metadata fetched successfully",
                data: metadata,
            });
        } catch (error) {
            next(error);
        }
    };

    createSettingsMetadata = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const targetUid = req.params.uid || authReq.user.tenantUid;
            const { type, ...data } = req.body;
            
            if (!type) {
                throw new CustomError("Type is required", 400);
            }

            const result = await this.franchiseService.createSettingsMetadata(targetUid, type, data, authReq.user.uid);

            res.status(201).json({
                success: true,
                message: "Metadata created successfully",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    updateSettingsMetadata = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const targetUid = req.params.uid || authReq.user.tenantUid;
            const itemUid = req.params.itemUid;
            const { type, ...data } = req.body;

            if (!type) {
                throw new CustomError("Type is required", 400);
            }

            const result = await this.franchiseService.updateSettingsMetadata(targetUid, itemUid, type, data, authReq.user.uid);

            res.status(200).json({
                success: true,
                message: "Metadata updated successfully",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    };

    deleteSettingsMetadata = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const targetUid = req.params.uid || authReq.user.tenantUid;
            const itemUid = req.params.itemUid;
            const type = req.query.type as string;

            if (!type) {
                throw new CustomError("Type query parameter is required", 400);
            }

            await this.franchiseService.deleteSettingsMetadata(targetUid, itemUid, type, authReq.user.uid);

            res.status(200).json({
                success: true,
                message: "Metadata deleted successfully",
                data: null,
            });
        } catch (error) {
            next(error);
        }
    };
}
