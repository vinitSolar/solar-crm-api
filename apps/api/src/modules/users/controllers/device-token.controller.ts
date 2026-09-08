import type { Request, Response, NextFunction } from "express";
import type { IAuthenticatedRequest } from "../../auth/interfaces/auth.interface.js";
import type { DeviceTokenRepository } from "../repositories/device-token.repository.js";
import { logger } from "@packages/logger/index.js";

export class DeviceTokenController {
    private readonly repository: DeviceTokenRepository;

    constructor(repository: DeviceTokenRepository) {
        this.repository = repository;
    }

    registerToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid!;
            const userUid = authReq.user!.uid;
            const { deviceToken, deviceType, deviceName } = req.body;

            const token = await this.repository.upsertToken(
                tenantUid,
                userUid,
                { deviceToken, deviceType, deviceName },
                userUid
            );

            logger.info("Mobile device token registered", {
                tenantUid,
                userUid,
                deviceType,
                tokenUid: token.uid
            });

            res.status(200).json({
                success: true,
                message: "Device token registered successfully",
                data: {
                    uid: token.uid,
                    deviceType: token.deviceType,
                    deviceName: token.deviceName
                }
            });
        } catch (error) {
            next(error);
        }
    };

    removeToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid!;
            const userUid = authReq.user!.uid;
            const { deviceToken } = req.body;

            await this.repository.deactivateToken(tenantUid, userUid, deviceToken);

            logger.info("Mobile device token deactivated", {
                tenantUid,
                userUid
            });

            res.status(200).json({
                success: true,
                message: "Device token deactivated successfully"
            });
        } catch (error) {
            next(error);
        }
    };
}
