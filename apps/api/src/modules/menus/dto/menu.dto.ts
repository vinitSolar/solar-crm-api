export interface IMenu {
    id: number;
    uid: string;
    parent_uid: string | null;
    name: string;
    code: string;
    route: string | null;
    icon: string | null;
    sort_order: number | null;
    is_active: number;
    deleted_at: Date | null;
    created_at: Date;
    updated_at: Date;
}

export type SafeMenu = {
    uid: string;
    parentUid: string | null;
    name: string;
    code: string;
    route: string | null;
    icon: string | null;
    sortOrder: number | null;
    isActive: number;
    isDeleted: number;
    createdAt: Date;
    updatedAt: Date;
};

export const toSafeMenu = (menu: IMenu): SafeMenu => {
    return {
        uid: menu.uid,
        parentUid: menu.parent_uid,
        name: menu.name,
        code: menu.code,
        route: menu.route,
        icon: menu.icon,
        sortOrder: menu.sort_order,
        isActive: menu.is_active,
        isDeleted: menu.deleted_at ? 1 : 0,
        createdAt: menu.created_at,
        updatedAt: menu.updated_at,
    };
};
