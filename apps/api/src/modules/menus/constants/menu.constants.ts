export const MENU_MESSAGES = {
    CREATED_SUCCESS: "Menu created successfully",
    FETCHED_SUCCESS: "Menus fetched successfully",
    FETCHED_ALL_SUCCESS: "All menus fetched successfully",
    FETCHED_ONE_SUCCESS: "Menu fetched successfully",
    UPDATED_SUCCESS: "Menu updated successfully",
    DELETED_SUCCESS: "Menu deleted successfully",
    RESTORED_SUCCESS: "Menu restored successfully",
    NOT_FOUND: "Menu not found",
    CODE_EXISTS: "Menu with this code already exists",
    PARENT_NOT_FOUND: "Parent menu not found",
    VALIDATION_ERROR: "Validation error",
} as const;

export const HEAD_OFFICE_ONLY_MENUS = [
    'DOCUMENT_TYPES',
    'installation_milestones',
    'LEAD_SOURCES',
    'LEAD_STATUSES',
    'PRODUCT_BRANDS',
    'PRODUCT_CATEGORIES',
    'PRODUCT_SPECIFICATIONS',
    'PRODUCT_UNITS',
    'PROJECT_STATUSES',
    'QUOTATION_MASTERS',
    'QUOTATION_TERMS',
    'QUOTATION_SCOPE',
    'STATE_SUBSIDY_RULES',
    'SUBSIDY_DOCUMENT_TYPES',
    'BANK_DETAILS',
    'SUBSIDIES',
    'FRANCHISES'
];
