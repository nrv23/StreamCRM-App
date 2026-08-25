


export interface IUserRepository {
    save(): Promise<void>;
    update(): Promise<void>;
    find(): Promise<void>;
    delete(): Promise<void>;
}