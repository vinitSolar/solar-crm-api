import type { Request, Response, NextFunction } from "express";
import type { ProductCategoryService } from "../services/product-category.service.js";
import type { IAuthenticatedRequest } from "../../auth/interfaces/auth.interface.js";
import { PRODUCT_CATEGORY_MESSAGES } from "../constants/product-category.constants.js";

export class ProductCategoryController {
    private readonly service: ProductCategoryService;

    constructor(service: ProductCategoryService) {
        this.service = service;
    }

    public createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const file = req.file;
            const category = await this.service.createCategory(req.body, file, (req as IAuthenticatedRequest).user.uid);
            res.status(201).json({
                success: true,
                message: PRODUCT_CATEGORY_MESSAGES.CREATED,
                data: category,
            });
        } catch (error) {
            next(error);
        }
    };

    public updateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const uid = req.params.uid as string;
            const file = req.file;
            const category = await this.service.updateCategory(uid, req.body, file, (req as IAuthenticatedRequest).user.uid);
            res.status(200).json({
                success: true,
                message: PRODUCT_CATEGORY_MESSAGES.UPDATED,
                data: category,
            });
        } catch (error) {
            next(error);
        }
    };

    public getCategoryByUid = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const uid = req.params.uid as string;
            const category = await this.service.getCategoryByUid(uid);
            res.status(200).json({
                success: true,
                message: PRODUCT_CATEGORY_MESSAGES.FETCHED,
                data: category,
            });
        } catch (error) {
            next(error);
        }
    };

    public getPaginatedCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.service.getPaginatedCategories(req.body);
            res.status(200).json({
                success: true,
                message: PRODUCT_CATEGORY_MESSAGES.FETCHED,
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

    public getDropdownCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const categories = await this.service.getDropdownCategories();
            res.status(200).json({
                success: true,
                message: PRODUCT_CATEGORY_MESSAGES.FETCHED,
                data: categories,
            });
        } catch (error) {
            next(error);
        }
    };

    public deleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const uid = req.params.uid as string;
            await this.service.softDeleteCategory(uid, (req as IAuthenticatedRequest).user.uid);
            res.status(200).json({
                success: true,
                message: PRODUCT_CATEGORY_MESSAGES.DELETED,
                data: null,
            });
        } catch (error) {
            next(error);
        }
    };

    public restoreCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const uid = req.params.uid as string;
            await this.service.restoreCategory(uid, (req as IAuthenticatedRequest).user.uid);
            res.status(200).json({
                success: true,
                message: PRODUCT_CATEGORY_MESSAGES.RESTORED,
                data: null,
            });
        } catch (error) {
            next(error);
        }
    };
}
