import { Router } from "express";
import multer from "multer";
import { ProductController } from "../controllers/product.controller.js";
import { ProductService } from "../services/product.service.js";
import { ProductRepository } from "../repositories/product.repository.js";
import { authenticate } from "../../auth/middleware/auth.middleware.js";
import { createProductSchema, updateProductSchema, paginationSchema, validateProductRequest, validateDeleteProductImageRequest } from "../validators/product.validator.js";
import pool from "@packages/connection.js";
import { requirePermission } from "../../../middlewares/permission.middleware.js";

const router = Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const repository = new ProductRepository(pool);
const service = new ProductService(repository);
const controller = new ProductController(service);

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product Management APIs
 */

/**
 * @swagger
 * /products/list:
 *   post:
 *     tags: [Products]
 *     summary: Get paginated products
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
     *             $ref: '#/components/schemas/paginationSchemaBody'
 *             properties:
 *               page:
 *                 type: integer
 *                 default: 1
 *               limit:
 *                 type: integer
 *                 default: 10
 *               search:
 *                 type: string
 *               categoryUid:
 *                 type: string
 *                 format: uuid
 *               brandUid:
 *                 type: string
 *                 format: uuid
 *               status:
 *                 type: string
 *                 enum: [active, deleted, all]
 *                 default: active
 *     responses:
 *       200:
 *         description: Products fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       uid:
 *                         type: string
 *                       categoryUid:
 *                         type: string
 *                       brandUid:
 *                         type: string
 *                       unitUid:
 *                         type: string
 *                       name:
 *                         type: string
 *                       productCode:
 *                         type: string
 *                       pricePerUnit:
 *                         type: number
 *                       gstPercentage:
 *                         type: number
 *                       capacity:
 *                         type: string
 *                       capacityUnit:
 *                         type: string
 *                       warranty:
 *                         type: string
 *                       description:
 *                         type: string
 *                       modelNumber:
 *                         type: string
 *                       height:
 *                         type: number
 *                       width:
 *                         type: number
 *                       length:
 *                         type: number


 *                       palletLength:
 *                         type: number
 *                       palletWidth:
 *                         type: number
 *                       palletHeight:
 *                         type: number
 *                       palletWeight:
 *                         type: number
 *                       palletDimension:
 *                         type: string
 *                       quantityPerPallet:
 *                         type: integer
 *                       cellTechnology:
 *                         type: string
 *                       images:
 *                         type: array
 *                         items:
 *                           type: string
 *                       isActive:
 *                         type: boolean
 *                       isDeleted:
 *                         type: boolean
 *                       brandName:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
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
 */
router.post("/list", requirePermission("PRODUCTS", "can_view"), validateProductRequest(paginationSchema), controller.getPaginatedProducts);


/**
 * @swagger
 * /products/all:
 *   get:
 *     tags: [Products]
 *     summary: Get all products for dropdowns
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, deleted, all]
 *     responses:
 *       200:
 *         description: Products fetched successfully
 */
router.get("/all", requirePermission("PRODUCTS", "can_view"), controller.getDropdownProducts);



/**
 * @swagger
 * /products/{uid}:
 *   get:
 *     tags: [Products]
 *     summary: Get product by UID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product fetched successfully
 */
router.get("/:uid", requirePermission("PRODUCTS", "can_view"), controller.getProductByUid);

/**
 * @swagger
 * /products:
 *   post:
 *     tags: [Products]
 *     summary: Create a new product
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               categoryUid:
 *                 type: string
 *                 format: uuid
 *               brandUid:
 *                 type: string
 *                 format: uuid
 *               unitUid:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 *               productCode:
 *                 type: string
 *               pricePerUnit:
 *                 type: number
 *               gstPercentage:
 *                 type: number
 *               capacity:
 *                 type: string
 *               capacityUnit:
 *                 type: string
 *               warranty:
 *                 type: string
 *               description:
 *                 type: string
 *               modelNumber:
 *                 type: string
 *               height:
 *                 type: number
 *               width:
 *                 type: number


 *               palletLength:
 *                 type: number
 *               palletWidth:
 *                 type: number
 *               palletHeight:
 *                 type: number
 *               palletWeight:
 *                 type: number
 *               palletDimension:
 *                 type: string
 *               quantityPerPallet:
 *                 type: integer
 *               cellTechnology:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Array of product document files (e.g. datasheet, warranty certificate, installation manual)
 *               documentTypeUids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: JSON stringified array or multiple field entries of product document type UIDs matching files array in the exact same order
 *     responses:
 *       201:
 *         description: Product created successfully
 */
router.post("/", requirePermission("PRODUCTS", "can_create"), upload.any(), validateProductRequest(createProductSchema), controller.createProduct);

/**
 * @swagger
 * /products/{uid}:
 *   put:
 *     tags: [Products]
 *     summary: Update an existing product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               categoryUid:
 *                 type: string
 *                 format: uuid
 *               brandUid:
 *                 type: string
 *                 format: uuid
 *               unitUid:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 *               productCode:
 *                 type: string
 *               pricePerUnit:
 *                 type: number
 *               gstPercentage:
 *                 type: number
 *               capacity:
 *                 type: string
 *               capacityUnit:
 *                 type: string
 *               warranty:
 *                 type: string
 *               description:
 *                 type: string
 *               modelNumber:
 *                 type: string
 *               height:
 *                 type: number
 *               width:
 *                 type: number


 *               palletLength:
 *                 type: number
 *               palletWidth:
 *                 type: number
 *               palletHeight:
 *                 type: number
 *               palletWeight:
 *                 type: number
 *               palletDimension:
 *                 type: string
 *               quantityPerPallet:
 *                 type: integer
 *               cellTechnology:
 *                 type: string
 *               existingImages:
 *                 type: string
 *                 description: JSON stringified array of existing image URLs to keep (e.g. '["url1", "url2"]')
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Array of new product document files to upload
 *               documentTypeUids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: JSON stringified array or multiple field entries of product document type UIDs matching new files in the exact same order
 *               deleteDocumentUids:
 *                 type: string
 *                 description: JSON stringified array or multiple field entries of document UIDs or association UIDs to soft delete (e.g. '["uid1", "uid2"]')
 *               isActive:
 *                 type: integer
 *                 enum: [0, 1]
 *     responses:
 *       200:
 *         description: Product updated successfully
 */
router.put("/:uid", requirePermission("PRODUCTS", "can_edit"), upload.any(), validateProductRequest(updateProductSchema), controller.updateProduct);

/**
 * @swagger
 * /products/{uid}/images:
 *   delete:
 *     tags: [Products]
 *     summary: Delete a product image using link
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: Product UID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - link
 *             properties:
 *               link:
 *                 type: string
 *                 description: Image URL or storage key to delete
 *                 example: "https://backend.sunselect.in/public/uploads/products/1b6e738a-b4f1-4128-b890-591741a7557b/images/1c29088c-31c4-4cbe-b981-072e14e3762e.jpg"
 *               imageUrl:
 *                 type: string
 *                 description: Alias for link
 *     responses:
 *       200:
 *         description: Product image deleted successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Product or image not found
 */
router.delete("/images", requirePermission("PRODUCTS", "can_edit"), validateDeleteProductImageRequest, controller.deleteProductImage);
router.delete("/image", requirePermission("PRODUCTS", "can_edit"), validateDeleteProductImageRequest, controller.deleteProductImage);
router.delete("/:uid/images", requirePermission("PRODUCTS", "can_edit"), validateDeleteProductImageRequest, controller.deleteProductImage);
router.delete("/:uid/image", requirePermission("PRODUCTS", "can_edit"), validateDeleteProductImageRequest, controller.deleteProductImage);
router.post("/:uid/images/delete", requirePermission("PRODUCTS", "can_edit"), validateDeleteProductImageRequest, controller.deleteProductImage);
router.post("/images/delete", requirePermission("PRODUCTS", "can_edit"), validateDeleteProductImageRequest, controller.deleteProductImage);

/**
 * @swagger
 * /products/{uid}:
 *   delete:
 *     tags: [Products]
 *     summary: Soft delete a product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted successfully
 */
router.delete("/:uid", requirePermission("PRODUCTS", "can_delete"), controller.deleteProduct);

/**
 * @swagger
 * /products/{uid}/restore:
 *   put:
 *     tags: [Products]
 *     summary: Restore a soft-deleted product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product restored successfully
 */
router.put("/:uid/restore", requirePermission("PRODUCTS", "can_edit"), controller.restoreProduct);

export default router;
