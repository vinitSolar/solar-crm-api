export const AUDIT_LOG_MESSAGES = {
    FETCH_SUCCESS: 'Audit logs fetched successfully',
    NOT_FOUND: 'Audit log not found',
    ERROR_FETCHING: 'Error fetching audit logs',
};

export const AUDIT_LOG_ACTIONS = {
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    RESTORE: 'RESTORE',
    STATUS_CHANGE: 'STATUS_CHANGE',
    UPLOAD: 'UPLOAD',
    DOWNLOAD: 'DOWNLOAD',
    ASSIGN: 'ASSIGN',
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',
    APPROVE: 'APPROVE',
    REJECT: 'REJECT'
} as const;
