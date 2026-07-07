export { leadRoutes } from "./routes/lead.routes.js";
export { leadSourceRoutes } from "./routes/lead-source.routes.js";
export { leadStatusRoutes } from "./routes/lead-status.routes.js";

export type {
    ILead,
    ILeadSource,
    ILeadStatus,
    ICreateLead,
    IUpdateLead,
    ICreateLeadSource,
    IUpdateLeadSource,
    ICreateLeadStatus,
    IUpdateLeadStatus,
    ILeadSafe,
    ILeadSourceSafe,
    ILeadStatusSafe,
} from "./interfaces/lead.interface.js";

export { 
    toLeadSafe, 
    toLeadSourceSafe, 
    toLeadStatusSafe 
} from "./dto/lead.dto.js";

export {
    LEAD_MESSAGES,
    LEAD_SOURCE_MESSAGES,
    LEAD_STATUS_MESSAGES,
} from "./constants/lead.constants.js";

export { LeadRepository } from "./repositories/lead.repository.js";
export { LeadSourceRepository } from "./repositories/lead-source.repository.js";
export { LeadStatusRepository } from "./repositories/lead-status.repository.js";
