export interface IFranchiseRoleDef {
    name: string;
    description: string;
    canSale: number;
    canSiteSurvey: number;
    canInstallation: number;
}

export interface IPermissionAction {
    canView: number;
    canCreate: number;
    canEdit: number;
    canDelete: number;
    canSetting: number;
}

export const DEFAULT_FRANCHISE_ROLES: IFranchiseRoleDef[] = [
    {
        name: "Franchise Owner(Admin)",
        description: "Full access to franchise operations",
        canSale: 1,
        canSiteSurvey: 1,
        canInstallation: 1,
    },
    {
        name: "Sales Executive",
        description: "Manage leads, quotations, and sales pipeline",
        canSale: 1,
        canSiteSurvey: 0,
        canInstallation: 0,
    },
    {
        name: "Survey Engineer",
        description: "Conduct site surveys and upload reports",
        canSale: 0,
        canSiteSurvey: 1,
        canInstallation: 0,
    },
    {
        name: "Backoffice",
        description: "Manage backoffice administrative tasks",
        canSale: 0,
        canSiteSurvey: 0,
        canInstallation: 0,
    },
    {
        name: "Warehouse / Procurement",
        description: "Manage inventory and procurement",
        canSale: 0,
        canSiteSurvey: 0,
        canInstallation: 0,
    },
    {
        name: "Installer",
        description: "Handle on-site solar installations",
        canSale: 0,
        canSiteSurvey: 0,
        canInstallation: 1,
    },
];

const NO_PERMISSION: IPermissionAction = {
    canView: 0,
    canCreate: 0,
    canEdit: 0,
    canDelete: 0,
    canSetting: 0,
};

export function getDefaultPermissionForFranchiseRole(
    roleName: string,
    menuCode: string
): IPermissionAction {
    const code = menuCode.toUpperCase();

    switch (roleName) {
        case "Franchise Owner(Admin)": {
            if (["DASHBOARD", "LEADS", "SURVEYS", "QUOTATIONS", "PROJECTS", "PAYMENTS", "SUBSIDY_TRACKER"].includes(code)) {
                return { canView: 1, canCreate: 1, canEdit: 1, canDelete: 1, canSetting: 0 };
            }
            if (["USERS", "ROLES"].includes(code)) {
                return { canView: 1, canCreate: 1, canEdit: 1, canDelete: 1, canSetting: 1 };
            }
            if (["PRODUCTS", "PACKAGES"].includes(code)) {
                return { canView: 1, canCreate: 0, canEdit: 0, canDelete: 0, canSetting: 0 };
            }
            return NO_PERMISSION;
        }

        case "Sales Executive": {
            if (code === "DASHBOARD" || code === "PROJECTS" || code === "PRODUCTS" || code === "PACKAGES") {
                return { canView: 1, canCreate: 0, canEdit: 0, canDelete: 0, canSetting: 0 };
            }
            if (code === "LEADS" || code === "QUOTATIONS") {
                return { canView: 1, canCreate: 1, canEdit: 1, canDelete: 0, canSetting: 0 };
            }
            if (code === "SURVEYS" || code === "PAYMENTS") {
                return { canView: 1, canCreate: 1, canEdit: 0, canDelete: 0, canSetting: 0 };
            }
            return NO_PERMISSION;
        }

        case "Survey Engineer": {
            if (code === "DASHBOARD" || code === "LEADS" || code === "PROJECTS") {
                return { canView: 1, canCreate: 0, canEdit: 0, canDelete: 0, canSetting: 0 };
            }
            if (code === "SURVEYS") {
                return { canView: 1, canCreate: 1, canEdit: 1, canDelete: 0, canSetting: 0 };
            }
            return NO_PERMISSION;
        }

        case "Installer": {
            if (code === "DASHBOARD") {
                return { canView: 1, canCreate: 0, canEdit: 0, canDelete: 0, canSetting: 0 };
            }
            if (code === "PROJECTS") {
                return { canView: 1, canCreate: 0, canEdit: 1, canDelete: 0, canSetting: 0 };
            }
            return NO_PERMISSION;
        }

        case "Backoffice": {
            if (code === "DASHBOARD" || code === "PRODUCTS" || code === "PACKAGES") {
                return { canView: 1, canCreate: 0, canEdit: 0, canDelete: 0, canSetting: 0 };
            }
            if (code === "LEADS" || code === "SURVEYS" || code === "PROJECTS") {
                return { canView: 1, canCreate: 0, canEdit: 1, canDelete: 0, canSetting: 0 };
            }
            if (code === "QUOTATIONS" || code === "PAYMENTS" || code === "SUBSIDY_TRACKER") {
                return { canView: 1, canCreate: 1, canEdit: 1, canDelete: 0, canSetting: 0 };
            }
            return NO_PERMISSION;
        }

        case "Warehouse / Procurement": {
            if (code === "DASHBOARD" || code === "PROJECTS" || code === "PRODUCTS" || code === "PACKAGES") {
                return { canView: 1, canCreate: 0, canEdit: 0, canDelete: 0, canSetting: 0 };
            }
            return NO_PERMISSION;
        }

        default:
            return NO_PERMISSION;
    }
}
