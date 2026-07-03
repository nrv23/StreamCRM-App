export interface IPaginationOptions<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
}