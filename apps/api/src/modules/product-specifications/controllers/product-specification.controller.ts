import type { Request, Response, NextFunction } from "express";
import type { ProductSpecificationService } from "../services/product-specification.service.js";
import type { IAuthenticatedRequest } from "../../auth/interfaces/auth.interface.js";
import { PRODUCT_SPECIFICATION_MESSAGES } from "../constants/product-specification.constants.js";

export class ProductSpecificationController {
    private readonly service: ProductSpecificationService;

    constructor(service: ProductSpecificationService) {
        this.service = service;
    }

    public createSpecification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const spec = await this.service.createSpecification(req.body, (req as IAuthenticatedRequest).user.uid);
            res.status(201).json({
                success: true,
                message: PRODUCT_SPECIFICATION_MESSAGES.CREATED,
                data: spec,
            });
        } catch (error) {
            next(error);
        }
    };

    public updateSpecification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const uid = req.params.uid as string;
            const spec = await this.service.updateSpecification(uid, req.body, (req as IAuthenticatedRequest).user.uid);
            res.status(200).json({
                success: true,
                message: PRODUCT_SPECIFICATION_MESSAGES.UPDATED,
                data: spec,
            });
        } catch (error) {
            next(error);
        }
    };
    
    public mapSpecificationToCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const categoryUid = req.params.categoryUid as string;
            const spec = await this.service.mapSpecificationToCategory(categoryUid, req.body, (req as IAuthenticatedRequest).user.uid);
            res.status(201).json({
                success: true,
                message: "Specification mapped to category successfully.",
                data: spec,
            });
        } catch (error) {
            next(error);
        }
    };
    
    public updateCategoryMapping = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const categoryUid = req.params.categoryUid as string;
            const specificationUid = req.params.specificationUid as string;
            const spec = await this.service.updateCategoryMapping(categoryUid, specificationUid, req.body, (req as IAuthenticatedRequest).user.uid);
            res.status(200).json({
                success: true,
                message: "Category specification mapping updated successfully.",
                data: spec,
            });
        } catch (error) {
            next(error);
        }
    };

    public getSpecificationByUid = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const uid = req.params.uid as string;
            const spec = await this.service.getSpecificationByUid(uid);
            res.status(200).json({
                success: true,
                message: PRODUCT_SPECIFICATION_MESSAGES.FETCHED,
                data: spec,
            });
        } catch (error) {
            next(error);
        }
    };

    public getPaginatedSpecifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.service.getPaginatedSpecifications(req.body);
            res.status(200).json({
                success: true,
                message: PRODUCT_SPECIFICATION_MESSAGES.FETCHED,
                data: result.data,
                meta: {
                    total: result.total,
                    page: req.body.page,
                    limit: req.body.limit,
                    totalPages: result.totalPages,
                },
            });
        } catch (error) {
            next(error);
        }
    };

    public deleteSpecification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const uid = req.params.uid as string;
            await this.service.softDeleteSpecification(uid, (req as IAuthenticatedRequest).user.uid);
            res.status(200).json({
                success: true,
                message: PRODUCT_SPECIFICATION_MESSAGES.DELETED,
                data: null,
            });
        } catch (error) {
            next(error);
        }
    };
}
