import type { IUser } from "../interfaces/user.interface.js";

export type UserDTO = Omit<IUser, "password" | "id">;

export function toUserDTO(user: IUser): UserDTO {
    const { password, id, ...safeUser } = user;
    return safeUser;
}
