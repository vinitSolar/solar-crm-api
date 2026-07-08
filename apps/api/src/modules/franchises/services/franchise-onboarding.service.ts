import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import type { RoleRepository } from "../../roles/repositories/role.repository.js";
import type { UserRepository } from "../../users/repositories/user.repository.js";
import type { LeadSourceRepository } from "../../leads/repositories/lead-source.repository.js";
import type { LeadStatusRepository } from "../../leads/repositories/lead-status.repository.js";
import type { SurveyDocumentTypeRepository } from "../../survey-documents/repositories/survey-document-type.repository.js";
import { SurveyDocumentTypeService } from "../../survey-documents/services/survey-document-type.service.js";
import type { IFranchiseOwnerDetails } from "../interfaces/franchise.interface.js";
import { logger } from "@packages/logger/index.js";

const SALT_ROUNDS = 10;

export class FranchiseOnboardingService {
    private readonly roleRepository: RoleRepository;
    private readonly userRepository: UserRepository;
    private readonly leadSourceRepository: LeadSourceRepository;
    private readonly leadStatusRepository: LeadStatusRepository;
    private readonly surveyDocumentTypeService: SurveyDocumentTypeService;

    constructor(
        roleRepository: RoleRepository, 
        userRepository: UserRepository,
        leadSourceRepository: LeadSourceRepository,
        leadStatusRepository: LeadStatusRepository,
        surveyDocumentTypeRepository: SurveyDocumentTypeRepository
    ) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.leadSourceRepository = leadSourceRepository;
        this.leadStatusRepository = leadStatusRepository;
        this.surveyDocumentTypeService = new SurveyDocumentTypeService(surveyDocumentTypeRepository);
    }

    /**
     * Set up default roles and create an initial admin user for a newly created franchise.
     * @returns The generated plain text password for the admin user, or null if it failed.
     */
    async setupDefaultRolesAndAdmin(
        tenantUid: string,
        ownerDetails: IFranchiseOwnerDetails,
        createdBy: string
    ): Promise<{ adminPassword?: string; adminEmail?: string }> {
        logger.info("FranchiseOnboardingService.setupDefaultRolesAndAdmin", { tenantUid });

        try {
            // 1. Define default roles
            const defaultRoles = [
                { name: "Franchise Owner(Admin)", description: "Full access to franchise operations", canSiteSurvey: 1, canInstallation: 1 },
                { name: "Sales Executive", description: "Manage leads, quotations, and sales pipeline" },
                { name: "Survey Engineer", description: "Conduct site surveys and upload reports" },
                { name: "Backoffice", description: "Manage backoffice administrative tasks" },
                { name: "Warehouse / Procurement", description: "Manage inventory and procurement" },
                { name: "Installer", description: "Handle on-site solar installations" },
            ];

            let adminRoleUid: string | null = null;

            // 2. Create the roles
            for (const roleDef of defaultRoles) {
                const roleUid = uuidv4();
                
                // createRole(uid, tenantUid, data, createdBy)
                const role = await this.roleRepository.createRole(
                    roleUid,
                    tenantUid,
                    roleDef,
                    createdBy
                );

                if (roleDef.name === "Franchise Owner(Admin)") {
                    adminRoleUid = role.uid;
                }
            }

            if (!adminRoleUid) {
                throw new Error("Failed to capture Admin Role UID");
            }

            // 3. Extract user information from owner details
            // Fallback first/last name splitting
            const nameParts = ownerDetails.fullName ? ownerDetails.fullName.trim().split(" ") : ["Admin"];
            const firstName = nameParts[0] || "Admin";
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

            // Use the provided email, or a dummy one if none provided
            const email = ownerDetails.email || `admin_${tenantUid.substring(0, 8)}@example.com`;

            // For now, keep the password the same as the email
            const plainPassword = email;
            const hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS);

            // 4. Create the initial admin user
            const user = await this.userRepository.createUser(
                tenantUid,
                {
                    roleUid: adminRoleUid as string,
                    firstName,
                    lastName,
                    email,
                    password: hashedPassword,
                },
                createdBy
            );

            logger.info("Successfully created default roles and admin user for franchise", {
                tenantUid,
                userUid: user.uid,
                email: user.email,
            });

            // Note: In a real system, we might trigger an email here containing the 'plainPassword' 
            // so the franchise owner can log in.
            
            // 5. Create default Lead Sources
            const defaultLeadSources = [
                { name: "Other", sortOrder: 1, isDefault: 1 },
            ];

            for (const source of defaultLeadSources) {
                await this.leadSourceRepository.create(tenantUid, source, createdBy);
            }

            // 6. Create default Lead Statuses
            const defaultLeadStatuses = [
                { name: "New", sortOrder: 1, isDefault: 1, isClosed: 0 },
                { name: "Contacted", sortOrder: 2, isDefault: 0, isClosed: 0 },
                { name: "Follow Up", sortOrder: 3, isDefault: 0, isClosed: 0 },
                { name: "Quotation Sent", sortOrder: 4, isDefault: 0, isClosed: 0 },
                { name: "Negotiation", sortOrder: 5, isDefault: 0, isClosed: 0 },
                { name: "Won", sortOrder: 6, isDefault: 0, isClosed: 1 },
                { name: "Lost", sortOrder: 7, isDefault: 0, isClosed: 1 },
            ];

            for (const status of defaultLeadStatuses) {
                await this.leadStatusRepository.create(tenantUid, status, createdBy);
            }

            logger.info("Successfully created default lead sources and statuses for franchise", { tenantUid });

            // 7. Create Default Survey Document Types
            await this.surveyDocumentTypeService.createDefaultDocumentTypes(tenantUid, createdBy);
            logger.info("Successfully created default survey document types for franchise", { tenantUid });

            return { adminPassword: plainPassword, adminEmail: email };

        } catch (error) {
            logger.error("FranchiseOnboardingService.setupDefaultRolesAndAdmin failed", { error, tenantUid });
            // We intentionally don't throw the error up, so that the franchise creation itself
            // is not rolled back if only the onboarding steps fail. A background job or manual
            // retry mechanism could retry onboarding later.
            return {};
        }
    }
}
