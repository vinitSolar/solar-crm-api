import type { ILeadNote, ILeadNoteSafe } from "../interfaces/lead-note.interface.js";

export function toLeadNoteSafe(note: ILeadNote): ILeadNoteSafe {
    const safeNote: ILeadNoteSafe = {
        uid: note.uid,
        leadUid: note.leadUid,
        note: note.note,
        isActive: note.isActive,
        isDeleted: note.isDeleted,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
    };
    
    if (note.createdBy !== undefined) safeNote.createdBy = note.createdBy;
    if (note.updatedBy !== undefined) safeNote.updatedBy = note.updatedBy;
    if (note.deletedBy !== undefined) safeNote.deletedBy = note.deletedBy;
    
    return safeNote;
}
