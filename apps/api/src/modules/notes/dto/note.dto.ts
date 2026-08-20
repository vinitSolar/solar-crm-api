import type { INote, INoteSafe } from "../interfaces/note.interface.js";

export function toNoteSafe(note: INote): INoteSafe {
    return {
        uid: note.uid,
        module: note.module,
        moduleUid: note.moduleUid,
        note: note.note,
        isActive: note.isActive,
        isDeleted: note.isDeleted,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        createdBy: note.createdBy || null,
        updatedBy: note.updatedBy || null,
        deletedBy: note.deletedBy || null,
    };
}
