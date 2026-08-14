import { CreateNoteDto } from "../../dto/note/create-not.dto.js";
import { GetNoteDtoResponse } from "../../dto/note/get-note-response.dto.js";
import { GetNoteDto } from "../../dto/note/get-note.dto.js";
import { Note } from "../../entity/Note.entity.js";
import { IDatabase } from "../../interfaces/database.interface.js";
import { INoteRepository } from "../../interfaces/note/note-repository.interface.js";
export declare class NoteRepository implements INoteRepository {
    private _db;
    constructor(db?: IDatabase);
    save(note: CreateNoteDto): Promise<Note>;
    searchByFilters(options: GetNoteDto): Promise<GetNoteDtoResponse[]>;
    getTotalRecords(options: GetNoteDto): Promise<number>;
}
//# sourceMappingURL=note.repository.d.ts.map