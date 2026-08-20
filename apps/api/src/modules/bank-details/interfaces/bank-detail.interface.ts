export interface IBankDetail {
    id: string;
    uid: string;
    tenantUid: string;
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    branchName: string;
    swiftCode: string | null;
    upiId: string | null;
    isDefault: number;
    isActive: number;
    isDeleted: number;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string | null;
    updatedBy: string | null;
    deletedBy: string | null;
}

export interface ICreateBankDetail {
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    branchName: string;
    swiftCode?: string;
    upiId?: string;
}

export interface IUpdateBankDetail extends Partial<ICreateBankDetail> {}

export interface IBankDetailSafe {
    uid: string;
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    branchName: string;
    swiftCode: string | null;
    upiId: string | null;
    isDefault: number;
    isActive: number;
    isDeleted: number;
    createdAt: Date;
}
