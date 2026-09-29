import type { IBankDetail, IBankDetailSafe } from "../interfaces/bank-detail.interface.js";
import { storageService } from "@packages/storage/index.js";

export function toBankDetailSafe(detail: IBankDetail): IBankDetailSafe {
    return {
        uid: detail.uid,
        accountName: detail.accountName,
        accountNumber: detail.accountNumber,
        ifscCode: detail.ifscCode,
        bankName: detail.bankName,
        branchName: detail.branchName,
        swiftCode: detail.swiftCode,
        upiId: detail.upiId,
        qrCode: detail.qrCode ? storageService.getPublicUrl(detail.qrCode) : null,
        isDefault: detail.isDefault,
        isActive: detail.isActive,
        isDeleted: detail.isDeleted,
        createdAt: detail.createdAt,
    };
}
