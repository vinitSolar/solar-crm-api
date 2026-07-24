import type { IInstallationMilestone, IInstallationMilestoneSafe } from "../interfaces/installation-milestone.interface.js";

export function toInstallationMilestoneSafe(milestone: IInstallationMilestone): IInstallationMilestoneSafe {
    return {
        uid: milestone.uid,
        name: milestone.name,
        description: milestone.description,
        sortOrder: milestone.sortOrder,
        requiresDocument: milestone.requiresDocument,
        allowMultipleImages: milestone.allowMultipleImages,
        isSystem: milestone.isSystem,
        isActive: milestone.isActive,
        isDeleted: milestone.isDeleted,
    };
}
