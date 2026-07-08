import type { ISiteSurvey, ISiteSurveySafe } from "../interfaces/site-survey.interface.js";
import type { ISiteSurveyDetails, ISiteSurveyDetailsSafe } from "../interfaces/site-survey-details.interface.js";

export function toSiteSurveyDetailsSafe(details: ISiteSurveyDetails): ISiteSurveyDetailsSafe {
    return {
        uid: details.uid,
        siteSurveyUid: details.siteSurveyUid,
        roofAreaSqft: details.roofAreaSqft,
        shading: details.shading,
        connectionType: details.connectionType,
        sanctionedLoadKw: details.sanctionedLoadKw,
        recommendedKw: details.recommendedKw,
        notes: details.notes,
        isActive: details.isActive,
        isDeleted: details.isDeleted,
        createdAt: details.createdAt,
        updatedAt: details.updatedAt,
    };
}

export function toSiteSurveySafe(survey: ISiteSurvey, details?: ISiteSurveyDetailsSafe): ISiteSurveySafe {
    return {
        uid: survey.uid,
        leadUid: survey.leadUid,
        leadName: survey.leadName,
        assignedTo: survey.assignedTo,
        assignedUserName: survey.assignedUserName,
        scheduledAt: survey.scheduledAt,
        status: survey.status,
        remarks: survey.remarks,
        details,
        isActive: survey.isActive,
        isDeleted: survey.isDeleted,
        createdAt: survey.createdAt,
        updatedAt: survey.updatedAt,
    };
}
