import type { Request, Response, NextFunction } from "express";
import type { ProductBrandService } from "../services/product-brand.service.js";
import type { IAuthenticatedRequest } from "../../auth/interfaces/auth.interface.js";
import { PRODUCT_BRAND_MESSAGES } from "../constants/product-brand.constants.js";

export class ProductBrandController {
    private readonly service: ProductBrandService;

    constructor(service: ProductBrandService) {
        this.service = service;
    }

    public createBrand = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const file = req.file;
            const brand = await this.service.createBrand(req.body, file, (req as IAuthenticatedRequest).user.uid);
            res.status(201).json({
                success: true,
                message: PRODUCT_BRAND_MESSAGES.CREATED,
                data: brand,
            });
        } catch (error) {
            next(error);
        }
    };

    public updateBrand = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const uid = req.params.uid as string;
            const file = req.file;
            const brand = await this.service.updateBrand(uid, req.body, file, (req as IAuthenticatedRequest).user.uid);
            res.status(200).json({
                success: true,
                message: PRODUCT_BRAND_MESSAGES.UPDATED,
                data: brand,
            });
        } catch (error) {
            next(error);
        }
    };

    public getBrandByUid = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const uid = req.params.uid as string;
            const brand = await this.service.getBrandByUid(uid);
            res.status(200).json({
                success: true,
                message: PRODUCT_BRAND_MESSAGES.FETCHED,
                data: brand,
            });
        } catch (error) {
            next(error);
        }
    };

    public getPaginatedBrands = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.service.getPaginatedBrands(req.body);
            res.status(200).json({
                success: true,
                message: PRODUCT_BRAND_MESSAGES.FETCHED,
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

    public getDropdownBrands = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const brands = await this.service.getDropdownBrands();
            res.status(200).json({
                success: true,
                message: PRODUCT_BRAND_MESSAGES.FETCHED,
                data: brands,
            });
        } catch (error) {
            next(error);
        }
    };

    public deleteBrand = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const uid = req.params.uid as string;
            await this.service.softDeleteBrand(uid, (req as IAuthenticatedRequest).user.uid);
            res.status(200).json({
                success: true,
                message: PRODUCT_BRAND_MESSAGES.DELETED,
                data: null,
            });
        } catch (error) {
            next(error);
        }
    };

    public restoreBrand = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const uid = req.params.uid as string;
            await this.service.restoreBrand(uid, (req as IAuthenticatedRequest).user.uid);
            res.status(200).json({
                success: true,
                message: PRODUCT_BRAND_MESSAGES.RESTORED,
                data: null,
            });
        } catch (error) {
            next(error);
        }
    };
}
