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

export const sendPushNotificationSchema = z.object({
    body: z.object({
        userUid: z.string().uuid("Invalid user UID format").optional(),
        title: z.string().trim().max(100, "Title cannot exceed 100 characters").optional(),
        body: z.string().trim().max(500, "Body cannot exceed 500 characters").optional(),
        template: z.enum(["TEST_PUSH", "LEAD_ASSIGNED"]).optional(),
        leadNumber: z.string().optional(),
        customerName: z.string().optional(),
        systemSize: z.string().optional(),
        city: z.string().optional()
    }).optional(),
    params: z.object({
        uid: z.string().uuid("Invalid user UID format").optional()
    }).optional()
});

export type RegisterDeviceTokenInput = z.infer<typeof registerDeviceTokenSchema>["body"];
export type DeleteDeviceTokenInput = z.infer<typeof deleteDeviceTokenSchema>["body"];
export type SendPushNotificationInput = z.infer<typeof sendPushNotificationSchema>["body"];
