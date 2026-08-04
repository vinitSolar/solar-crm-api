import { PackageRepository } from "../repositories/package.repository.js";
import type { CreatePackageDTO, UpdatePackageDTO, PackageResponseDTO } from "../dto/package.dto.js";
import { CustomError } from "../../../middlewares/error.middleware.js";
import { PACKAGE_MESSAGES } from "../constants/messages.js";
import { logger } from "@packages/logger/index.js";
import { QuotationScopeOfWorkRepository } from "../../quotation-scope-of-work/repositories/quotation-scope-of-work.repository.js";

export class PackageService {
    private readonly repository: PackageRepository;
    private readonly scopeOfWorkRepo: QuotationScopeOfWorkRepository;

    constructor(repository: PackageRepository, scopeOfWorkRepo: QuotationScopeOfWorkRepository) {
        this.repository = repository;
        this.scopeOfWorkRepo = scopeOfWorkRepo;
    }

    async createPackage(tenantUid: string, userUid: string, data: CreatePackageDTO): Promise<PackageResponseDTO> {
        if (!data.packageCode) {
            const count = await this.repository.countPackages(tenantUid);
            data.packageCode = `PKG-${(count + 1).toString().padStart(3, "0")}`;
        }

        logger.info("PackageService.createPackage", { tenantUid, name: data.name, code: data.packageCode });

        const [nameExists, codeExists] = await Promise.all([
            this.repository.checkNameExists(tenantUid, data.name),
            this.repository.checkCodeExists(tenantUid, data.packageCode)
        ]);

        if (nameExists) throw new CustomError(PACKAGE_MESSAGES.ERROR_ALREADY_EXISTS_NAME, 400);
        if (codeExists) throw new CustomError(PACKAGE_MESSAGES.ERROR_ALREADY_EXISTS_CODE, 400);

        // Validate products
        if (!data.products || data.products.length === 0) {
            throw new CustomError(PACKAGE_MESSAGES.ERROR_EMPTY_PRODUCTS, 400);
        }

        const productUids = data.products.map(p => p.productUid);
        const uniqueUids = new Set(productUids);
        if (uniqueUids.size !== productUids.length) {
            throw new CustomError(PACKAGE_MESSAGES.ERROR_INVALID_PRODUCTS, 400);
        }

        const productsDb = await this.repository.findProductsDetails(Array.from(uniqueUids));
        
        if (productsDb.length !== uniqueUids.size) {
            throw new CustomError(PACKAGE_MESSAGES.ERROR_INVALID_PRODUCTS, 400);
        }

        const productsMap = new Map(productsDb.map(p => [p.uid, p]));
        const mappedProducts = data.products.map(p => {
            const dbProd = productsMap.get(p.productUid);
            if (!dbProd || !dbProd.is_active || dbProd.is_deleted) {
                throw new CustomError(PACKAGE_MESSAGES.ERROR_INVALID_PRODUCTS, 400);
            }
            return {
                ...p,
                remarks: p.remarks ?? null,
                unitPriceSnapshot: dbProd.price_per_unit
            };
        });

        let mappedScopeOfWork;
        if (data.scopeOfWork && data.scopeOfWork.length > 0) {
            const sowUids = data.scopeOfWork.map(s => s.scopeOfWorkUid);
            const uniqueSowUids = new Set(sowUids);
            
            if (uniqueSowUids.size !== sowUids.length) {
                throw new CustomError("Duplicate Scope of Work items", 400);
            }

            const dbSows = await this.scopeOfWorkRepo.findByUids(tenantUid, Array.from(uniqueSowUids));
            if (dbSows.length !== uniqueSowUids.size) {
                throw new CustomError("Invalid Scope of Work items provided", 400);
            }

            const sowsMap = new Map(dbSows.map(s => [s.uid, s]));
            mappedScopeOfWork = data.scopeOfWork.map((s, index) => {
                const dbSow = sowsMap.get(s.scopeOfWorkUid)!;
                return {
                    scopeOfWorkUid: s.scopeOfWorkUid,
                    title: dbSow.title,
                    value: dbSow.value,
                    sortOrder: s.sortOrder ?? dbSow.sortOrder ?? (index + 1)
                };
            });
        }

        const createdPackage = await this.repository.createPackage(tenantUid, userUid, data, mappedProducts, mappedScopeOfWork);
        return createdPackage;
    }

    async updatePackage(uid: string, tenantUid: string, userUid: string, data: UpdatePackageDTO): Promise<void> {
        logger.info("PackageService.updatePackage", { uid, tenantUid });

        const existingPackage = await this.repository.findByUid(uid, tenantUid);
        if (!existingPackage || existingPackage.isDeleted) {
            throw new CustomError(PACKAGE_MESSAGES.ERROR_NOT_FOUND, 404);
        }

        if (data.name) {
            const nameExists = await this.repository.checkNameExists(tenantUid, data.name, uid);
            if (nameExists) throw new CustomError(PACKAGE_MESSAGES.ERROR_ALREADY_EXISTS_NAME, 400);
        }

        if (data.packageCode) {
            const codeExists = await this.repository.checkCodeExists(tenantUid, data.packageCode, uid);
            if (codeExists) throw new CustomError(PACKAGE_MESSAGES.ERROR_ALREADY_EXISTS_CODE, 400);
        }

        let mappedProducts;
        if (data.products && data.products.length > 0) {
            const productUids = data.products.map(p => p.productUid);
            const uniqueUids = new Set(productUids);
            if (uniqueUids.size !== productUids.length) {
                throw new CustomError(PACKAGE_MESSAGES.ERROR_INVALID_PRODUCTS, 400);
            }

            const productsDb = await this.repository.findProductsDetails(Array.from(uniqueUids));
            if (productsDb.length !== uniqueUids.size) {
                throw new CustomError(PACKAGE_MESSAGES.ERROR_INVALID_PRODUCTS, 400);
            }

            const productsMap = new Map(productsDb.map(p => [p.uid, p]));
            mappedProducts = data.products.map(p => {
                const dbProd = productsMap.get(p.productUid);
                if (!dbProd || !dbProd.is_active || dbProd.is_deleted) {
                    throw new CustomError(PACKAGE_MESSAGES.ERROR_INVALID_PRODUCTS, 400);
                }
                return {
                    ...p,
                    remarks: p.remarks ?? null,
                    unitPriceSnapshot: dbProd.price_per_unit
                };
            });
        }

        let mappedScopeOfWork;
        if (data.scopeOfWork && data.scopeOfWork.length > 0) {
            const sowUids = data.scopeOfWork.map(s => s.scopeOfWorkUid);
            const uniqueSowUids = new Set(sowUids);
            
            if (uniqueSowUids.size !== sowUids.length) {
                throw new CustomError("Duplicate Scope of Work items", 400);
            }

            const dbSows = await this.scopeOfWorkRepo.findByUids(tenantUid, Array.from(uniqueSowUids));
            if (dbSows.length !== uniqueSowUids.size) {
                throw new CustomError("Invalid Scope of Work items provided", 400);
            }

            const sowsMap = new Map(dbSows.map(s => [s.uid, s]));
            mappedScopeOfWork = data.scopeOfWork.map((s, index) => {
                const dbSow = sowsMap.get(s.scopeOfWorkUid)!;
                return {
                    scopeOfWorkUid: s.scopeOfWorkUid,
                    title: dbSow.title,
                    value: dbSow.value,
                    sortOrder: s.sortOrder ?? dbSow.sortOrder ?? (index + 1)
                };
            });
        }

        await this.repository.updatePackage(uid, tenantUid, userUid, data, mappedProducts, mappedScopeOfWork);
    }

    async getPackageByUid(uid: string, tenantUid: string): Promise<PackageResponseDTO> {
        const pkg = await this.repository.findByUid(uid, tenantUid);
        if (!pkg || pkg.isDeleted) {
            throw new CustomError(PACKAGE_MESSAGES.ERROR_NOT_FOUND, 404);
        }
        return pkg;
    }

    async listPackages(tenantUid: string, params: { limit: number; page: number; search?: string; status?: "active" | "deleted" | "all"; capacityKw?: number }): Promise<any> {
        return await this.repository.list(tenantUid, params);
    }

    async getDropdownPackages(tenantUid: string, status?: "active" | "deleted" | "all"): Promise<any[]> {
        return await this.repository.getDropdown(tenantUid, status);
    }

    async deletePackage(uid: string, tenantUid: string, userUid: string): Promise<void> {
        const pkg = await this.repository.findByUid(uid, tenantUid);
        if (!pkg || pkg.isDeleted) {
            throw new CustomError(PACKAGE_MESSAGES.ERROR_NOT_FOUND, 404);
        }
        await this.repository.softDelete(uid, tenantUid, userUid);
    }

    async restorePackage(uid: string, tenantUid: string, userUid: string): Promise<void> {
        const pkg = await this.repository.findByUid(uid, tenantUid);
        if (!pkg) {
            throw new CustomError(PACKAGE_MESSAGES.ERROR_NOT_FOUND, 404);
        }
        await this.repository.restore(uid, tenantUid, userUid);
    }
}
