import swaggerJsdoc from "swagger-jsdoc";
import type { Options } from "swagger-jsdoc";
import { env } from "@packages/config/index.js";

const swaggerOptions: Options = {
    definition: {
        openapi: "3.0.3",
        info: {
            title: `${env.APP.NAME} API`,
            version: "1.0.0",
            description: "Enterprise-grade CRM platform for the solar industry.",
            contact: {
                name: "Vinit Shah",
            },
        },
        servers: [
            {
                url: `${env.APP.URL}/api/v1`,
                description: `${env.APP.NODE_ENV} server`,
            },
        ],
        tags: [
            { name: "Authentication", description: "Auth endpoints (login, logout, refresh, me, permissions)" },
            { name: "Roles", description: "Role CRUD operations" },
            { name: "Role Permissions", description: "Manage menu permissions assigned to roles" },
            { name: "User Permissions", description: "Manage menu permissions explicitly overridden for users" },
            { name: "Users", description: "User management" },
            { name: "Menus", description: "Menu management" },
            { name: "Leads", description: "Lead management" },
            { name: "Lead Sources", description: "Lead source management" },
            { name: "Lead Statuses", description: "Lead status management" },
            { name: "Site Surveys", description: "Site survey management" },
            { name: "Survey Document Types", description: "Survey document type management" },
            { name: "Franchises", description: "Franchise onboarding" },
            { name: "FranchiseDocumentTypes", description: "Franchise Document Type Management APIs" },
            { name: "SubsidyDocumentTypes", description: "Subsidy Document Type Management APIs" },
            { name: "StateSubsidyRules", description: "State Subsidy Rule Management APIs" },
            { name: "Products", description: "Product Management APIs" },
            { name: "ProductBrands", description: "Product Brand Management APIs" },
            { name: "ProductCategories", description: "Product Category Management APIs" },
            { name: "ProductUnits", description: "Product Unit Management APIs" },
            { name: "ProductDocumentTypes", description: "Product Document Type Management APIs" },
            { name: "Quotation Terms & Conditions", description: "Manage terms & conditions templates for quotations" },
            { name: "Quotation Scope Of Work", description: "Manage scope of work templates for quotations" },
            { name: "Quotations", description: "Quotation generation and management" },
            { name: "Project Statuses", description: "Manage statuses for projects" },
            { name: "Projects", description: "Project management and execution" },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                    description: "Enter your JWT access token",
                },
            },
            schemas: {
                SuccessResponse: {
                    type: "object",
                    properties: {
                        success: { type: "boolean", example: true },
                        message: { type: "string" },
                        data: { type: "object" },
                    },
                },
                ErrorResponse: {
                    type: "object",
                    properties: {
                        success: { type: "boolean", example: false },
                        message: { type: "string" },
                        errors: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    field: { type: "string" },
                                    message: { type: "string" },
                                },
                            },
                        },
                    },
                },
                UserSafe: {
                    type: "object",
                    properties: {
                        uid: { type: "string" },
                        tenantUid: { type: "string" },
                        roleUid: { type: "string" },
                        firstName: { type: "string", nullable: true },
                        lastName: { type: "string", nullable: true },
                        email: { type: "string", nullable: true },
                        lastLogin: { type: "string", format: "date-time", nullable: true },
                        isActive: { type: "integer", enum: [0, 1, 2] },
                    },
                },
                RoleSafe: {
                    type: "object",
                    properties: {
                        uid: { type: "string" },
                        name: { type: "string" },
                        description: { type: "string", nullable: true },
                        isSystem: { type: "integer", enum: [0, 1] },
                        isActive: { type: "integer", enum: [0, 1] },
                        isDeleted: { type: "integer", enum: [0, 1] },
                        createdAt: { type: "string", format: "date-time" },
                    },
                },
                SurveyDocumentTypeSafe: {
                    type: "object",
                    properties: {
                        uid: { type: "string" },
                        name: { type: "string" },
                        description: { type: "string", nullable: true },
                        isRequired: { type: "integer", enum: [0, 1] },
                        allowMultiple: { type: "integer", enum: [0, 1] },
                        sortOrder: { type: "integer" },
                        isSystem: { type: "integer", enum: [0, 1] },
                        isActive: { type: "integer", enum: [0, 1] },
                        isDeleted: { type: "integer", enum: [0, 1] },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                    },
                },
                SubsidyDocumentTypeSafe: {
                    type: "object",
                    properties: {
                        uid: { type: "string" },
                        name: { type: "string" },
                        description: { type: "string", nullable: true },
                        allowMultiple: { type: "boolean" },
                        isRequired: { type: "boolean" },
                        sortOrder: { type: "integer" },
                        isActive: { type: "boolean" },
                        isDeleted: { type: "boolean" },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                    },
                },
                SubsidyRequiredDocumentSafe: {
                    type: "object",
                    properties: {
                        uid: { type: "string" },
                        documentTypeUid: { type: "string" },
                        name: { type: "string" },
                        allowMultiple: { type: "boolean" },
                        isRequired: { type: "boolean" },
                        sortOrder: { type: "integer" },
                    },
                },
                StateSubsidyRuleSafe: {
                    type: "object",
                    properties: {
                        uid: { type: "string" },
                        schemeName: { type: "string", nullable: true },
                        stateUid: { type: "string", nullable: true },
                        state: { type: "string", nullable: true },
                        subsidyPerKw: { type: "number" },
                        maximumSubsidyAmount: { type: "number" },
                        description: { type: "string", nullable: true },
                        isActive: { type: "integer", enum: [0, 1] },
                        isDeleted: { type: "integer", enum: [0, 1] },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                        requiredDocuments: {
                            type: "array",
                            items: { $ref: "#/components/schemas/SubsidyRequiredDocumentSafe" },
                        },
                        requiredDocumentsCount: { type: "integer" },
                    },
                },
                LeadSafe: {
                    type: "object",
                    properties: {
                        uid: { type: "string" },
                        firstName: { type: "string" },
                        lastName: { type: "string", nullable: true },
                        mobileNumber: { type: "string" },
                        alternateNumber: { type: "string", nullable: true },
                        email: { type: "string", nullable: true },
                        address: { type: "string", nullable: true },
                        state: { type: "string" },
                        city: { type: "string" },
                        pinCode: { type: "string", nullable: true },
                        monthlyBillAmount: { type: "number", nullable: true },
                        systemSize: { type: "number", nullable: true },
                        followUpDate: { type: "string", format: "date-time", nullable: true },
                        leadSourceUid: { type: "string" },
                        sourceName: { type: "string", nullable: true },
                        statusUid: { type: "string" },
                        statusName: { type: "string", nullable: true },
                        assignedTo: { type: "string", nullable: true },
                        assignedUserName: { type: "string", nullable: true },
                        remarks: { type: "string", nullable: true },
                        isActive: { type: "integer", enum: [0, 1] },
                        isDeleted: { type: "integer", enum: [0, 1] },
                        createdAt: { type: "string", format: "date-time" },
                        leadSource: {
                            nullable: true,
                            allOf: [{ $ref: "#/components/schemas/LeadSourceSafe" }],
                        },
                        leadStatus: {
                            nullable: true,
                            allOf: [{ $ref: "#/components/schemas/LeadStatusSafe" }],
                        },
                    },
                },
            },
        },
    },
    apis: [
        "./apps/api/src/modules/**/routes.ts",
        "./apps/api/src/modules/**/routes/*.ts",
    ],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
