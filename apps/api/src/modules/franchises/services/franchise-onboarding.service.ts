import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import pool from "@packages/connection.js";
import type { RoleRepository } from "../../roles/repositories/role.repository.js";
import type { UserRepository } from "../../users/repositories/user.repository.js";
import type { LeadSourceRepository } from "../../leads/repositories/lead-source.repository.js";
import type { LeadStatusRepository } from "../../leads/repositories/lead-status.repository.js";
import { MasterDocumentTypeService } from "../../master-documents/services/master-document-type.service.js";
import type { MasterDocumentTypeRepository } from "../../master-documents/repositories/master-document-type.repository.js";
import { ProjectStatusRepository } from "../../projects/repositories/project-status.repository.js";
import type { IFranchiseOwnerDetails } from "../interfaces/franchise.interface.js";
import { logger } from "@packages/logger/index.js";
import type { MenuRepository } from "../../menus/repositories/menu.repository.js";
import type { RolePermissionRepository } from "../../role-permissions/repositories/role-permission.repository.js";
import { QuotationTermsConditionRepository } from "../../quotation-terms-conditions/repositories/quotation-terms-condition.repository.js";
import { QuotationScopeOfWorkRepository } from "../../quotation-scope-of-work/repositories/quotation-scope-of-work.repository.js";
import { FranchiseDocumentTypeRepository } from "../repositories/franchise-document-type.repository.js";
import { notificationService } from "../../notification/services/notification.service.js";
import { NOTIFICATION_CHANNEL, NOTIFICATION_TEMPLATE } from "../../notification/constants/notification.constants.js";
import { env } from "@packages/config/env.js";

const SALT_ROUNDS = 10;

export class FranchiseOnboardingService {
    private readonly roleRepository: RoleRepository;
    private readonly userRepository: UserRepository;
    private readonly leadSourceRepository: LeadSourceRepository;
    private readonly leadStatusRepository: LeadStatusRepository;
    private readonly menuRepository: MenuRepository;
    private readonly rolePermissionRepository: RolePermissionRepository;
    private readonly quotationTermsConditionRepository: QuotationTermsConditionRepository;
    private readonly quotationScopeOfWorkRepository: QuotationScopeOfWorkRepository;
    private readonly masterDocumentTypeService: MasterDocumentTypeService;
    private readonly projectStatusRepository: ProjectStatusRepository;
    private readonly franchiseDocumentTypeRepository: FranchiseDocumentTypeRepository;

    constructor(
        roleRepository: RoleRepository, 
        userRepository: UserRepository,
        leadSourceRepository: LeadSourceRepository,
        leadStatusRepository: LeadStatusRepository,
        menuRepository: MenuRepository,
        rolePermissionRepository: RolePermissionRepository,
        masterDocumentTypeRepository: MasterDocumentTypeRepository
    ) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.leadSourceRepository = leadSourceRepository;
        this.leadStatusRepository = leadStatusRepository;
        this.menuRepository = menuRepository;
        this.rolePermissionRepository = rolePermissionRepository;
        this.quotationTermsConditionRepository = new QuotationTermsConditionRepository();
        this.quotationScopeOfWorkRepository = new QuotationScopeOfWorkRepository();
        this.masterDocumentTypeService = new MasterDocumentTypeService(masterDocumentTypeRepository);
        this.projectStatusRepository = new ProjectStatusRepository(pool);
        this.franchiseDocumentTypeRepository = new FranchiseDocumentTypeRepository();
    }

    /**
     * Set up default roles and create an initial admin user for a newly created franchise.
     * @returns The generated plain text password for the admin user, or null if it failed.
     */
    async setupDefaultRolesAndAdmin(
        tenantUid: string,
        ownerDetails: IFranchiseOwnerDetails,
        createdBy: string,
        franchiseEmail?: string | null,
        franchisePassword?: string | null
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

            // Ensure owner email is provided for credentials
            const email = franchiseEmail || ownerDetails.email;
            if (!email) {
                throw new Error("Franchise email or Owner email is required to create franchise credentials");
            }

            let plainPassword = "";
            let hashedPassword = null;
            if (franchisePassword !== undefined && franchisePassword !== null) {
                plainPassword = franchisePassword;
                hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS);
            }

            // 4. Create the initial admin user
            try {
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
            } catch (userError) {
                logger.error("Failed to create initial admin user for franchise (possibly duplicate email)", { 
                    error: userError, 
                    tenantUid, 
                    email 
                });
            }

            // 4.1 Dispatch Credentials Email
            if (plainPassword) {
                try {
                    await notificationService.send({
                        tenantUid: tenantUid,
                        module: "Franchise",
                        referenceUid: tenantUid,
                        channel: NOTIFICATION_CHANNEL.EMAIL,
                        template: NOTIFICATION_TEMPLATE.FRANCHISE_CREDENTIALS,
                        recipient: email,
                        variables: {
                            franchiseName: `${firstName} ${lastName}`.trim(),
                            email: email,
                            password: plainPassword,
                            loginUrl: `${env.APP.URL || 'http://localhost:3000'}/login`
                        }
                    });
                } catch (emailError) {
                    logger.error("Failed to dispatch credentials email for franchise", { error: emailError, tenantUid });
                }
            }

            // 4.5 Assign all menu permissions to Admin Role
            const allMenus = await this.menuRepository.findAll("active");
            if (allMenus.length > 0) {
                const adminPermissions = allMenus.map((menu: any) => ({
                    menuUid: menu.uid,
                    canView: 1,
                    canCreate: 1,
                    canEdit: 1,
                    canDelete: 1,
                }));
                await this.rolePermissionRepository.upsertMenuPermissions(
                    adminRoleUid as string,
                    tenantUid,
                    adminPermissions
                );
                logger.info(`Assigned ${adminPermissions.length} menu permissions to Admin role`, { adminRoleUid, tenantUid });
            }

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

            // 6.5 Create default Project Statuses
            const defaultProjectStatuses = [
                { name: "Not Started", sortOrder: 1, isDefault: 1, isClosed: 0 },
                { name: "In Progress", sortOrder: 2, isDefault: 0, isClosed: 0 },
                { name: "Commissioned", sortOrder: 3, isDefault: 0, isClosed: 1 },
                { name: "On Hold", sortOrder: 4, isDefault: 0, isClosed: 0 },
                { name: "Cancelled", sortOrder: 5, isDefault: 0, isClosed: 1 },
            ];

            for (const status of defaultProjectStatuses) {
                await this.projectStatusRepository.create(tenantUid, status, createdBy);
            }
            logger.info("Successfully created default project statuses for franchise", { tenantUid });

            // 7. Create Default Master Document Types (covers survey, product, franchise, etc.)
            await this.masterDocumentTypeService.createDefaultDocumentTypes(tenantUid, createdBy);
            logger.info("Successfully created default master document types for franchise", { tenantUid });

            // 7.5 Create Default Franchise Document Types
            const defaultFranchiseDocs = [
                { name: "GST Certificate", description: "Business GST Registration", isRequired: 1 },
                { name: "PAN Card", description: "Business PAN Card", isRequired: 1 },
                { name: "Aadhaar Card", description: "Owner Aadhaar Card", isRequired: 1 },
                { name: "Bank Cancelled Cheque", description: "Cancelled cheque for account verification", isRequired: 1 },
                { name: "Partnership Deed / COI", description: "Certificate of Incorporation or Partnership Deed", isRequired: 0 },
            ];

            for (let i = 0; i < defaultFranchiseDocs.length; i++) {
                const doc = defaultFranchiseDocs[i];
                if (!doc) continue;
                await this.franchiseDocumentTypeRepository.upsert(
                    {
                        name: doc.name,
                        description: doc.description,
                        isRequired: doc.isRequired,
                        sortOrder: i + 1,
                        allowMultiple: 0,
                    },
                    createdBy
                );
            }
            logger.info("Successfully created default franchise document types", { tenantUid });

            // 8. Create Default Quotation Terms & Conditions
            const defaultTerms = [
                { title: "Taxes & Duties", description: ["All taxes and duties as applicable at the time of delivery will be extra."] },
                { title: "Transportation Charges", description: ["Transportation charges will be actuals and paid by the client."] },
                { title: "Payment Terms", description: ["100% advance along with purchase order."] },
                { title: "Project Completion Period", description: ["The project will be completed within 30 days from the date of advance receipt."] },
                { title: "Additional Material / Work", description: ["Any additional material or work beyond the scope will be charged extra."] },
                { title: "System Handover", description: ["System will be handed over to the client only after full payment."] },
            ];

            for (let i = 0; i < defaultTerms.length; i++) {
                const term = defaultTerms[i];
                if (!term) continue;
                
                await this.quotationTermsConditionRepository.create(
                    tenantUid,
                    {
                        title: term.title,
                        description: term.description,
                        sortOrder: i + 1,
                        isDefault: 1
                    },
                    createdBy
                );
            }
            logger.info("Successfully created default quotation terms & conditions for franchise", { tenantUid });

            // 9. Create Default Quotation Scope of Work
            const defaultScopeOfWork = [
                { title: "Roof Top Area @ 10 Sq.Mtr./KWp", value: "Customer Scope" },
                { title: "Civil Works", value: "Included" },
                { title: "Module Mounting Structure", value: "Included" },
                { title: "Mounting, Erection & Commissioning", value: "Included" },
                { title: "Power Evacuation (Solar Plant to Mains)", value: "Included @ 20 Mtr" },
                { title: "Earthing System", value: "Included" },
                { title: "DISCOM & Net Meter Charges", value: "Included" },
                { title: "Free Operation & Maintenance", value: "Included for 5 Years" },
            ];

            for (let i = 0; i < defaultScopeOfWork.length; i++) {
                const scope = defaultScopeOfWork[i];
                if (!scope) continue;

                await this.quotationScopeOfWorkRepository.create(
                    tenantUid,
                    {
                        title: scope.title,
                        value: scope.value,
                        sortOrder: i + 1,
                        isDefault: 1
                    },
                    createdBy
                );
            }
            logger.info("Successfully created default quotation scope of work for franchise", { tenantUid });



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
