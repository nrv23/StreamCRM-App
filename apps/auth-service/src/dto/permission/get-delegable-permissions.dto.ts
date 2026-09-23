

export interface GetDelegablePermissionsDto {
    permissions: {
        code: string;
    }[],
    delegable?: boolean
}