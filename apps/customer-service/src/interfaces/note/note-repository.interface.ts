import { CreateNoteDto } from "../../dto/note/create-not.dto.js";
import { GetNoteDto } from "../../dto/note/get-note.dto.js";
import { Note } from "../../entity/note.entity.js";


export interface INoteRepository {

    save(note: CreateNoteDto): Promise<Note>;
    get(options: GetNoteDto): Promise<Note[]>

}