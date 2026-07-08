import type { ISiteSurvey, ISiteSurveySafe } from "../interfaces/site-survey.interface.js";

export function toSiteSurveySafe(survey: ISiteSurvey): ISiteSurveySafe {
    return {
        uid: survey.uid,
        leadUid: survey.leadUid,
        leadName: survey.leadName,
        assignedTo: survey.assignedTo,
        assignedUserName: survey.assignedUserName,
        scheduledAt: survey.scheduledAt,
        status: survey.status,
        remarks: survey.remarks,
        isActive: survey.isActive,
        isDeleted: survey.isDeleted,
        createdAt: survey.createdAt,
        updatedAt: survey.updatedAt,
    };
}
