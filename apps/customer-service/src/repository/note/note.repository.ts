import { databaseInstance } from "../../config/query.js";
import { CreateNoteDto } from "../../dto/note/create-not.dto.js";
import { GetNoteDto } from "../../dto/note/get-note.dto.js";
import { Note } from "../../entity/note.entity.js";
import { IDatabase } from "../../interfaces/database.interface.js";
import { INoteRepository } from "../../interfaces/note/note-repository.interface.js";



export class NoteRepository implements INoteRepository {

    private _db: IDatabase;
    constructor(db?: IDatabase) {
        this._db = db ?? databaseInstance;
    }

    async save(note: CreateNoteDto): Promise<Note> {

        const [newNote] = await this._db.query<Note>(
            'Insert into customer_notes(customer_id,user_id,note) values($1,$2,$3) returning *', [
            note.customer_id, note.user_id, note.user_id
        ]);

        return newNote!
    }
    get(options: GetNoteDto): Promise<Note[]> {
        throw new Error("Method not implemented.");
    }

}