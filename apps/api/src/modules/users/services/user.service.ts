import type { UserRepository } from "../repositories/user.repository.js";
import type { ICreateUserRequest, IUpdateUserRequest, IPaginationQuery, IUserListResponse } from "../interfaces/user.interface.js";
import { type UserDTO, toUserDTO } from "../dto/user.dto.js";
import { USER_MESSAGES } from "../constants/user.constants.js";
import bcrypt from "bcrypt";
import { CustomError } from "../../../middlewares/error.middleware.js";

const SALT_ROUNDS = 10;

export class UserService {
    private readonly userRepository: UserRepository;

    constructor(userRepository: UserRepository) {
        this.userRepository = userRepository;
    }

    async getUsersByTenant(tenantUid: string, query: IPaginationQuery): Promise<IUserListResponse> {
        const { users, total } = await this.userRepository.getPaginatedUsers(tenantUid, query);
        
        return {
            users: users.map(toUserDTO),
            meta: {
                total,
                page: query.page,
                limit: query.limit,
                totalPages: Math.ceil(total / query.limit),
            },
        };
    }

    async getAllUsersByTenant(tenantUid: string, status?: "active" | "deleted" | "all", canSiteSurvey?: number, canInstallation?: number, canSale?: number): Promise<UserDTO[]> {
        const users = await this.userRepository.getAllUsers(tenantUid, status, canSiteSurvey, canInstallation, canSale, true, true);
        return users.map(toUserDTO);
    }

    async getUsersForDropdown(tenantUid: string, currentUserUid: string, status?: "active" | "deleted" | "all", canSiteSurvey?: number, canInstallation?: number, canSale?: number): Promise<UserDTO[]> {
        const users = await this.userRepository.getAllUsers(tenantUid, status, canSiteSurvey, canInstallation, canSale, false, false);
        const dtos = users.map(toUserDTO);
        
        const hasCapabilityFilter = canSiteSurvey === 1 || canInstallation === 1 || canSale === 1;

        const currentUserIndex = dtos.findIndex(u => u.uid === currentUserUid);
        if (currentUserIndex !== -1) {
            // We know the index exists, so splice will return at least one element.
            // Using non-null assertion (!) tells TypeScript that this element is definitely defined.
            const currentUser = dtos.splice(currentUserIndex, 1)[0]!;
            currentUser.firstName = "My Self";
            currentUser.lastName = "";
            dtos.unshift(currentUser);
        } else {
            const currentUser = await this.userRepository.getUserByUid(currentUserUid, tenantUid);
            if (currentUser) {
                const currentUserDto = toUserDTO(currentUser);
                currentUserDto.firstName = "My Self";
                currentUserDto.lastName = "";
                dtos.unshift(currentUserDto);
            }
        }
        
        return dtos;
    }

    async getUserByUid(uid: string, tenantUid: string): Promise<UserDTO> {
        const user = await this.userRepository.getUserByUid(uid, tenantUid);
        if (!user) {
            throw new CustomError(USER_MESSAGES.NOT_FOUND, 404);
        }
        const assignments = await this.userRepository.getActiveAssignmentsCount(uid, tenantUid);
        const dto = toUserDTO(user);
        dto.activeLeadsCount = assignments.activeLeads;
        dto.activeProjectsCount = assignments.activeProjects;
        return dto;
    }

    async getActiveAssignments(uid: string, tenantUid: string): Promise<{ activeLeads: number; activeProjects: number }> {
        const existingUser = await this.userRepository.getUserByUid(uid, tenantUid);
        if (!existingUser) {
            throw new CustomError(USER_MESSAGES.NOT_FOUND, 404);
        }
        return this.userRepository.getActiveAssignmentsCount(uid, tenantUid);
    }

    private buildActiveAssignmentsErrorMessage(activeLeads: number, activeProjects: number, action: "deactivate" | "delete" = "deactivate"): string {
        const parts: string[] = [];
        if (activeLeads > 0) {
            parts.push(`${activeLeads} active lead${activeLeads > 1 ? "s" : ""}`);
        }
        if (activeProjects > 0) {
            parts.push(`${activeProjects} active project${activeProjects > 1 ? "s" : ""}`);
        }
        const assignedText = parts.join(" and ");
        return action === "deactivate"
            ? USER_MESSAGES.CANNOT_DEACTIVATE_ACTIVE_ASSIGNMENTS(assignedText)
            : USER_MESSAGES.CANNOT_DELETE_ACTIVE_ASSIGNMENTS(assignedText);
    }

    private async throwIfHasActiveAssignments(uid: string, tenantUid: string, action: "deactivate" | "delete"): Promise<void> {
        const assignments = await this.userRepository.getActiveAssignmentsCount(uid, tenantUid);
        if (assignments.activeLeads > 0 || assignments.activeProjects > 0) {
            const message = this.buildActiveAssignmentsErrorMessage(assignments.activeLeads, assignments.activeProjects, action);
            throw new CustomError(message, 400, [
                ...(assignments.activeLeads > 0 ? [{ field: "leads", message: USER_MESSAGES.ACTIVE_LEADS_ASSIGNED_FIELD(assignments.activeLeads) }] : []),
                ...(assignments.activeProjects > 0 ? [{ field: "projects", message: USER_MESSAGES.ACTIVE_PROJECTS_ASSIGNED_FIELD(assignments.activeProjects) }] : []),
            ]);
        }
    }

    async createUser(tenantUid: string, data: ICreateUserRequest, createdBy: string): Promise<UserDTO> {
        const existingUser = await this.userRepository.getUserByEmail(data.email, tenantUid);
        if (existingUser) {
            throw new CustomError(USER_MESSAGES.ALREADY_EXISTS, 400);
        }

        let hashedPassword = null;
        if (data.password !== null && data.password !== undefined) {
            hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);
        }
        
        const payload: ICreateUserRequest = {
            ...data,
            password: hashedPassword
        };

        const user = await this.userRepository.createUser(tenantUid, payload, createdBy);
        return toUserDTO(user);
    }

    async updateUser(uid: string, tenantUid: string, data: IUpdateUserRequest, updatedBy: string): Promise<UserDTO> {
        const existingUser = await this.userRepository.getUserByUid(uid, tenantUid);
        if (!existingUser) {
            throw new CustomError(USER_MESSAGES.NOT_FOUND, 404);
        }

        if (data.email && data.email !== existingUser.email) {
            const emailInUse = await this.userRepository.getUserByEmail(data.email, tenantUid);
            if (emailInUse) {
                throw new CustomError(USER_MESSAGES.ALREADY_EXISTS, 400);
            }
        }

        // Validate active assignments before allowing deactivation
        if (existingUser.isActive !== 0 && data.isActive !== undefined && Number(data.isActive) === 0) {
            await this.throwIfHasActiveAssignments(uid, tenantUid, "deactivate");
        }

        let payload = { ...data };
        if (payload.password) {
            payload.password = await bcrypt.hash(payload.password, SALT_ROUNDS);
        }

        const user = await this.userRepository.updateUser(uid, tenantUid, payload, updatedBy);
        if (!user) {
            throw new CustomError(USER_MESSAGES.UPDATE_FAILED, 500);
        }

        return toUserDTO(user);
    }

    async deleteUser(uid: string, tenantUid: string, deletedBy: string): Promise<void> {
        const existingUser = await this.userRepository.getUserByUid(uid, tenantUid);
        if (!existingUser) {
            throw new CustomError(USER_MESSAGES.NOT_FOUND, 404);
        }
        
        if (existingUser.createdBy === "SYSTEM") {
            throw new CustomError(USER_MESSAGES.SYSTEM_USER_DELETE_ERROR, 400);
        }

        if (existingUser.isOwner === 1) {
            throw new CustomError(USER_MESSAGES.OWNER_USER_DELETE_ERROR, 400);
        }

        await this.throwIfHasActiveAssignments(uid, tenantUid, "delete");

        const success = await this.userRepository.softDeleteUser(uid, tenantUid, deletedBy);
        if (!success) {
            throw new CustomError(USER_MESSAGES.DELETE_FAILED, 500);
        }
    }

    async restoreUser(uid: string, tenantUid: string, updatedBy: string): Promise<void> {
        const success = await this.userRepository.restoreUser(uid, tenantUid, updatedBy);
        if (!success) {
            throw new CustomError(USER_MESSAGES.RESTORE_FAILED, 404);
        }
    }
}
