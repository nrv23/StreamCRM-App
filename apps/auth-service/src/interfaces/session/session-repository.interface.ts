import { CreateSessionDto } from "../../dto/session/create-session.dto.ts";
import { Session } from "../../entity/Session.entity.ts";
import { GetSessionIdByUserIdResponse } from "../../repository/session/session.repository.ts";



export interface ISessionRepository {

    save(dto: CreateSessionDto): Promise<Session>;
    getCurrentSessionIdByUserId(session_id: string): Promise<GetSessionIdByUserIdResponse | null>;
    isUserHasActiveSessionByUserIdAndIpAddress(user_id: number, ip_address: string): Promise<boolean>;
    revoke(session_id: string): Promise<void>;
}