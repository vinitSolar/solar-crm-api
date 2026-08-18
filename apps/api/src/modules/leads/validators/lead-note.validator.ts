import { z } from "zod";

export const createLeadNoteSchema = z.object({
    body: z.object({
        note: z.string({ message: "Note is required" }).min(1, "Note cannot be empty"),
    }),
});

export const updateLeadNoteSchema = z.object({
    params: z.object({
        leadUid: z.string().uuid("Invalid lead UID format"),
        uid: z.string().uuid("Invalid note UID format"),
    }),
    body: z.object({
        note: z.string().min(1, "Note cannot be empty").optional(),
    }).strict(),
});
