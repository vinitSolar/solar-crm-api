import type { NoteRepository } from "../repositories/note.repository.js";
import type { INoteSafe, IUpdateNote } from "../interfaces/note.interface.js";
import { toNoteSafe } from "../dto/note.dto.js";
import { CustomError } from "../../../middlewares/error.middleware.js";
import type { PoolClient } from "pg";

export class NoteService {
    private readonly repository: NoteRepository;

    constructor(repository: NoteRepository) {
        this.repository = repository;
    }

    async createNote(tenantUid: string, module: string, moduleUid: string, noteText: string, createdBy?: string, client?: PoolClient): Promise<INoteSafe> {
        const note = await this.repository.create(tenantUid, module, moduleUid, noteText, createdBy, client);
        return toNoteSafe(note);
    }

    async getNoteByUid(uid: string, tenantUid: string): Promise<INoteSafe> {
        const note = await this.repository.getByUid(uid, tenantUid);
        if (!note) {
            throw new CustomError("Note not found", 404);
        }
        return toNoteSafe(note);
    }

    async getLatestNoteForModule(tenantUid: string, module: string, moduleUid: string): Promise<INoteSafe | null> {
        const note = await this.repository.getLatestByModule(tenantUid, module, moduleUid);
        return note ? toNoteSafe(note) : null;
    }

    async getAllNotesForModule(tenantUid: string, module: string, moduleUid: string): Promise<INoteSafe[]> {
        const notes = await this.repository.getAllByModule(tenantUid, module, moduleUid);
        return notes.map(toNoteSafe);
    }

    async listPaginated(tenantUid: string, moduleUid: string, query: { page?: number, limit?: number, module?: string }): Promise<{ data: INoteSafe[], meta: any }> {
        const page = query.page && query.page > 0 ? query.page : 1;
        const limit = query.limit && query.limit > 0 ? query.limit : 10;
        
        const result = await this.repository.getPaginated(
            tenantUid,
            moduleUid,
            page,
            limit,
            query.module
        );

        return {
            data: result.rows.map(toNoteSafe),
            meta: {
                total: result.total,
                page,
                limit,
                totalPages: Math.ceil(result.total / limit)
            }
        };
    }

    async updateNote(uid: string, tenantUid: string, data: IUpdateNote, updatedBy?: string): Promise<INoteSafe> {
        const updated = await this.repository.update(uid, tenantUid, data, updatedBy);
        if (!updated) {
            throw new CustomError("Note not found", 404);
        }
        return toNoteSafe(updated);
    }

    async deleteNote(uid: string, tenantUid: string, deletedBy?: string): Promise<void> {
        const success = await this.repository.softDelete(uid, tenantUid, deletedBy);
        if (!success) {
            throw new CustomError("Note not found", 404);
        }
    }

    // Helper to safely extract remarks/notes string and save it
    async handleIncomingNote(tenantUid: string, module: string, moduleUid: string, noteText: string | null | undefined, userUid?: string, client?: PoolClient): Promise<void> {
        if (noteText && noteText.trim() !== '') {
            await this.repository.create(tenantUid, module, moduleUid, noteText, userUid, client);
        }
    }
}
