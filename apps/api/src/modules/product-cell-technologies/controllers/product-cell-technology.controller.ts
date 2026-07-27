import type { Request, Response, NextFunction } from "express";
import type { IAuthenticatedRequest } from "../../auth/interfaces/auth.interface.js";
import type { ProductCellTechnologyService } from "../services/product-cell-technology.service.js";
import { PRODUCT_CELL_TECHNOLOGY_MESSAGES } from "../constants/messages.js";

export class ProductCellTechnologyController {
    private readonly service: ProductCellTechnologyService;

    constructor(service: ProductCellTechnologyService) {
        this.service = service;
    }

    public create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const data = await this.service.create(req.body, authReq.user.uid, req.ip);
            res.status(201).json({
                success: true,
                message: PRODUCT_CELL_TECHNOLOGY_MESSAGES.CREATE_SUCCESS,
                data,
            });
        } catch (error) {
            next(error);
        }
    };

    public update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const uid = req.params.uid as string;
            const data = await this.service.update(uid, req.body, authReq.user.uid, req.ip);
            res.status(200).json({
                success: true,
                message: PRODUCT_CELL_TECHNOLOGY_MESSAGES.UPDATE_SUCCESS,
                data,
            });
        } catch (error) {
            next(error);
        }
    };

    public delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const uid = req.params.uid as string;
            await this.service.delete(uid, authReq.user.uid, req.ip);
            res.status(200).json({
                success: true,
                message: PRODUCT_CELL_TECHNOLOGY_MESSAGES.DELETE_SUCCESS,
                data: null,
            });
        } catch (error) {
            next(error);
        }
    };

    public getDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const uid = req.params.uid as string;
            const data = await this.service.getDetails(uid);
            res.status(200).json({
                success: true,
                message: PRODUCT_CELL_TECHNOLOGY_MESSAGES.FETCH_SUCCESS,
                data,
            });
        } catch (error) {
            next(error);
        }
    };

    public list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { page, limit, search, status } = req.body;
            const data = await this.service.list(page, limit, search, status);
            res.status(200).json({
                success: true,
                message: PRODUCT_CELL_TECHNOLOGY_MESSAGES.LIST_SUCCESS,
                ...data, // Contains data and meta
            });
        } catch (error) {
            next(error);
        }
    };

    public findAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const status = (req.query.status as "active" | "deleted" | "all") || "active";
            const data = await this.service.findAll(status);
            res.status(200).json({
                success: true,
                message: PRODUCT_CELL_TECHNOLOGY_MESSAGES.LIST_SUCCESS,
                data,
            });
        } catch (error) {
            next(error);
        }
    };
}
