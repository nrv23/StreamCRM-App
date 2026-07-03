

export interface IPaginationResponse<T> {

    data: T,
    paginationData: {
        page: number,
        totalPages: number,
        previousPage: number,
        nextPage: number
    }
}