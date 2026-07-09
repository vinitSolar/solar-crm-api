import type { UserPermissionRepository } from "../repositories/user-permission.repository.js";
import type { UserRepository } from "../../users/repositories/user.repository.js";
import type { MenuRepository } from "../../menus/repositories/menu.repository.js";
import type {
    IUserMenuPermissionSafe,
    IUpsertUserMenuPermission,
} from "../interfaces/user-permission.interface.js";
import { CustomError } from "../../../middlewares/error.middleware.js";
import { logger } from "@packages/logger/index.js";
import { USER_MESSAGES } from "../../users/constants/user.constants.js";

export class UserPermissionService {
    constructor(
        private readonly userPermissionRepository: UserPermissionRepository,
        private readonly userRepository: UserRepository,
        private readonly menuRepository: MenuRepository
    ) {}

    /**
     * Gets menu permissions overridden for a user.
     * @param tenantUid Tenant UID
     * @param userUid User UID
     * @returns Array of user menu permissions
     */
    async getMenuPermissions(tenantUid: string, userUid: string): Promise<IUserMenuPermissionSafe[]> {
        // Validate user existence
        const user = await this.userRepository.getUserByUid(userUid, tenantUid);
        if (!user) {
            throw new CustomError(USER_MESSAGES.NOT_FOUND, 404);
        }

        return await this.userPermissionRepository.getMenuPermissions(tenantUid, userUid);
    }

    /**
     * Bulk upserts menu permissions for a user.
     * @param tenantUid Tenant UID
     * @param userUid User UID
     * @param permissions Array of permissions to insert
     */
    async upsertMenuPermissions(
        tenantUid: string,
        userUid: string,
        permissions: IUpsertUserMenuPermission[]
    ): Promise<void> {
        // Validate user existence
        const user = await this.userRepository.getUserByUid(userUid, tenantUid);
        if (!user) {
            throw new CustomError(USER_MESSAGES.NOT_FOUND, 404);
        }

        // Validate all menus exist
        const menuUids = permissions.map((p) => p.menuUid);
        const existingMenus = await this.menuRepository.findByUids(menuUids);
        
        if (existingMenus.length !== menuUids.length) {
            logger.warn("UserPermissionService.upsertMenuPermissions: Invalid menu UIDs provided", {
                provided: menuUids,
                found: existingMenus.map((m) => m.uid),
            });
            throw new CustomError("One or more provided menu UIDs are invalid.", 400);
        }

        // Perform the bulk upsert
        await this.userPermissionRepository.upsertMenuPermissions(tenantUid, userUid, permissions);
    }
}
