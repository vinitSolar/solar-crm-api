export const INSTALLATION_MILESTONE_MESSAGES = {
    CREATED: "Installation milestone created successfully",
    FETCHED_SUCCESSFULLY: "Installation milestones fetched successfully",
    NOT_FOUND: "Installation milestone not found",
    UPDATED: "Installation milestone updated successfully",
    DELETED: "Installation milestone deleted successfully",
    RESTORED: "Installation milestone restored successfully",
    CREATION_FAILED: "Failed to create installation milestone",
    UPDATE_FAILED: "Failed to update installation milestone",
    DELETE_FAILED: "Failed to delete installation milestone",
    RESTORE_FAILED: "Failed to restore installation milestone",
    CANNOT_DELETE_SYSTEM: "Cannot delete a system-defined installation milestone",
};

export interface IDefaultInstallationMilestoneDef {
    name: string;
    description: string;
    sortOrder: number;
    requiresDocument: number;
    allowMultipleImages: number;
}

export const DEFAULT_INSTALLATION_MILESTONES: IDefaultInstallationMilestoneDef[] = [
    {
        name: "Site Preparation & Civil Foundations",
        description: "Site survey verification, civil foundations, and material dispatch check",
        sortOrder: 1,
        requiresDocument: 1,
        allowMultipleImages: 1,
    },
    {
        name: "Structure Erection & Panel Mounting",
        description: "Mounting structure assembly and solar panel installation",
        sortOrder: 2,
        requiresDocument: 1,
        allowMultipleImages: 1,
    },
    {
        name: "Inverter & Electrical Cabling (AC/DC)",
        description: "Solar inverter installation, DC/AC wiring, and conduit routing",
        sortOrder: 3,
        requiresDocument: 1,
        allowMultipleImages: 1,
    },
    {
        name: "Earthing & Lightning Arrester Installation",
        description: "Chemical earthing pits, earth resistance test, and lightning protection",
        sortOrder: 4,
        requiresDocument: 1,
        allowMultipleImages: 1,
    },
    {
        name: "Net Meter Application & DISCOM Inspection",
        description: "DISCOM inspection, bidirectional meter installation, and test report submission",
        sortOrder: 5,
        requiresDocument: 1,
        allowMultipleImages: 1,
    },
    {
        name: "Commissioning & Handover",
        description: "Grid synchronization, final system testing, generation check, and client handover",
        sortOrder: 6,
        requiresDocument: 1,
        allowMultipleImages: 1,
    },
];

