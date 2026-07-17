export interface State {
    id: number;
    uid: string;
    code: number;
    name: string;
    created_at: Date;
    updated_at: Date;
}

export interface District {
    id: number;
    uid: string;
    code: number;
    state_id: number;
    name: string;
    created_at: Date;
    updated_at: Date;
}


export interface City {
    id: number;
    uid: string;
    code: number;
    state_id: number;
    name: string;
    local_body_type: string | null;
    pincode: number | null;
    created_at: Date;
    updated_at: Date;
}
