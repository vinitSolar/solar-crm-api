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

export interface Subdistrict {
    id: number;
    uid: string;
    code: number;
    state_id: number;
    district_id: number;
    name: string;
    created_at: Date;
    updated_at: Date;
}

export interface Village {
    id: number;
    uid: string;
    code: number;
    state_id: number;
    district_id: number;
    subdistrict_id: number;
    name: string;
    pincode: number | null;
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
