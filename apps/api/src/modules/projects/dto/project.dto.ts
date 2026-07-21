import type {
    IProject,
    IProjectSafe,
    IProjectStatus,
    IProjectStatusSafe
} from "../interfaces/project.interface.js";

export function toProjectStatusSafe(status: IProjectStatus): IProjectStatusSafe {
    return {
        uid: status.uid,
        name: status.name,
        color: status.color,
        sortOrder: status.sortOrder,
        isDefault: status.isDefault,
        isClosed: status.isClosed,
        description: status.description,
        isActive: status.isActive,
        isDeleted: status.isDeleted,
    };
}

export function toProjectSafe(project: IProject): IProjectSafe {
    const customerName = [project.customerFirstName, project.customerLastName].filter(Boolean).join(" ");
    
    return {
        uid: project.uid,
        leadUid: project.leadUid,
        quotationUid: project.quotationUid,
        projectNumber: project.projectNumber,
        projectName: project.projectName,
        projectStatusUid: project.projectStatusUid,
        projectManagerUid: project.projectManagerUid,
        projectDate: project.projectDate,
        remarks: project.remarks,
        isActive: project.isActive,
        isDeleted: project.isDeleted,
        createdAt: project.createdAt,
        projectManagerName: project.projectManagerName ?? null,
        customerName: customerName.length > 0 ? customerName : null,
        customerMobileNumber: project.customerMobileNumber ?? null,
        projectStatus: project.projectStatusUid ? {
            uid: project.projectStatusUid,
            name: project.statusName || "",
            color: project.statusColor || null,
            sortOrder: project.statusSortOrder || 0,
            isDefault: 0,
            isClosed: project.statusIsClosed || 0,
            description: null,
            isActive: 1,
            isDeleted: 0,
        } : null,
    };
}
