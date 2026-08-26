

export interface IUserRoleRepository {

    save(userId: number, roleIds: number[]): Promise<void>;
}