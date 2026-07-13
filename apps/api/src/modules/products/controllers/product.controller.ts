import type { Request, Response, NextFunction } from "express";
import type { IAuthenticatedRequest } from "../../auth/interfaces/auth.interface.js";
import type { ProductService } from "../services/product.service.js";
import { PRODUCT_MESSAGES } from "../constants/product.constants.js";

export class ProductController {
    private readonly service: ProductService;

    constructor(service: ProductService) {
        this.service = service;
    }

    public createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const files = (req.files as Express.Multer.File[]) || [];
            const product = await this.service.createProduct(req.body, files, authReq.user.uid);
            res.status(201).json({
                success: true,
                message: PRODUCT_MESSAGES.CREATED,
                data: product,
            });
        } catch (error) {
            next(error);
        }
    };

    public updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const uid = req.params.uid as string;
            const files = (req.files as Express.Multer.File[]) || [];
            const product = await this.service.updateProduct(uid, req.body, files, authReq.user.uid);
            res.status(200).json({
                success: true,
                message: PRODUCT_MESSAGES.UPDATED,
                data: product,
            });
        } catch (error) {
            next(error);
        }
    };

    public getProductByUid = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const uid = req.params.uid as string;
            const product = await this.service.getProductByUid(uid);
            res.status(200).json({
                success: true,
                message: PRODUCT_MESSAGES.FETCHED,
                data: product,
            });
        } catch (error) {
            next(error);
        }
    };

    public getPaginatedProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.service.getPaginatedProducts(req.body);
            res.status(200).json({
                success: true,
                message: PRODUCT_MESSAGES.FETCHED,
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

    public getDropdownProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const products = await this.service.getDropdownProducts();
            res.status(200).json({
                success: true,
                message: PRODUCT_MESSAGES.FETCHED,
                data: products,
            });
        } catch (error) {
            next(error);
        }
    };



    public deleteProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const uid = req.params.uid as string;
            await this.service.softDeleteProduct(uid, authReq.user.uid);
            res.status(200).json({
                success: true,
                message: PRODUCT_MESSAGES.DELETED,
                data: null,
            });
        } catch (error) {
            next(error);
        }
    };

    public restoreProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const uid = req.params.uid as string;
            await this.service.restoreProduct(uid, authReq.user.uid);
            res.status(200).json({
                success: true,
                message: PRODUCT_MESSAGES.RESTORED,
                data: null,
            });
        } catch (error) {
            next(error);
        }
    };
}
