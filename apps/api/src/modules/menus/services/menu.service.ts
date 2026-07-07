import { MenuRepository } from "../repositories/menu.repository.js";
import type { ICreateMenuRequest, IUpdateMenuRequest, IMenuPaginationQuery } from "../interfaces/menu.interface.js";
import { toSafeMenu, type SafeMenu } from "../dto/menu.dto.js";
import { MENU_MESSAGES } from "../constants/menu.constants.js";
import { CustomError } from "../../../middlewares/error.middleware.js";
import { v4 as uuidv4 } from "uuid";

export class MenuService {
    private readonly menuRepository: MenuRepository;

    constructor(menuRepository: MenuRepository) {
        this.menuRepository = menuRepository;
    }

    async createMenu(data: ICreateMenuRequest): Promise<SafeMenu> {
        // Check if code is unique
        const existingCode = await this.menuRepository.findByCode(data.code);
        if (existingCode) {
            throw new CustomError(MENU_MESSAGES.CODE_EXISTS, 400);
        }

        // Check if parent exists
        if (data.parentUid) {
            const parent = await this.menuRepository.findByUid(data.parentUid);
            if (!parent) {
                throw new CustomError(MENU_MESSAGES.PARENT_NOT_FOUND, 404);
            }
        }

        const uid = uuidv4();
        const menu = await this.menuRepository.create({ ...data, uid });

        return toSafeMenu(menu);
    }

    async updateMenu(uid: string, data: IUpdateMenuRequest): Promise<SafeMenu> {
        const menu = await this.menuRepository.findByUid(uid);
        if (!menu) {
            throw new CustomError(MENU_MESSAGES.NOT_FOUND, 404);
        }

        if (data.code && data.code !== menu.code) {
            const existingCode = await this.menuRepository.findByCode(data.code);
            if (existingCode) {
                throw new CustomError(MENU_MESSAGES.CODE_EXISTS, 400);
            }
        }

        if (data.parentUid) {
            const parent = await this.menuRepository.findByUid(data.parentUid);
            if (!parent) {
                throw new CustomError(MENU_MESSAGES.PARENT_NOT_FOUND, 404);
            }
        }

        const updatedMenu = await this.menuRepository.update(uid, data);
        if (!updatedMenu) {
            throw new CustomError(MENU_MESSAGES.NOT_FOUND, 404);
        }

        return toSafeMenu(updatedMenu);
    }

    async getMenuByUid(uid: string): Promise<SafeMenu> {
        const menu = await this.menuRepository.findByUid(uid);
        if (!menu) {
            throw new CustomError(MENU_MESSAGES.NOT_FOUND, 404);
        }

        return toSafeMenu(menu);
    }

    async getAllMenus(status?: "active" | "deleted" | "all"): Promise<SafeMenu[]> {
        const menus = await this.menuRepository.findAll(status);
        return menus.map(toSafeMenu);
    }

    async getMenusByPagination(query: IMenuPaginationQuery): Promise<{ data: SafeMenu[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
        const status = query.status || "active";
        const result = await this.menuRepository.findPaginated(query.page, query.limit, query.search, status);

        return {
            data: result.menus.map(toSafeMenu),
            meta: {
                total: result.total,
                page: query.page,
                limit: query.limit,
                totalPages: Math.ceil(result.total / query.limit),
            },
        };
    }

    async deleteMenu(uid: string): Promise<void> {
        const menu = await this.menuRepository.findByUid(uid);
        if (!menu) {
            throw new CustomError(MENU_MESSAGES.NOT_FOUND, 404);
        }

        await this.menuRepository.softDelete(uid);
    }

    async restoreMenu(uid: string): Promise<void> {
        const menu = await this.menuRepository.findByUid(uid);
        if (!menu) {
            throw new CustomError(MENU_MESSAGES.NOT_FOUND, 404);
        }

        await this.menuRepository.restore(uid);
    }
}
