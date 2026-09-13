
export interface TokenPayload {

    sub: string;
    uid: number;
    sid: string;
}


export interface ITokenManager {

    sign(payload: TokenPayload): Promise<string>;
    verify(token: string): Promise<TokenPayload>;
}