export type ApiResponse<T> = {
    success: boolean;
    data?: {
        message?: string;
        details: T
    };
    error?: {
        code: string;
        message: any;
    };
};