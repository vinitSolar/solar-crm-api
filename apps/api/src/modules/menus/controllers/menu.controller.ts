import type { Request, Response, NextFunction } from "express";
import type { MenuService } from "../services/menu.service.js";
import type { IAuthenticatedRequest } from "../../auth/interfaces/auth.interface.js";
import type { ICreateMenuRequest, IUpdateMenuRequest, IMenuPaginationQuery } from "../interfaces/menu.interface.js";
import { MENU_MESSAGES } from "../constants/menu.constants.js";
import { logger } from "@packages/logger/index.js";

export class MenuController {
    private readonly menuService: MenuService;

    constructor(menuService: MenuService) {
        this.menuService = menuService;
    }

    createMenu = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const data = req.body as ICreateMenuRequest;

            logger.info("MenuController.createMenu", { createdBy: authReq.user.uid });

            const menu = await this.menuService.createMenu(data);

            res.status(201).json({
                success: true,
                message: MENU_MESSAGES.CREATED_SUCCESS,
                data: { menu },
            });
        } catch (error) {
            next(error);
        }
    };

    getMenus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            logger.info("MenuController.getMenus", { userUid: authReq.user.uid });

            const page = req.body.page ? parseInt(req.body.page as string, 10) : 1;
            const limit = req.body.limit ? parseInt(req.body.limit as string, 10) : 10;
            const search = req.body.search as string | undefined;
            const status = req.body.status as "active" | "deleted" | "all" | undefined;

            const query: IMenuPaginationQuery = { page, limit };
            if (search) query.search = search;
            if (status) query.status = status;

            const paginatedResponse = await this.menuService.getMenusByPagination(query);

            res.status(200).json({
                success: true,
                message: MENU_MESSAGES.FETCHED_SUCCESS,
                ...paginatedResponse,
            });
        } catch (error) {
            next(error);
        }
    };

    getAllMenus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const status = req.query.status as "active" | "deleted" | "all" | undefined;
            logger.info("MenuController.getAllMenus", { userUid: authReq.user.uid, status });

            const menus = await this.menuService.getAllMenus(status);

            res.status(200).json({
                success: true,
                message: MENU_MESSAGES.FETCHED_ALL_SUCCESS,
                data: menus,
            });
        } catch (error) {
            next(error);
        }
    };

    getMenuByUid = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const uid = req.params.uid as string;
            logger.info("MenuController.getMenuByUid", { uid, userUid: authReq.user.uid });

            const menu = await this.menuService.getMenuByUid(uid);

            res.status(200).json({
                success: true,
                message: MENU_MESSAGES.FETCHED_ONE_SUCCESS,
                data: { menu },
            });
        } catch (error) {
            next(error);
        }
    };

    updateMenu = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const uid = req.params.uid as string;
            const data = req.body as IUpdateMenuRequest;
            logger.info("MenuController.updateMenu", { uid, userUid: authReq.user.uid });

            const menu = await this.menuService.updateMenu(uid, data);

            res.status(200).json({
                success: true,
                message: MENU_MESSAGES.UPDATED_SUCCESS,
                data: { menu },
            });
        } catch (error) {
            next(error);
        }
    };

    deleteMenu = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const uid = req.params.uid as string;
            logger.info("MenuController.deleteMenu", { uid, userUid: authReq.user.uid });

            await this.menuService.deleteMenu(uid);

            res.status(200).json({
                success: true,
                message: MENU_MESSAGES.DELETED_SUCCESS,
                data: {},
            });
        } catch (error) {
            next(error);
        }
    };

    restoreMenu = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const uid = req.params.uid as string;
            logger.info("MenuController.restoreMenu", { uid, userUid: authReq.user.uid });

            await this.menuService.restoreMenu(uid);

            res.status(200).json({
                success: true,
                message: MENU_MESSAGES.RESTORED_SUCCESS,
                data: {},
            });
        } catch (error) {
            next(error);
        }
    };
}
