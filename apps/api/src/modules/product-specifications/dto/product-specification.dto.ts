import type { IProductSpecification, IProductSpecificationOption } from "../interfaces/product-specification.interface.js";

export interface IProductSpecificationOptionSafe {
    uid: string;
    value: string;
    sortOrder: number;
    isActive: boolean;
}

export interface IProductSpecificationSafe {
    uid: string;
    title: string;
    valueType: number;
    unitUid: string | null;
    unitName?: string | null;
    unitShortName?: string | null;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    options: IProductSpecificationOptionSafe[];
    
    // Joined fields when queried with categoryUid
    mappingUid?: string | undefined;
    sortOrder?: number | undefined;
    isRequired?: boolean | undefined;
}

export const toProductSpecificationOptionSafe = (option: IProductSpecificationOption): IProductSpecificationOptionSafe => {
    return {
        uid: option.uid,
        value: option.value,
        sortOrder: option.sortOrder,
        isActive: option.isActive === 1,
    };
};

export const toProductSpecificationSafe = (spec: IProductSpecification, options: IProductSpecificationOption[] = []): IProductSpecificationSafe => {
    // Determine options: prefer embedded spec.options if present, otherwise fallback to provided options array.
    const finalOptions = spec.options && spec.options.length > 0 ? spec.options : options;
    
    return {
        uid: spec.uid,
        title: spec.title,
        valueType: spec.valueType,
        unitUid: spec.unitUid,
        unitName: spec.unitName || null,
        unitShortName: spec.unitShortName || null,
        isActive: spec.isActive === 1,
        isDeleted: spec.isDeleted === 1,
        createdAt: spec.createdAt,
        updatedAt: spec.updatedAt,
        options: finalOptions.map(toProductSpecificationOptionSafe),
        
        mappingUid: spec.mappingUid,
        sortOrder: spec.sortOrder,
        isRequired: spec.isRequired !== undefined ? spec.isRequired === 1 : undefined,
    };
};
