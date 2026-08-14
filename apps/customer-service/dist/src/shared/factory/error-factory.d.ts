import { ApiErrorCode } from '../../enum/ErrorCodes.enum.js';
import { AppError } from '../errors/app-errors.js';
export declare class ErrorFactory {
    /**
     * Retorna una instancia configurada de AppError según el código del enum
     */
    static build(enumErrorCode: ApiErrorCode, customMessage?: string): AppError;
}
//# sourceMappingURL=error-factory.d.ts.map