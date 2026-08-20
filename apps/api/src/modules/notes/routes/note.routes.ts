import { Router } from "express";
import { NoteController } from "../controllers/note.controller.js";
import { NoteService } from "../services/note.service.js";
import { NoteRepository } from "../repositories/note.repository.js";
import { createNoteSchema, updateNoteSchema, paginationSchema, validateNoteRequest } from "../validators/note.validator.js";
import { authenticate } from "../../auth/middleware/auth.middleware.js";
import pool from "@packages/connection.js";

export function createNoteRouter(moduleName: string): Router {
    const router = Router({ mergeParams: true });

    const repository = new NoteRepository(pool);
    const service = new NoteService(repository);
    const controller = new NoteController(service, moduleName);

    router.use(authenticate);

    router.post(
        "/",
        validateNoteRequest(createNoteSchema),
        controller.createNote
    );

    router.get(
        "/all",
        controller.getAllNotes
    );

    router.post(
        "/list",
        validateNoteRequest(paginationSchema),
        controller.listNotesPaginated
    );

    router.put(
        "/:uid",
        validateNoteRequest(updateNoteSchema),
        controller.updateNote
    );

    router.delete(
        "/:uid",
        controller.deleteNote
    );

    return router;
}
