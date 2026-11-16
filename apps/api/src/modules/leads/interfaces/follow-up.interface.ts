export interface IFollowUp {
    id: number;
    uid: string;
    tenantUid: string;
    leadUid: string;
    followUpDate: Date | string;
    status: "scheduled" | "rescheduled" | "completed" | "cancelled" | string;
    notes?: string | null;
    assignedTo?: string | null;
    isActive: number;
    isDeleted: number;
    createdAt: Date | string;
    updatedAt: Date | string;
    createdBy?: string | null;
    updatedBy?: string | null;
    assignedToName?: string | null;
    assignedToEmail?: string | null;
    createdByName?: string | null;
    createdByEmail?: string | null;
}

export interface ICreateFollowUp {
    leadUid: string;
    followUpDate: Date | string;
    notes?: string | null;
    status?: "scheduled" | "rescheduled" | "completed" | "cancelled" | string;
    assignedTo?: string | null;
}

