

export interface IPaginationResponse<T> {

    data: T;
    paginationData: {
        page: number;
        pageSize: number;
        totalPages: number;
        totalRecords: number;
        previousPage: number | null;
        nextPage: number | null;
    };
}