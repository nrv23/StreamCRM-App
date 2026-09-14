import { CreateRefreshTokenDto } from "../../dto/session/create-refresh-token.dto.ts";
import { RefreshToken } from "../../entity/RefreshToken.entity.ts";
import { GetCurrentRefreshToken } from "../../repository/session/refresh-token.repository.ts";

export interface IRefreshTokenRepository {

    save(dto: CreateRefreshTokenDto): Promise<RefreshToken>;
    getCurrentRefreshToken(refreshToken: string): Promise<GetCurrentRefreshToken | null>
}