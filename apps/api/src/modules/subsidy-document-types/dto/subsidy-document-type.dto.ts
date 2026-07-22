export interface ISubsidyDocumentTypeListRequest {
    page: number;
    limit: number;
    search?: string;
    status?: "active" | "deleted" | "all";
}
