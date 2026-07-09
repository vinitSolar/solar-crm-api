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
            { name: "StateSubsidyRules", description: "State Subsidy Rule Management APIs" },
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
                SiteSurveyDocumentSafe: {
                    type: "object",
                    properties: {
                        documentTypeUid: { type: "string" },
                        documentTypeName: { type: "string", nullable: true },
                        files: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    uid: { type: "string" },
                                    originalName: { type: "string" },
                                    fileUrl: { type: "string" },
                                    mimeType: { type: "string" },
                                    fileSize: { type: "integer" },
                                    remarks: { type: "string", nullable: true },
                                    createdAt: { type: "string", format: "date-time" },
                                }
                            }
                        }
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
                    },
                },
                RoleMenuPermissionSafe: {
                    type: "object",
                    properties: {
                        menuUid: { type: "string" },
                        menuName: { type: "string" },
                        menuCode: { type: "string" },
                        canView: { type: "integer", enum: [0, 1] },
                        canCreate: { type: "integer", enum: [0, 1] },
                        canEdit: { type: "integer", enum: [0, 1] },
                        canDelete: { type: "integer", enum: [0, 1] },
                    },
                },
                UserMenuPermissionSafe: {
                    type: "object",
                    properties: {
                        menuUid: { type: "string" },
                        menuName: { type: "string", nullable: true },
                        menuCode: { type: "string", nullable: true },
                        canView: { type: "integer", enum: [0, 1] },
                        canCreate: { type: "integer", enum: [0, 1] },
                        canEdit: { type: "integer", enum: [0, 1] },
                        canDelete: { type: "integer", enum: [0, 1] },
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
