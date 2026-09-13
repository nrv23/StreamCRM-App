import { ITokenManager, TokenPayload } from "../../interfaces/token/token-payload.interface.ts";
import jwt from 'jsonwebtoken';
import { env } from "../../config/enviroment.ts";
import { ErrorFactory } from "../factory/error-factory.ts";
import { ApiErrorCode } from "../../enum/ErrorCodes.enum.ts";

export class TokenManager implements ITokenManager {
    sign(payload: TokenPayload): Promise<string> {
        return new Promise((resolve, _) => {
            jwt.sign(payload, env.jwt_secret, {
                expiresIn: env.access_token_ttl
            }, (err, token) => {
                if (err) throw ErrorFactory.build(ApiErrorCode.INTERNAL_SERVER_ERROR, err.message);

                return resolve(token!.toString())
            })
        })
    }
    verify(token: string): Promise<TokenPayload> {
        return new Promise((resolve, _) => {
            jwt.verify(token, env.jwt_secret, (err, decoded) => {
                if (err) throw ErrorFactory.build(ApiErrorCode.INTERNAL_SERVER_ERROR, err.message);
                return resolve(decoded as TokenPayload);
            })
        })
    }

}