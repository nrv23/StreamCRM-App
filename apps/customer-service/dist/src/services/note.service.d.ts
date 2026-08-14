import { UnitOfWork } from "../config/unitOfWork.js";
import { CreateNoteDto } from "../dto/note/create-not.dto.js";
import { GetNoteDtoResponse } from "../dto/note/get-note-response.dto.js";
import { GetNoteDto } from "../dto/note/get-note.dto.js";
import { Note } from "../entity/Note.entity.js";
import { IPaginationResponse } from "../interfaces/pagination.interface.js";
import { Logger } from "winston";
export declare class NoteService {
    private _unitOfWork;
    private _logger;
    constructor(unitOfWork: UnitOfWork, logger: Logger);
    save(dto: CreateNoteDto): Promise<Note>;
    search(options: GetNoteDto): Promise<IPaginationResponse<GetNoteDtoResponse[]>>;
}
//# sourceMappingURL=note.service.d.ts.map