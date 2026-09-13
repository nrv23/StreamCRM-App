import { CreateSessionDto } from "../../dto/session/create-session.dto.ts";



export interface ISessionRepository {

    save(dto: CreateSessionDto): Promise<void>
}