import { createBankDetailRouter } from "./routes/bank-detail.routes.js";
export { BankDetailService } from "./services/bank-detail.service.js";
export { BankDetailRepository } from "./repositories/bank-detail.repository.js";

export const bankDetailRoutes = createBankDetailRouter();
