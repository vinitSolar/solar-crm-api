import type { 
    ILead, 
    ILeadSafe, 
    ILeadSource, 
    ILeadSourceSafe, 
    ILeadStatus, 
    ILeadStatusSafe 
} from "../interfaces/lead.interface.js";

export function toLeadSafe(lead: ILead): ILeadSafe {
    return {
        uid: lead.uid,
        leadNumber: lead.leadNumber,
        firstName: lead.firstName,
        lastName: lead.lastName,
        mobileNumber: lead.mobileNumber,
        alternateNumber: lead.alternateNumber,
        email: lead.email,
        address: lead.address,
        state: lead.state,
        city: lead.city,
        pinCode: lead.pinCode,
        monthlyBillAmount: lead.monthlyBillAmount ? Number(lead.monthlyBillAmount) : null,
        systemSize: lead.systemSize ? Number(lead.systemSize) : null,
        followUpDate: lead.followUpDate,
        leadSourceUid: lead.leadSourceUid,
        sourceName: lead.sourceName,
        statusUid: lead.statusUid,
        statusName: lead.statusName,
        assignedTo: lead.assignedTo,
        assignedUserName: lead.assignedUserName,
        remarks: lead.remarks,
        isActive: lead.isActive,
        isDeleted: lead.isDeleted,
        createdAt: lead.createdAt,
        leadSource: lead.leadSourceUid ? {
            uid: lead.leadSourceUid,
            name: lead.sourceName || "",
            color: lead.sourceColor || null,
            sortOrder: lead.sourceSortOrder || 0,
            isDefault: lead.sourceIsDefault || 0,
            isActive: lead.sourceIsActive || 0,
            isDeleted: lead.sourceIsDeleted || 0,
        } : null,
        leadStatus: lead.statusUid ? {
            uid: lead.statusUid,
            name: lead.statusName || "",
            color: lead.statusColor || null,
            sortOrder: lead.statusSortOrder || 0,
            isDefault: lead.statusIsDefault || 0,
            isClosed: lead.statusIsClosed || 0,
            isActive: lead.statusIsActive || 0,
            isDeleted: lead.statusIsDeleted || 0,
        } : null,
    };
}

export function toLeadSourceSafe(source: ILeadSource): ILeadSourceSafe {
    return {
        uid: source.uid,
        name: source.name,
        color: source.color,
        sortOrder: source.sortOrder,
        isDefault: source.isDefault,
        isActive: source.isActive,
        isDeleted: source.isDeleted,
    };
}

export function toLeadStatusSafe(status: ILeadStatus): ILeadStatusSafe {
    return {
        uid: status.uid,
        name: status.name,
        color: status.color,
        sortOrder: status.sortOrder,
        isDefault: status.isDefault,
        isClosed: status.isClosed,
        isActive: status.isActive,
        isDeleted: status.isDeleted,
    };
}
