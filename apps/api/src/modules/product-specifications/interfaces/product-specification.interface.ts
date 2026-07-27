export interface IProductSpecification {
    id: string;
    uid: string;
    title: string;
    valueType: number; // 0=Text, 1=Number, 2=Decimal, 3=Dropdown, 4=Boolean, 5=Date
    unitUid: string | null;
    isActive: number;
    isDeleted: number;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string | null;
    updatedBy: string | null;
    deletedBy: string | null;
    
    // joined fields
    unitName?: string | null;
    unitShortName?: string | null;
    options?: IProductSpecificationOption[];
    
    // category mapping joined fields (when fetched in context of a category)
    mappingUid?: string;
    sortOrder?: number;
    isRequired?: number;
}

export interface IProductCategorySpecification {
    id: string;
    uid: string;
    categoryUid: string;
    specificationUid: string;
    sortOrder: number;
    isRequired: number;
    isActive: number;
    isDeleted: number;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string | null;
    updatedBy: string | null;
    deletedBy: string | null;
}

export interface IProductSpecificationOption {
    id: string;
    uid: string;
    specificationUid: string;
    value: string;
    sortOrder: number;
    isActive: number;
    isDeleted: number;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string | null;
    updatedBy: string | null;
    deletedBy: string | null;
}

export interface ICreateProductSpecificationOptionRequest {
    value: string;
    sortOrder?: number;
}

export interface ICreateProductSpecificationRequest {
    title: string;
    valueType: number;
    unitUid?: string | null;
    options?: ICreateProductSpecificationOptionRequest[];
    
    // Optional category mapping info if created from category context
    categoryUid?: string;
    sortOrder?: number;
    isRequired?: number;
}

export interface IUpdateProductSpecificationRequest {
    title?: string;
    valueType?: number;
    unitUid?: string | null;
    isActive?: number;
    options?: ICreateProductSpecificationOptionRequest[];
}

export interface IMapProductSpecificationToCategoryRequest {
    specificationUid: string;
    sortOrder?: number;
    isRequired?: number;
}

export interface IUpdateCategorySpecificationMappingRequest {
    sortOrder?: number;
    isRequired?: number;
    isActive?: number;
}

export interface IProductSpecificationPaginationQuery {
    page: number;
    limit: number;
    search?: string;
    categoryUid?: string;
    status?: "active" | "deleted" | "all";
}
