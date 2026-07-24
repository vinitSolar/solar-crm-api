export interface IInstallationMilestone {
    id: string;
    uid: string;
    tenantUid: string;
    name: string;
    description: string | null;
    sortOrder: number;
    requiresDocument: number;
    allowMultipleImages: number;
    isSystem: number;
    isActive: number;
    isDeleted: number;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string | null;
    updatedBy: string | null;
    deletedBy: string | null;
}

export interface ICreateInstallationMilestone {
    name: string;
    description?: string;
    sortOrder?: number;
    requiresDocument?: number;
    allowMultipleImages?: number;
}

export interface IUpdateInstallationMilestone {
    name?: string;
    description?: string;
    sortOrder?: number;
    requiresDocument?: number;
    allowMultipleImages?: number;
}

export interface IInstallationMilestoneSafe {
    uid: string;
    name: string;
    description: string | null;
    sortOrder: number;
    requiresDocument: number;
    allowMultipleImages: number;
    isSystem: number;
    isActive: number;
    isDeleted: number;
}
