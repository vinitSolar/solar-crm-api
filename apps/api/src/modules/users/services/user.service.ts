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

    async getAllUsersByTenant(tenantUid: string, status?: "active" | "deleted" | "all", canSiteSurvey?: number, canInstallation?: number): Promise<UserDTO[]> {
        const users = await this.userRepository.getAllUsers(tenantUid, status, canSiteSurvey, canInstallation);
        return users.map(toUserDTO);
    }

    async getUserByUid(uid: string, tenantUid: string): Promise<UserDTO> {
        const user = await this.userRepository.getUserByUid(uid, tenantUid);
        if (!user) {
            throw new CustomError(USER_MESSAGES.NOT_FOUND, 404);
        }
        return toUserDTO(user);
    }

    async createUser(tenantUid: string, data: ICreateUserRequest, createdBy: string): Promise<UserDTO> {
        const existingUser = await this.userRepository.getUserByEmail(data.email, tenantUid);
        if (existingUser) {
            throw new CustomError(USER_MESSAGES.ALREADY_EXISTS, 400);
        }

        const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);
        
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
