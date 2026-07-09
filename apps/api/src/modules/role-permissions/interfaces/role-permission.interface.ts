/**
 * Role Menu Permission — database row from `role_menu_permissions`.
 */
export interface IRoleMenuPermission {
    id: number;
    tenant_uid: string;
    role_uid: string;
    menu_uid: string;
    can_view: number;
    can_create: number;
    can_edit: number;
    can_delete: number;
    created_at: Date;
}

/**
 * Sanitized role menu permission for API responses (camelCase).
 * Includes joined menu metadata.
 */
export interface IRoleMenuPermissionSafe {
    menuUid: string;
    menuName: string;
    menuCode: string;
    canView: number;
    canCreate: number;
    canEdit: number;
    canDelete: number;
}

/**
 * Single item in the bulk upsert request body.
 */
export interface IUpsertRoleMenuPermission {
    menuUid: string;
    canView: number;
    canCreate: number;
    canEdit: number;
    canDelete: number;
}
