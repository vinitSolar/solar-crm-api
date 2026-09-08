import type { Request, Response, NextFunction } from "express";
import type { IAuthenticatedRequest } from "../../auth/interfaces/auth.interface.js";
import type { DeviceTokenService } from "../services/device-token.service.js";
import { DEVICE_TOKEN_MESSAGES } from "../constants/device-token.constants.js";

export class DeviceTokenController {
    private readonly service: DeviceTokenService;

    constructor(service: DeviceTokenService) {
        this.service = service;
    }

    registerToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid!;
            const userUid = authReq.user!.uid;
            const { deviceToken, deviceType, deviceName } = req.body;

            const token = await this.service.registerToken(
                tenantUid,
                userUid,
                { deviceToken, deviceType, deviceName },
                userUid
            );

            res.status(200).json({
                success: true,
                message: DEVICE_TOKEN_MESSAGES.REGISTERED_SUCCESS,
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

            await this.service.removeToken(tenantUid, userUid, deviceToken);

            res.status(200).json({
                success: true,
                message: DEVICE_TOKEN_MESSAGES.DEACTIVATED_SUCCESS
            });
        } catch (error) {
            next(error);
        }
    };

    sendPushNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const tenantUid = authReq.tenantUid!;
            const callingUserUid = authReq.user!.uid;

            // Target user can be passed in body, params (:uid), or defaults to self
            const targetUserUid = req.body?.userUid || req.params?.uid || callingUserUid;

            const options = {
                title: req.body?.title,
                body: req.body?.body,
                template: req.body?.template,
                leadNumber: req.body?.leadNumber,
                customerName: req.body?.customerName,
                systemSize: req.body?.systemSize,
                city: req.body?.city
            };

            const result = await this.service.sendPushNotification(
                tenantUid,
                targetUserUid,
                options,
                callingUserUid
            );

            res.status(200).json({
                success: result.delivered,
                message: result.message,
                data: result
            });
        } catch (error) {
            next(error);
        }
    };
}
