import type { IRoleMenuPermissionSafe } from "../interfaces/role-permission.interface.js";

/**
 * Maps a raw DB row (with joined menu data) to the safe API response shape.
 */
export const toRoleMenuPermissionSafe = (row: {
    menu_uid: string;
    menu_name: string;
    menu_code: string;
    can_view: number;
    can_create: number;
    can_edit: number;
    can_delete: number;
}): IRoleMenuPermissionSafe => {
    return {
        menuUid: row.menu_uid,
        menuName: row.menu_name,
        menuCode: row.menu_code,
        canView: row.can_view,
        canCreate: row.can_create,
        canEdit: row.can_edit,
        canDelete: row.can_delete,
    };
};
