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
