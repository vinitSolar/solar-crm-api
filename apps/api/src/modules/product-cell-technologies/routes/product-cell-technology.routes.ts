import { Router } from "express";
import { ProductCellTechnologyController } from "../controllers/product-cell-technology.controller.js";
import { ProductCellTechnologyService } from "../services/product-cell-technology.service.js";
import { ProductCellTechnologyRepository } from "../repositories/product-cell-technology.repository.js";
import { authenticate } from "../../auth/middleware/auth.middleware.js";
import { createProductCellTechnologySchema, updateProductCellTechnologySchema, paginationSchema, validateProductCellTechnologyRequest } from "../validators/product-cell-technology.validator.js";

const router = Router();

const repository = new ProductCellTechnologyRepository();
const service = new ProductCellTechnologyService(repository);
const controller = new ProductCellTechnologyController(service);

router.use(authenticate);

// Permissions will be applied at a higher level or later if required.

router.get("/all", controller.findAll);
router.post("/list", validateProductCellTechnologyRequest(paginationSchema), controller.list);
router.get("/:uid", controller.getDetails);
router.post("/", validateProductCellTechnologyRequest(createProductCellTechnologySchema), controller.create);
router.put("/:uid", validateProductCellTechnologyRequest(updateProductCellTechnologySchema), controller.update);
router.delete("/:uid", controller.delete);

export default router;
