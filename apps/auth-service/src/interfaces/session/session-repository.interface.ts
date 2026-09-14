import { CreateSessionDto } from "../../dto/session/create-session.dto.ts";
import { Session } from "../../entity/Session.entity.ts";



export interface ISessionRepository {

    save(dto: CreateSessionDto): Promise<Session>
}