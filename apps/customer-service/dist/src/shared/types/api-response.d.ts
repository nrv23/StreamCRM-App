export type ApiResponse<T> = {
    success: boolean;
    response?: {
        message?: string;
        details?: T;
    };
    error?: {
        code: string;
        message: any;
    };
};
//# sourceMappingURL=api-response.d.ts.map