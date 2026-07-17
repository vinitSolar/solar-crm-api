import type { Request, Response, NextFunction } from "express";
import { Router } from "express";
import multer from "multer";
import { FranchiseController } from "../controllers/franchise.controller.js";
import { FranchiseService } from "../services/franchise.service.js";
import { FranchiseRepository } from "../repositories/franchise.repository.js";
import {
    createFranchiseSchema,
    updateFranchiseSchema,
    getFranchiseSchema,
    deleteFranchiseSchema,
    restoreFranchiseSchema,
    getPaginatedFranchisesSchema,
    getAllFranchisesSchema,
    validateFranchiseRequest,
    addFranchiseDocumentSchema,
} from "../validators/franchise.validator.js";
import { authenticate } from "../../auth/middleware/auth.middleware.js";
import type { IAuthenticatedRequest } from "../../auth/interfaces/auth.interface.js";
import pool from "@packages/connection.js";
import { RoleRepository } from "../../roles/repositories/role.repository.js";
import { UserRepository } from "../../users/repositories/user.repository.js";
import { LeadSourceRepository } from "../../leads/repositories/lead-source.repository.js";
import { LeadStatusRepository } from "../../leads/repositories/lead-status.repository.js";
import { FranchiseOnboardingService } from "../services/franchise-onboarding.service.js";
import { SurveyDocumentTypeRepository } from "../../survey-documents/repositories/survey-document-type.repository.js";
import { ProductDocumentTypeRepository } from "../../product-document-types/repositories/product-document-type.repository.js";
import { MenuRepository } from "../../menus/repositories/menu.repository.js";
import { RolePermissionRepository } from "../../role-permissions/repositories/role-permission.repository.js";
import { storageService } from "@packages/storage/index.js";
import { FranchiseDocumentTypeRepository } from "../../franchise-document-types/repositories/franchise-document-type.repository.js";

function createFranchiseRouter(): Router {
    const router = Router();
    const upload = multer({
        storage: multer.memoryStorage(),
        limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    });


    // Dependency injection
    const franchiseRepository = new FranchiseRepository(pool);
    const roleRepository = new RoleRepository(pool);
    const userRepository = new UserRepository(pool);
    const leadSourceRepository = new LeadSourceRepository(pool);
    const leadStatusRepository = new LeadStatusRepository(pool);
    const surveyDocumentTypeRepository = new SurveyDocumentTypeRepository(pool);
    const productDocumentTypeRepository = new ProductDocumentTypeRepository(pool);
    const menuRepository = new MenuRepository(pool);
    const rolePermissionRepository = new RolePermissionRepository(pool);
    const franchiseDocumentTypeRepository = new FranchiseDocumentTypeRepository(pool);
    
    const franchiseOnboardingService = new FranchiseOnboardingService(
        roleRepository, 
        userRepository,
        leadSourceRepository,
        leadStatusRepository,
        surveyDocumentTypeRepository,
        productDocumentTypeRepository,
        menuRepository,
        rolePermissionRepository,
        franchiseDocumentTypeRepository
    );
    const franchiseService = new FranchiseService(
        franchiseRepository, 
        franchiseOnboardingService, 
        franchiseDocumentTypeRepository,
        storageService,
        pool
    );
    const franchiseController = new FranchiseController(franchiseService);

    // Middleware to ensure only Head Office (type = 0) can manage franchises
    const requireHeadOffice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authReq = req as IAuthenticatedRequest;
            const isHeadOffice = await franchiseRepository.isHeadOffice(authReq.tenantUid);
            if (!isHeadOffice) {
                res.status(403).json({
                    success: false,
                    message: "Forbidden: You do not have permission to perform this action",
                });
                return;
            }
            next();
        } catch (error) {
            next(error);
        }
    };

    // Apply authentication and Head Office authorization to all franchise routes
    router.use(authenticate, requireHeadOffice);

    /**
     * @swagger
     * /franchises/list:
     *   post:
     *     tags: [Franchises]
     *     summary: Get paginated franchises
     *     description: Retrieves a paginated list of all franchises (tenants with type=1).
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: false
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               page:
     *                 type: integer
     *                 example: 1
     *               limit:
     *                 type: integer
     *                 example: 10
     *               search:
     *                 type: string
     *                 description: Search by name, code, or email
     *               status:
     *                 type: string
     *                 enum: [active, deleted, all]
     *                 example: active
     *     responses:
     *       200:
     *         description: Franchises fetched successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 message:
     *                   type: string
     *                 data:
     *                   type: array
     *                   items:
     *                     $ref: '#/components/schemas/FranchiseSafe'
     *                 meta:
     *                   type: object
     *                   properties:
     *                     total:
     *                       type: integer
     *                     page:
     *                       type: integer
     *                     limit:
     *                       type: integer
     *                     totalPages:
     *                       type: integer
     *       401:
     *         description: Unauthorized
     */
    router.post(
        "/list",
        validateFranchiseRequest(getPaginatedFranchisesSchema),
        franchiseController.getFranchises,
    );

    /**
     * @swagger
     * /franchises/all:
     *   get:
     *     tags: [Franchises]
     *     summary: Get all franchises (without pagination)
     *     description: Retrieves a list of all franchises, useful for dropdowns.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: status
     *         required: false
     *         schema:
     *           type: string
     *           enum: [active, deleted, all]
     *         description: Filter franchises by status
     *     responses:
     *       200:
     *         description: All franchises fetched successfully
     *       401:
     *         description: Unauthorized
     */
    router.get(
        "/all",
        validateFranchiseRequest(getAllFranchisesSchema),
        franchiseController.getAllFranchises,
    );

    /**
     * @swagger
     * /franchises/{uid}:
     *   get:
     *     tags: [Franchises]
     *     summary: Get a specific franchise by UID
     *     description: Retrieves full franchise details including tenant info, owner details, and business details.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *         description: The franchise UID
     *     responses:
     *       200:
     *         description: Franchise fetched successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 message:
     *                   type: string
     *                 data:
     *                   type: object
     *                   properties:
     *                     franchise:
     *                       $ref: '#/components/schemas/FranchiseSafe'
     *                     owner:
     *                       $ref: '#/components/schemas/FranchiseOwnerDetails'
     *                     business:
     *                       $ref: '#/components/schemas/FranchiseBusinessDetails'
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: Franchise not found
     */
    router.get(
        "/:uid",
        validateFranchiseRequest(getFranchiseSchema),
        franchiseController.getFranchiseByUid,
    );

    /**
     * @swagger
     * /franchises:
     *   post:
     *     tags: [Franchises]
     *     summary: Create a new franchise
     *     description: |
     *       Creates a new franchise by inserting a tenant (type=1), owner details, and
     *       business details in a single transaction. The franchise starts as active
     *       (is_active=1) with onboarding_status=0 (Pending).
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               franchise:
     *                 type: object
     *                 description: Franchise object details
     *               owner:
     *                 type: object
     *                 description: Owner object details
     *               business:
     *                 type: object
     *                 description: Business object details
     *               service_area_city_uids:
     *                 type: array
     *                 items:
     *                   type: string
     *                   format: uuid
     *
     *     responses:
     *       201:
     *         description: Franchise created successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 message:
     *                   type: string
     *                   example: "Franchise created successfully"
     *                 data:
     *                   type: object
     *                   properties:
     *                     franchise:
     *                       type: object
     *                       properties:
     *                         tenantUid:
     *                           type: string
     *                         franchiseName:
     *                           type: string
     *                         franchiseCode:
     *                           type: string
     *                         onboardingStatus:
     *                           type: integer
     *                           example: 0
     *       400:
     *         description: Validation failed
     *       401:
     *         description: Unauthorized
     *       409:
     *         description: Tenant code already exists
     */
    router.post(
        "/",
        validateFranchiseRequest(createFranchiseSchema),
        franchiseController.createFranchise,
    );

    /**
     * @swagger
     * /franchises/{uid}:
     *   put:
     *     tags: [Franchises]
     *     summary: Update an existing franchise
     *     description: |
     *       Updates tenant, owner, and/or business details for an existing franchise.
     *       All three sections are optional — only provided sections will be updated.
     *       Executed within a single database transaction.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *         description: The franchise UID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               franchise:
     *                 type: object
     *                 description: Franchise object details
     *               owner:
     *                 type: object
     *                 description: Owner object details
     *               business:
     *                 type: object
     *                 description: Business object details
     *               service_area_city_uids:
     *                 type: array
     *                 items:
     *                   type: string
     *                   format: uuid
     *     responses:
     *       200:
     *         description: Franchise updated successfully
     *       400:
     *         description: Validation failed
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: Franchise not found
     */
    router.put(
        "/:uid",
        validateFranchiseRequest(updateFranchiseSchema),
        franchiseController.updateFranchise,
    );

    /**
     * @swagger
     * /franchises/{uid}:
     *   delete:
     *     tags: [Franchises]
     *     summary: Soft delete a franchise
     *     description: |
     *       Soft deletes a franchise and its associated owner and business details.
     *       Sets is_deleted=1 on the tenant, franchise_owner_details, and franchise_business_details records.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *         description: The franchise UID
     *     responses:
     *       200:
     *         description: Franchise deleted successfully
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: Franchise not found
     */
    router.delete(
        "/:uid",
        validateFranchiseRequest(deleteFranchiseSchema),
        franchiseController.deleteFranchise,
    );

    /**
     * @swagger
     * /franchises/{uid}/restore:
     *   put:
     *     tags: [Franchises]
     *     summary: Restore a soft-deleted franchise
     *     description: |
     *       Restores a soft-deleted franchise and its associated owner and business details.
     *       Sets is_deleted=0 on all related records.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *         description: The franchise UID
     *     responses:
     *       200:
     *         description: Franchise restored successfully
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: Franchise not found or not in deleted state
     */
    router.put(
        "/:uid/restore",
        validateFranchiseRequest(restoreFranchiseSchema),
        franchiseController.restoreFranchise,
    );

    /**
     * @swagger
     * /franchises/{uid}/logo:
     *   post:
     *     tags: [Franchises]
     *     summary: Upload a logo for a franchise
     *     description: Uploads a logo file (e.g., PNG, JPG) to Local/S3 storage and updates the tenant record. Max size 5MB.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             properties:
     *               logo:
     *                 type: string
     *                 format: binary
     *     responses:
     *       200:
     *         description: Logo uploaded successfully
     *       400:
     *         description: Bad Request (no file or size exceeded)
     *       404:
     *         description: Franchise not found
     */
    router.post(
        "/:uid/logo",
        authenticate,
        upload.single("logo"),
        franchiseController.uploadLogo,
    );

    /**
     * @swagger
     * /franchises/{uid}/documents:
     *   post:
     *     tags: [Franchises]
     *     summary: Add a document to a franchise
     *     description: Uploads a document file and associates it with a specific document type for the franchise.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *         description: The franchise UID
     *     requestBody:
     *       required: true
     *       content:
     *         multipart/form-data:
     *           schema:
     *             type: object
     *             properties:
     *               documentTypeUid:
     *                 type: string
     *                 format: uuid
     *                 description: The UID of the franchise document type
     *               documentNumber:
     *                 type: string
     *                 description: Optional document number (e.g., PAN number, GST number)
     *               documentFile:
     *                 type: string
     *                 format: binary
     *                 description: The document file to upload
     *     responses:
     *       200:
     *         description: Document added successfully
     *       400:
     *         description: Validation error or missing file
     *       404:
     *         description: Franchise or document type not found
     */
    router.post(
        "/:uid/documents",
        upload.single("documentFile"),
        validateFranchiseRequest(addFranchiseDocumentSchema),
        franchiseController.addDocument,
    );

    /**
     * @swagger
     * /franchises/{uid}/service-areas:
     *   get:
     *     tags: [Franchises]
     *     summary: Get service areas for a franchise
     *     description: Retrieves the list of cities assigned to a specific franchise.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: uid
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *         description: The franchise UID
     *     responses:
     *       200:
     *         description: Service areas fetched successfully
     *       401:
     *         description: Unauthorized
     *       404:
     *         description: Franchise not found
     */
    router.get(
        "/:uid/service-areas",
        validateFranchiseRequest(getFranchiseSchema),
        franchiseController.getServiceAreas,
    );

    return router;
}

export const franchiseRoutes = createFranchiseRouter();
