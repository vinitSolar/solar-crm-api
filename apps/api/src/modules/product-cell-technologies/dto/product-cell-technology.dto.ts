import type { IProductCellTechnology } from "../interfaces/product-cell-technology.interface.js";

export class ProductCellTechnologyDto {
    uid: string;
    name: string;
    description: string | null;
    sortOrder: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;

    constructor(data: IProductCellTechnology) {
        this.uid = data.uid;
        this.name = data.name;
        this.description = data.description;
        this.sortOrder = data.sortOrder;
        this.isActive = data.isActive === 1;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }

    static fromEntity(data: IProductCellTechnology): ProductCellTechnologyDto {
        return new ProductCellTechnologyDto(data);
    }

    static fromEntities(data: IProductCellTechnology[]): ProductCellTechnologyDto[] {
        return data.map((item) => new ProductCellTechnologyDto(item));
    }
}
