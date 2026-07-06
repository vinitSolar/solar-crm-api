import type { IRole, IRoleSafe } from "../interfaces/role.interface.js";

export const toRoleSafe = (role: IRole): IRoleSafe => {
    return {
        uid: role.uid,
        name: role.name,
        description: role.description,
        isSystem: role.is_system,
        isActive: role.is_active,
        isDeleted: role.is_deleted,
        createdAt: role.created_at,
    };
};


