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
        name: "Material delivered to site",
        description: "Delivery and site verification of solar modules, inverter, structure, and BOS materials",
        sortOrder: 1,
        requiresDocument: 1,
        allowMultipleImages: 1,
    },
    {
        name: "DISCOM inspection application submitted",
        description: "Submission of work completion report and DISCOM inspection application",
        sortOrder: 2,
        requiresDocument: 1,
        allowMultipleImages: 1,
    },
    {
        name: "DISCOM inspection passed",
        description: "Physical inspection, earth resistance test, and clearance by DISCOM engineers",
        sortOrder: 3,
        requiresDocument: 1,
        allowMultipleImages: 1,
    },
    {
        name: "Net meter passed",
        description: "Bidirectional net meter testing, installation, sealing, and grid synchronization",
        sortOrder: 4,
        requiresDocument: 1,
        allowMultipleImages: 1,
    },
    {
        name: "Subsidy application submitted",
        description: "Commissioning certificate and subsidy claim submission on national / state portal",
        sortOrder: 5,
        requiresDocument: 1,
        allowMultipleImages: 1,
    },
    {
        name: "Subsidy disbursed",
        description: "Subsidy approved and released directly into the customer's bank account",
        sortOrder: 6,
        requiresDocument: 1,
        allowMultipleImages: 1,
    },
];

