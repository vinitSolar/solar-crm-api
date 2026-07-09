/**
 * User Menu Permission — database row from `user_menu_permissions`.
 */
export interface IUserMenuPermission {
    id: number;
    tenant_uid: string;
    user_uid: string;
    menu_uid: string;
    can_view: number;
    can_create: number;
    can_edit: number;
    can_delete: number;
    created_at: Date;
}

/**
 * Sanitized user menu permission for API responses (camelCase).
 * Includes joined menu metadata.
 */
export interface IUserMenuPermissionSafe {
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
export interface IUpsertUserMenuPermission {
    menuUid: string;
    canView: number;
    canCreate: number;
    canEdit: number;
    canDelete: number;
}
