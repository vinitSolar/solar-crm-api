import type { NoteRepository } from "../repositories/note.repository.js";
import type { INoteSafe, IUpdateNote } from "../interfaces/note.interface.js";
import { toNoteSafe } from "../dto/note.dto.js";
import { CustomError } from "../../../middlewares/error.middleware.js";
import type { PoolClient } from "pg";
import { notificationService } from "../../notification/services/notification.service.js";
import { NOTIFICATION_CHANNEL, NOTIFICATION_TEMPLATE } from "../../notification/constants/notification.constants.js";
import { LeadRepository } from "../../leads/repositories/lead.repository.js";
import { UserRepository } from "../../users/repositories/user.repository.js";
import pool from "@packages/connection.js";
import { logger } from "@packages/logger/index.js";

export class NoteService {
    private readonly repository: NoteRepository;
    private readonly leadRepository: LeadRepository;
    private readonly userRepository: UserRepository;

    constructor(repository: NoteRepository, leadRepository?: LeadRepository, userRepository?: UserRepository) {
        this.repository = repository;
        this.leadRepository = leadRepository || new LeadRepository(pool);
        this.userRepository = userRepository || new UserRepository(pool);
    }

    async createNote(tenantUid: string, module: string, moduleUid: string, noteText: string, createdBy?: string, client?: PoolClient): Promise<INoteSafe> {
        const note = await this.repository.create(tenantUid, module, moduleUid, noteText, createdBy, client);

        if ((module === 'lead' || module === 'leads') && noteText) {
            this.sendLeadNotePushNotification(tenantUid, moduleUid, noteText, createdBy).catch(err => {
                logger.error("Failed to trigger lead note push notification:", err);
            });
        }

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

            if (module === 'lead' || module === 'leads') {
                this.sendLeadNotePushNotification(tenantUid, moduleUid, noteText, userUid).catch(err => {
                    logger.error("Failed to trigger lead note push notification:", err);
                });
            }
        }
    }

    /**
     * Helper to dispatch real-time FCM Push Notification when a note is added to a lead
     */
    private async sendLeadNotePushNotification(
        tenantUid: string,
        leadUid: string,
        noteText: string,
        authorUid?: string
    ): Promise<void> {
        try {
            const lead = await this.leadRepository.getByUid(tenantUid, leadUid);
            if (!lead || !lead.assignedTo) return;
            // Skip notifying if the author of the note is the assigned user themselves
            if (authorUid && authorUid === lead.assignedTo) return;

            let authorName = "Team Member";
            if (authorUid) {
                const author = await this.userRepository.getUserByUid(authorUid, tenantUid);
                if (author) {
                    authorName = `${author.firstName || ""} ${author.lastName || ""}`.trim() || author.email || authorName;
                }
            }

            await notificationService.send({
                channel: NOTIFICATION_CHANNEL.PUSH,
                template: NOTIFICATION_TEMPLATE.LEAD_NOTE_ADDED,
                recipient: lead.assignedTo,
                module: "lead",
                referenceUid: lead.uid,
                tenantUid,
                createdBy: authorUid || "SYSTEM",
                variables: {
                    lead_number: lead.leadNumber || "Lead",
                    customer_name: `${lead.firstName || ""} ${lead.lastName || ""}`.trim() || "Customer",
                    author_name: authorName,
                    note_text: noteText,
                    lead_uid: lead.uid,
                }
            });
        } catch (err) {
            logger.error("Error dispatching lead note push notification:", err);
        }
    }
}
