import type { INote, INoteSafe } from "../interfaces/note.interface.js";

export function toNoteSafe(note: INote): INoteSafe {
    const creatorUid = note.createdBy || null;
    const creatorName = note.createdByName || (creatorUid === "SYSTEM" ? "System" : null);
    const creatorEmail = note.createdByEmail || null;

    return {
        uid: note.uid,
        module: note.module,
        moduleUid: note.moduleUid,
        note: note.note,
        isActive: note.isActive,
        isDeleted: note.isDeleted,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        createdBy: creatorUid,
        createdByName: creatorName,
        createdByEmail: creatorEmail,
        createdByUid: creatorUid,
        createdByUser: creatorUid
            ? {
                  uid: creatorUid,
                  name: creatorName,
                  email: creatorEmail,
              }
            : null,
        creator: creatorUid
            ? {
                  uid: creatorUid,
                  name: creatorName,
                  email: creatorEmail,
              }
            : null,
        updatedBy: note.updatedBy || null,
        deletedBy: note.deletedBy || null,
    };
}

