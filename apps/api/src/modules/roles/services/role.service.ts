import { v4 as uuidv4 } from "uuid";
import type { RoleRepository } from "../repositories/role.repository.js";
import type { ICreateRoleRequest, IUpdateRoleRequest, IRoleSafe } from "../interfaces/role.interface.js";
import { toRoleSafe } from "../dto/role.dto.js";
import { ROLE_MESSAGES } from "../constants/role.constants.js";
import { logger } from "@packages/logger/index.js";

export class RoleService {
    private readonly roleRepository: RoleRepository;

    constructor(roleRepository: RoleRepository) {
        this.roleRepository = roleRepository;
    }

    async getRolesByTenant(tenantUid: string, query: import("../interfaces/role.interface.js").IPaginationQuery): Promise<import("../interfaces/role.interface.js").IPaginatedResponse<IRoleSafe>> {
        logger.info("RoleService.getRolesByTenant", { tenantUid, query });
        
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = query.limit && query.limit > 0 ? query.limit : 10;
        
        const result = await this.roleRepository.getRolesByTenant(tenantUid, page, limit, query.search, query.status);
        
        return {
            data: result.rows.map(toRoleSafe),
            meta: {
                total: result.total,
                page,
                limit,
                totalPages: Math.ceil(result.total / limit)
            }
        };
    }

    async getAllRolesByTenant(tenantUid: string, status: "active" | "deleted" | "all" = "active"): Promise<IRoleSafe[]> {
        logger.info("RoleService.getAllRolesByTenant", { tenantUid, status });
        const roles = await this.roleRepository.getAllRolesByTenant(tenantUid, status);
        return roles.map(toRoleSafe);
    }

    async getRoleByUid(uid: string, tenantUid: string): Promise<IRoleSafe> {
        logger.info("RoleService.getRoleByUid", { uid, tenantUid });
        const role = await this.roleRepository.getRoleByUid(uid, tenantUid);

        if (!role) {
            throw new Error(ROLE_MESSAGES.NOT_FOUND);
        }

        return toRoleSafe(role);
    }

    async createRole(tenantUid: string, data: ICreateRoleRequest, createdBy: string | null): Promise<IRoleSafe> {
        logger.info("RoleService.createRole", { tenantUid, data });

        const existingRole = await this.roleRepository.getRoleByName(data.name, tenantUid);
        if (existingRole) {
            throw new Error(ROLE_MESSAGES.ALREADY_EXISTS);
        }

        const uid = uuidv4();
        const role = await this.roleRepository.createRole(uid, tenantUid, data, createdBy);

        return toRoleSafe(role);
    }

    async updateRole(uid: string, tenantUid: string, data: IUpdateRoleRequest, updatedBy: string | null): Promise<IRoleSafe> {
        logger.info("RoleService.updateRole", { uid, tenantUid, data });

        // Check if role exists
        const existingRole = await this.roleRepository.getRoleByUid(uid, tenantUid);
        if (!existingRole) {
            throw new Error(ROLE_MESSAGES.NOT_FOUND);
        }

        // System roles cannot be updated
        if (existingRole.is_system === 1) {
            throw new Error(ROLE_MESSAGES.SYSTEM_ROLE_UPDATE_ERROR);
        }

        // Check for name uniqueness if name is being updated
        if (data.name && data.name !== existingRole.name) {
            const roleWithName = await this.roleRepository.getRoleByName(data.name, tenantUid);
            if (roleWithName) {
                throw new Error(ROLE_MESSAGES.ALREADY_EXISTS);
            }
        }

        const updatedRole = await this.roleRepository.updateRole(uid, tenantUid, data, updatedBy);

        if (!updatedRole) {
            throw new Error(ROLE_MESSAGES.UPDATE_FAILED);
        }

        return toRoleSafe(updatedRole);
    }

    async deleteRole(uid: string, tenantUid: string, deletedBy: string | null): Promise<void> {
        logger.info("RoleService.deleteRole", { uid, tenantUid });

        // Check if role exists
        const existingRole = await this.roleRepository.getRoleByUid(uid, tenantUid);
        if (!existingRole) {
            throw new Error(ROLE_MESSAGES.NOT_FOUND);
        }

        // System roles cannot be deleted
        if (existingRole.is_system === 1) {
            throw new Error(ROLE_MESSAGES.SYSTEM_ROLE_DELETE_ERROR);
        }

        const success = await this.roleRepository.deleteRole(uid, tenantUid, deletedBy);

        if (!success) {
            throw new Error(ROLE_MESSAGES.DELETE_FAILED);
        }
    }

    async restoreRole(uid: string, tenantUid: string, restoredBy: string | null): Promise<void> {
        logger.info("RoleService.restoreRole", { uid, tenantUid });

        const success = await this.roleRepository.restoreRole(uid, tenantUid, restoredBy);

        if (!success) {
            throw new Error(ROLE_MESSAGES.RESTORE_FAILED);
        }
    }
}
