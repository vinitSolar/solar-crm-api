import type { ISubsidyRequiredDocumentDetail } from "../repositories/subsidy-required-document.repository.js";
import type { ISubsidyCalculationConfig, SubsidyCalculationType } from "../utils/subsidy-calculator.js";

export interface ISubsidyCategoryRate {
    categories: number[];
    subsidyPerKw: number;
    maximumSubsidyAmount: number;
}

/**
 * Represents a state subsidy rule record from the database.
 */
export interface IStateSubsidyRule {
    id: number;
    uid: string;
    scheme_name: string | null;
    state_uid: string | null;
    subsidy_per_kw: number;
    maximum_subsidy_amount: number;
    description: string | null;
    categories: number[];
    category_rates?: ISubsidyCategoryRate[] | string | null;
    calculation_type?: SubsidyCalculationType | string | null;
    calculation_config?: ISubsidyCalculationConfig | string | null;
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
    schemeName: string | null;
    stateUid: string | null;
    state?: string | null;
    subsidyPerKw: number;
    maximumSubsidyAmount: number;
    description: string | null;
    categories: number[];
    categoryRates?: ISubsidyCategoryRate[];
    calculationType?: SubsidyCalculationType | string | null;
    calculationConfig?: ISubsidyCalculationConfig | null;
    isActive: number;
    isDeleted: number;
    createdAt: Date;
    updatedAt: Date;
    requiredDocuments?: ISubsidyRequiredDocumentDetail[];
    requiredDocumentsCount?: number;
}

/**
 * Dropdown item format for state subsidy rules.
 */
export interface IStateSubsidyRuleDropdown {
    uid: string;
    schemeName: string | null;
    stateUid: string | null;
}
