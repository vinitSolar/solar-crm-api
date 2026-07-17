import { z } from 'zod';

export const getAuditLogsValidator = z.object({
    body: z.object({
        page: z.number().int().positive().optional().default(1),
        limit: z.number().int().positive().max(100).optional().default(10),
        search: z.string().optional(),
        filters: z.object({
            module: z.string().optional(),
            recordUid: z.string().uuid().optional(),
            tenantUid: z.string().uuid().optional(),
            createdBy: z.string().uuid().optional(),
            action: z.string().optional(),
            startDate: z.string().datetime().optional(),
            endDate: z.string().datetime().optional()
        }).optional()
    })
});
