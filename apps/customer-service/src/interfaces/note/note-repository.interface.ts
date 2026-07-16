import { CreateNoteDto } from "../../dto/note/create-not.dto.js";
import { GetNoteDtoResponse } from "../../dto/note/get-note-response.dto.js";
import { GetNoteDto } from "../../dto/note/get-note.dto.js";
import { Note } from "../../entity/Note.entity.js";


export interface INoteRepository {

    save(note: CreateNoteDto): Promise<Note>;
    searchByFilters(options: GetNoteDto): Promise<GetNoteDtoResponse[]>;
    getTotalRecords(options: GetNoteDto): Promise<number>;

}