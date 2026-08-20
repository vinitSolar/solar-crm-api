import type { Request, Response, NextFunction } from "express";
import type { NoteService } from "../services/note.service.js";
import { asyncHandler } from "../../../utils/async-handler.js";
import { CustomError } from "../../../middlewares/error.middleware.js";

export class NoteController {
    private readonly service: NoteService;
    private readonly moduleName: string;

    constructor(service: NoteService, moduleName: string) {
        this.service = service;
        this.moduleName = moduleName;
    }

    createNote = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const tenantUid = (req as any).user?.tenantUid;
        const userUid = (req as any).user?.uid;
        const { moduleUid } = req.params;
        const { note } = req.body;

        if (!tenantUid || !userUid) {
            throw new CustomError("Unauthorized", 401);
        }

        if (!moduleUid) {
            throw new CustomError("Module UID is required", 400);
        }

        const newNote = await this.service.createNote(
            tenantUid,
            this.moduleName,
            moduleUid as string,
            note,
            userUid
        );

        res.status(201).json({
            success: true,
            message: "Note created successfully",
            data: newNote,
        });
    });

    getAllNotes = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const tenantUid = (req as any).user?.tenantUid;
        const { moduleUid } = req.params;

        if (!tenantUid) {
            throw new CustomError("Unauthorized", 401);
        }

        const notes = await this.service.getAllNotesForModule(tenantUid, this.moduleName, moduleUid as string);

        res.status(200).json({
            success: true,
            message: "Notes fetched successfully",
            data: notes,
        });
    });

    listNotesPaginated = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const tenantUid = (req as any).user?.tenantUid;
        const { moduleUid } = req.params;
        const { page, limit, module } = req.body;

        if (!tenantUid) {
            throw new CustomError("Unauthorized", 401);
        }

        const result = await this.service.listPaginated(tenantUid, moduleUid as string, { page, limit, module });

        res.status(200).json({
            success: true,
            message: "Notes fetched successfully",
            data: result.data,
            meta: result.meta
        });
    });

    updateNote = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const tenantUid = (req as any).user?.tenantUid;
        const userUid = (req as any).user?.uid;
        const { uid } = req.params; // Note UID
        const { note } = req.body;

        if (!tenantUid || !userUid) {
            throw new CustomError("Unauthorized", 401);
        }

        const updatedNote = await this.service.updateNote(
            uid as string,
            tenantUid,
            { note },
            userUid
        );

        res.status(200).json({
            success: true,
            message: "Note updated successfully",
            data: updatedNote,
        });
    });

    deleteNote = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
        const tenantUid = (req as any).user?.tenantUid;
        const userUid = (req as any).user?.uid;
        const { uid } = req.params;

        if (!tenantUid || !userUid) {
            throw new CustomError("Unauthorized", 401);
        }

        await this.service.deleteNote(uid as string, tenantUid, userUid);

        res.status(200).json({
            success: true,
            message: "Note deleted successfully",
        });
    });
}
