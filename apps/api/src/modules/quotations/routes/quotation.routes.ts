import { Router } from "express";
import { authenticate } from "../../auth/middleware/auth.middleware.js";
import { 
    validateRequest, 
    createQuotationSchema, 
    updateQuotationSchema, 
    getQuotationParamsSchema, 
    listQuotationSchema 
} from "../validators/quotation.validator.js";
import { 
    createQuotation, 
    updateQuotation, 
    getQuotation, 
    listQuotations, 
    getQuotationDropdown, 
    deleteQuotation, 
    restoreQuotation,
    convertQuotationToProject,
    generateQuotationPdf 
} from "../controllers/quotation.controller.js";

const router = Router();

// Apply authentication to all routes in this module
router.use(authenticate);

/**
 * @swagger
 * /quotations/dropdown:
 *   get:
 *     tags:
 *       - Quotations
 *     summary: Get Quotations for dropdown selection
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully fetched dropdown
 */
router.get("/dropdown", getQuotationDropdown);

/**
 * @swagger
 * /quotations/all:
 *   get:
 *     tags:
 *       - Quotations
 *     summary: Get all active Quotations (unpaginated list)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully fetched all records
 */
router.get("/all", getQuotationDropdown);

/**
 * @swagger
 * /quotations/list:
 *   post:
 *     tags:
 *       - Quotations
 *     summary: List Quotations with pagination and filters
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               page:
 *                 type: integer
 *                 default: 1
 *               limit:
 *                 type: integer
 *                 default: 10
 *               search:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, deleted, all]
 *                 default: active
 *     responses:
 *       200:
 *         description: Successfully fetched list
 */
router.post("/list", validateRequest(listQuotationSchema), listQuotations);

/**
 * @swagger
 * /quotations:
 *   post:
 *     tags:
 *       - Quotations
 *     summary: Create a new Quotation
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - leadUid
 *               - systemSize
 *               - validTill
 *               - products
 *             properties:
 *               leadUid:
 *                 type: string
 *                 format: uuid
 *               systemSize:
 *                 type: number
 *               validTill:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - productUid
 *                     - quantity
 *                   properties:
 *                     productUid:
 *                       type: string
 *                       format: uuid
 *                     quantity:
 *                       type: number
 *                     productName:
 *                       type: string
 *                     pricePerUnit:
 *                       type: number
 *                     gstPercentage:
 *                       type: number
 *                     description:
 *                       type: string
 *               scopeOfWork:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - title
 *                     - value
 *                   properties:
 *                     title:
 *                       type: string
 *                     value:
 *                       type: string
 *                     sortOrder:
 *                       type: integer
 *               termsConditions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - title
 *                     - description
 *                   properties:
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     sortOrder:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Successfully created quotation
 *       400:
 *         description: Validation error
 */
router.post("/", validateRequest(createQuotationSchema), createQuotation);

/**
 * @swagger
 * /quotations/{uid}:
 *   get:
 *     tags:
 *       - Quotations
 *     summary: Get Quotation by UID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Successfully retrieved record
 *       404:
 *         description: Record not found
 */
router.get("/:uid", validateRequest(getQuotationParamsSchema), getQuotation);

/**
 * @swagger
 * /quotations/{uid}:
 *   put:
 *     tags:
 *       - Quotations
 *     summary: Update an existing Quotation
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
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               leadUid:
 *                 type: string
 *                 format: uuid
 *               systemSize:
 *                 type: number
 *               validTill:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *               status:
 *                 type: integer
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - productUid
 *                     - quantity
 *                   properties:
 *                     productUid:
 *                       type: string
 *                       format: uuid
 *                     quantity:
 *                       type: number
 *                     productName:
 *                       type: string
 *                     pricePerUnit:
 *                       type: number
 *                     gstPercentage:
 *                       type: number
 *                     description:
 *                       type: string
 *               scopeOfWork:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     value:
 *                       type: string
 *                     sortOrder:
 *                       type: integer
 *               termsConditions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     sortOrder:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Successfully updated record
 *       400:
 *         description: Validation error or cannot edit converted quotation
 *       404:
 *         description: Record not found
 */
router.put("/:uid", validateRequest(updateQuotationSchema), updateQuotation);

/**
 * @swagger
 * /quotations/{uid}:
 *   delete:
 *     tags:
 *       - Quotations
 *     summary: Soft delete a Quotation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Successfully deleted record
 *       404:
 *         description: Record not found
 */
router.delete("/:uid", validateRequest(getQuotationParamsSchema), deleteQuotation);

/**
 * @swagger
 * /quotations/{uid}/restore:
 *   put:
 *     tags:
 *       - Quotations
 *     summary: Restore a deleted Quotation
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Successfully restored record
 *       404:
 *         description: Record not found
 */
router.put("/:uid/restore", validateRequest(getQuotationParamsSchema), restoreQuotation);

/**
 * @swagger
 * /quotations/{uid}/convert:
 *   put:
 *     tags:
 *       - Quotations
 *     summary: Convert Quotation to Project (update status to 4)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Successfully converted record
 *       404:
 *         description: Record not found
 */
router.put("/:uid/convert", validateRequest(getQuotationParamsSchema), convertQuotationToProject);

/**
 * @swagger
 * /quotations/{uid}/generate-pdf:
 *   post:
 *     tags:
 *       - Quotations
 *     summary: Generate a PDF for the Quotation
 *     description: Fetches snapshotted data, computes central & state subsidies, renders PDF via Puppeteer, and uploads it.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Quotation PDF generated successfully
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
 *                   example: Quotation PDF generated successfully.
 *                 data:
 *                   type: object
 *                   properties:
 *                     pdfUrl:
 *                       type: string
 *                       example: http://localhost:5000/public/uploads/franchises/SED001_c6121b9b-daa3-4741-9e7c-32f99f66fb78/quotations/QT-202607100001.pdf
 *                     pdfPath:
 *                       type: string
 *                       example: franchises/SED001_c6121b9b-daa3-4741-9e7c-32f99f66fb78/quotations/QT-202607100001.pdf
 *       404:
 *         description: Quotation not found
 */
router.post("/:uid/generate-pdf", validateRequest(getQuotationParamsSchema), generateQuotationPdf);

export { router as quotationRoutes };
