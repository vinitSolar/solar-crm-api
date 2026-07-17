/**
 * Represents a state subsidy rule record from the database.
 */
export interface IStateSubsidyRule {
    id: number;
    uid: string;
    state_uid: string | null;
    state: string;
    subsidy_per_kw: number;
    maximum_subsidy_amount: number;
    description: string | null;
    is_active: number;
    is_deleted: number;
    deleted_at: Date | null;
    created_at: Date;
    updated_at: Date;
    created_by: string | null;
    updated_by: string | null;
    deleted_by: string | null;
}

/**
 * Sanitized state subsidy rule object returned in API responses.
 */
export interface IStateSubsidyRuleSafe {
    uid: string;
    stateUid: string | null;
    state: string;
    subsidyPerKw: number;
    maximumSubsidyAmount: number;
    description: string | null;
    isActive: number;
    isDeleted: number;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Dropdown item format for state subsidy rules.
 */
export interface IStateSubsidyRuleDropdown {
    uid: string;
    stateUid: string | null;
    state: string;
}
