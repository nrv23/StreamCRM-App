import { Request, Response, NextFunction } from 'express';
import { ErrorFactory } from '../factory/error-factory.ts';
import { ApiErrorCode } from '../../enum/ErrorCodes.enum.ts';
import { ITokenManager } from '../../interfaces/token/token-payload.interface.ts';
import { TokenManager } from '../utils/tokenManager.ts';

const tokenManager: ITokenManager = new TokenManager();

export async function validateToken(req: Request, res: Response, next: NextFunction) {

    const authHeader = req.headers.authorization;

    // 1. Validar que exista la cabecera
    if (!authHeader) {
        throw ErrorFactory.build(ApiErrorCode.UNAUTHORIZED, 'Missing token');
    }

    // 2. Separar el esquema ("Bearer") del token
    const parts = authHeader.trim().split(/\s+/);

    // 3. Validar el formato "Bearer <token>"
    if (
        parts.length !== 2 ||
        parts[0] !== 'Bearer' ||
        !parts[1]
    ) throw ErrorFactory.build(ApiErrorCode.UNAUTHORIZED, 'Invalid token');

    const token = parts[1];

    try {
        // 4. Verificar la firma y expiración del Access Token
        const decoded = await tokenManager.verify(token);

        // Adjuntar la información decodificada del usuario a la Request
        req.user = {
            id: decoded.uid, // usuario id
            sid: decoded.sid, // session id
            sub: decoded.sub, // external id
            roles: []
        };

        next();
    } catch (error) {
        throw ErrorFactory.build(ApiErrorCode.UNAUTHORIZED, 'Invalid or expired token');
    }

}

