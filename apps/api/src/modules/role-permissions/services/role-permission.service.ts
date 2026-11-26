import type { RolePermissionRepository } from "../repositories/role-permission.repository.js";
import type { RoleRepository } from "../../roles/repositories/role.repository.js";
import type { MenuRepository } from "../../menus/repositories/menu.repository.js";
import type { IRoleMenuPermissionSafe, IUpsertRoleMenuPermission } from "../interfaces/role-permission.interface.js";
import { toRoleMenuPermissionSafe } from "../dto/role-permission.dto.js";
import { ROLE_PERMISSION_MESSAGES } from "../constants/role-permission.constants.js";
import { logger } from "@packages/logger/index.js";
import { safeCacheDelPattern } from "@packages/redis/index.js";

import { CustomError } from "../../../middlewares/error.middleware.js";

/**
 * Role Permission Service.
 * Contains business logic — no SQL queries.
 */
export class RolePermissionService {
    private readonly rolePermissionRepository: RolePermissionRepository;
    private readonly roleRepository: RoleRepository;
    private readonly menuRepository: MenuRepository;

    constructor(
        rolePermissionRepository: RolePermissionRepository,
        roleRepository: RoleRepository,
        menuRepository: MenuRepository,
    ) {
        this.rolePermissionRepository = rolePermissionRepository;
        this.roleRepository = roleRepository;
        this.menuRepository = menuRepository;
    }

    /**
     * Get all menu permissions for a role.
     * Returns all menus with their permission flags for the given role.
     */
    async getMenuPermissions(
        roleUid: string,
        tenantUid: string,
    ): Promise<IRoleMenuPermissionSafe[]> {
        logger.info("RolePermissionService.getMenuPermissions", { roleUid, tenantUid });

        // Validate role exists
        const role = await this.roleRepository.getRoleByUid(roleUid, tenantUid);
        if (!role) {
            throw new Error(ROLE_PERMISSION_MESSAGES.ROLE_NOT_FOUND);
        }

        const rows = await this.rolePermissionRepository.getMenuPermissionsByRole(
            roleUid,
            tenantUid,
        );

        return rows.map(toRoleMenuPermissionSafe);
    }

    /**
     * Bulk upsert menu permissions for a role.
     * Validates role and menu UIDs before persisting.
     */
    async upsertMenuPermissions(
        roleUid: string,
        tenantUid: string,
        permissions: IUpsertRoleMenuPermission[],
    ): Promise<void> {
        logger.info("RolePermissionService.upsertMenuPermissions", {
            roleUid,
            tenantUid,
            count: permissions.length,
        });

        // Validate role exists
        const role = await this.roleRepository.getRoleByUid(roleUid, tenantUid);
        if (!role) {
            throw new Error(ROLE_PERMISSION_MESSAGES.ROLE_NOT_FOUND);
        }

        if (role.is_system === 1) {
            throw new CustomError("Default system role permissions cannot be modified", 400);
        }

        // Validate all menu UIDs exist
        const allMenus = await this.menuRepository.findAll("active");
        const validMenuUids = new Set(allMenus.map((m) => m.uid));

        for (const perm of permissions) {
            if (!validMenuUids.has(perm.menuUid)) {
                throw new Error(ROLE_PERMISSION_MESSAGES.MENU_NOT_FOUND);
            }
        }

        // Ensure any role with Projects permission also receives at least matching Subsidy Tracker permission
        const projectsMenu = allMenus.find((m) => m.code.toLowerCase() === "projects");
        const subsidyTrackerMenu = allMenus.find((m) => m.code.toLowerCase() === "subsidy_tracker");
        const syncedPermissions: IUpsertRoleMenuPermission[] = permissions.map((p) => ({ ...p }));

        if (projectsMenu && subsidyTrackerMenu) {
            const projectsPerm = syncedPermissions.find((p) => p.menuUid === projectsMenu.uid);
            if (
                projectsPerm &&
                (projectsPerm.canView === 1 || projectsPerm.canCreate === 1 || projectsPerm.canEdit === 1 || projectsPerm.canDelete === 1)
            ) {
                const existingSubsidyPerm = syncedPermissions.find((p) => p.menuUid === subsidyTrackerMenu.uid);
                if (existingSubsidyPerm) {
                    existingSubsidyPerm.canView = Math.max(existingSubsidyPerm.canView, projectsPerm.canView);
                    existingSubsidyPerm.canCreate = Math.max(existingSubsidyPerm.canCreate, projectsPerm.canCreate);
                    existingSubsidyPerm.canEdit = Math.max(existingSubsidyPerm.canEdit, projectsPerm.canEdit);
                    existingSubsidyPerm.canDelete = Math.max(existingSubsidyPerm.canDelete, projectsPerm.canDelete);
                } else {
                    syncedPermissions.push({
                        menuUid: subsidyTrackerMenu.uid,
                        canView: projectsPerm.canView,
                        canCreate: projectsPerm.canCreate,
                        canEdit: projectsPerm.canEdit,
                        canDelete: projectsPerm.canDelete,
                        canSetting: 0,
                    });
                }
            }
        }

        await this.rolePermissionRepository.upsertMenuPermissions(
            roleUid,
            tenantUid,
            syncedPermissions,
        );

        // Invalidate cached permissions for this tenant and role
        safeCacheDelPattern(`cache:perm:${tenantUid}:${roleUid}:*`).catch(() => {});
    }
}
