export interface ISiteSurveyDetails {
    id: string;
    uid: string;
    tenantUid: string;
    siteSurveyUid: string;
    roofAreaSqft: number;
    shading: number;
    connectionType: number;
    sanctionedLoadKw: number;
    recommendedKw: number | null;
    needsStructureExtension: number;
    needsOptimizer: number;
    optimizerCount: number | null;
    notes: string | null;
    latitude: number | null;
    longitude: number | null;
    isActive: number;
    isDeleted: number;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string | null;
    updatedBy: string | null;
    deletedBy: string | null;
}

export interface ISaveSiteSurveyDetails {
    roofAreaSqft: number;
    shading: number;
    connectionType: number;
    sanctionedLoadKw: number;
    recommendedKw?: number;
    needsStructureExtension?: number;
    needsOptimizer?: number;
    optimizerCount?: number;
    notes?: string;
    latitude?: number;
    longitude?: number;
}

export interface IUpdateSiteSurveyDetails {
    roofAreaSqft?: number;
    shading?: number;
    connectionType?: number;
    sanctionedLoadKw?: number;
    recommendedKw?: number;
    needsStructureExtension?: number;
    needsOptimizer?: number;
    optimizerCount?: number;
    notes?: string;
    latitude?: number;
    longitude?: number;
}

export interface ISiteSurveyDetailsSafe {
    uid: string;
    siteSurveyUid: string;
    roofAreaSqft: number;
    shading: number;
    connectionType: number;
    sanctionedLoadKw: number;
    recommendedKw: number | null;
    needsStructureExtension: number;
    needsOptimizer: number;
    optimizerCount: number | null;
    notes: string | null;
    latitude: number | null;
    longitude: number | null;
    isActive: number;
    isDeleted: number;
    createdAt: Date;
    updatedAt: Date;
}
