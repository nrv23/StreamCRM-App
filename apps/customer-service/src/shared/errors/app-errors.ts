// shared/errors/app-error.ts
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: string; // <-- Agregamos el código de error para la API

    constructor(message: string, statusCode: number, code: string) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

// Tus errores específicos ahora llevan el código interno que pide tu tipo
export class ConflictError extends AppError {
    constructor(message: string, code = 'CONFLICT_ERROR') {
        super(message, 409, code);
    }
}

export class NotFoundError extends AppError {
    constructor(message = 'Resource not found', code = 'NOT_FOUND') {
        super(message, 404, code);
    }
}