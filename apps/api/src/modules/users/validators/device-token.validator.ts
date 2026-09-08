import { z } from "zod";

export const registerDeviceTokenSchema = z.object({
    body: z.object({
        deviceToken: z.string().trim().min(10, "deviceToken must be at least 10 characters long"),
        deviceType: z.enum(["android", "ios"], {
            message: "deviceType must be either 'android' or 'ios'"
        }),
        deviceName: z.string().trim().max(100).optional(),
    }),
});

export const deleteDeviceTokenSchema = z.object({
    body: z.object({
        deviceToken: z.string().trim().min(10, "deviceToken must be at least 10 characters long"),
    }),
});

export type RegisterDeviceTokenInput = z.infer<typeof registerDeviceTokenSchema>["body"];
export type DeleteDeviceTokenInput = z.infer<typeof deleteDeviceTokenSchema>["body"];
