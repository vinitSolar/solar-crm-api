import type { Request, Response, NextFunction } from "express";
import { Router } from "express";
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
} from "../validators/franchise.validator.js";
import { authenticate } from "../../auth/middleware/auth.middleware.js";
import type { IAuthenticatedRequest } from "../../auth/interfaces/auth.interface.js";
import pool from "@packages/connection.js";
import { RoleRepository } from "../../roles/repositories/role.repository.js";
import { UserRepository } from "../../users/repositories/user.repository.js";
import { FranchiseOnboardingService } from "../services/franchise-onboarding.service.js";

function createFranchiseRouter(): Router {
    const router = Router();

    // Dependency injection
    const franchiseRepository = new FranchiseRepository(pool);
    const roleRepository = new RoleRepository(pool);
    const userRepository = new UserRepository(pool);
    
    const franchiseOnboardingService = new FranchiseOnboardingService(roleRepository, userRepository);
    const franchiseService = new FranchiseService(franchiseRepository, franchiseOnboardingService, pool);
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
     *             required: [franchise, owner, business]
     *             properties:
     *               franchise:
     *                 type: object
     *                 required: [name, code]
     *                 properties:
     *                   name:
     *                     type: string
     *                     example: "Solar Express Delhi"
     *                   code:
     *                     type: string
     *                     example: "SED001"
     *                   email:
     *                     type: string
     *                     example: "delhi@solarexpress.com"
     *                   mobile:
     *                     type: string
     *                     example: "9876543210"
     *                   logo:
     *                     type: string
     *                     example: "https://cdn.example.com/logo.png"
     *               owner:
     *                 type: object
     *                 required: [fullName, mobileNumber]
     *                 properties:
     *                   fullName:
     *                     type: string
     *                     example: "Rajesh Kumar"
     *                   dateOfBirth:
     *                     type: string
     *                     example: "1990-05-15"
     *                   profilePhoto:
     *                     type: string
     *                   mobileNumber:
     *                     type: string
     *                     example: "9876543210"
     *                   alternateNumber:
     *                     type: string
     *                   email:
     *                     type: string
     *                     example: "rajesh@example.com"
     *                   residentialAddress:
     *                     type: string
     *               business:
     *                 type: object
     *                 required: [businessName, gstNumber, panNumber]
     *                 properties:
     *                   businessName:
     *                     type: string
     *                     example: "Solar Express Pvt Ltd"
     *                   gstNumber:
     *                     type: string
     *                     example: "22AAAAA0000A1Z5"
     *                   panNumber:
     *                     type: string
     *                     example: "ABCDE1234F"
     *                   cinNumber:
     *                     type: string
     *                   msmeRegistrationNumber:
     *                     type: string
     *                   tradeLicenseNumber:
     *                     type: string
     *                   businessAddress:
     *                     type: string
     *                   city:
     *                     type: string
     *                   state:
     *                     type: string
     *                   pinCode:
     *                     type: string
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
     *                 properties:
     *                   name:
     *                     type: string
     *                   email:
     *                     type: string
     *                   mobile:
     *                     type: string
     *                   logo:
     *                     type: string
     *               owner:
     *                 type: object
     *                 properties:
     *                   fullName:
     *                     type: string
     *                   dateOfBirth:
     *                     type: string
     *                   profilePhoto:
     *                     type: string
     *                   mobileNumber:
     *                     type: string
     *                   alternateNumber:
     *                     type: string
     *                   email:
     *                     type: string
     *                   residentialAddress:
     *                     type: string
     *               business:
     *                 type: object
     *                 properties:
     *                   businessName:
     *                     type: string
     *                   gstNumber:
     *                     type: string
     *                   panNumber:
     *                     type: string
     *                   cinNumber:
     *                     type: string
     *                   msmeRegistrationNumber:
     *                     type: string
     *                   tradeLicenseNumber:
     *                     type: string
     *                   businessAddress:
     *                     type: string
     *                   city:
     *                     type: string
     *                   state:
     *                     type: string
     *                   pinCode:
     *                     type: string
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

    return router;
}

export const franchiseRoutes = createFranchiseRouter();
