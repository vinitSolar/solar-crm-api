import type { Request, Response, NextFunction } from "express";
import type { ProductUnitService } from "../services/product-unit.service.js";
import type { IAuthenticatedRequest } from "../../auth/interfaces/auth.interface.js";
import { PRODUCT_UNIT_MESSAGES } from "../constants/product-unit.constants.js";

export class ProductUnitController {
    private readonly service: ProductUnitService;

    constructor(service: ProductUnitService) {
        this.service = service;
    }

    public createUnit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const unit = await this.service.createUnit(req.body, (req as IAuthenticatedRequest).user.uid);
            res.status(201).json({
                success: true,
                message: PRODUCT_UNIT_MESSAGES.CREATED,
                data: unit,
            });
        } catch (error) {
            next(error);
        }
    };

    public updateUnit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const uid = req.params.uid as string;
            const unit = await this.service.updateUnit(uid, req.body, (req as IAuthenticatedRequest).user.uid);
            res.status(200).json({
                success: true,
                message: PRODUCT_UNIT_MESSAGES.UPDATED,
                data: unit,
            });
        } catch (error) {
            next(error);
        }
    };

    public getUnitByUid = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const uid = req.params.uid as string;
            const unit = await this.service.getUnitByUid(uid);
            res.status(200).json({
                success: true,
                message: PRODUCT_UNIT_MESSAGES.FETCHED,
                data: unit,
            });
        } catch (error) {
            next(error);
        }
    };

    public getPaginatedUnits = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await this.service.getPaginatedUnits(req.body);
            res.status(200).json({
                success: true,
                message: PRODUCT_UNIT_MESSAGES.FETCHED,
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

    public getDropdownUnits = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const units = await this.service.getDropdownUnits();
            res.status(200).json({
                success: true,
                message: PRODUCT_UNIT_MESSAGES.FETCHED,
                data: units,
            });
        } catch (error) {
            next(error);
        }
    };

    public deleteUnit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const uid = req.params.uid as string;
            await this.service.softDeleteUnit(uid, (req as IAuthenticatedRequest).user.uid);
            res.status(200).json({
                success: true,
                message: PRODUCT_UNIT_MESSAGES.DELETED,
                data: null,
            });
        } catch (error) {
            next(error);
        }
    };

    public restoreUnit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const uid = req.params.uid as string;
            await this.service.restoreUnit(uid, (req as IAuthenticatedRequest).user.uid);
            res.status(200).json({
                success: true,
                message: PRODUCT_UNIT_MESSAGES.RESTORED,
                data: null,
            });
        } catch (error) {
            next(error);
        }
    };
}

