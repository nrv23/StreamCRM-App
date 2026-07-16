import { databaseInstance } from "../../config/query.js";
import { CreateNoteDto } from "../../dto/note/create-not.dto.js";
import { GetNoteDtoResponse } from "../../dto/note/get-note-response.dto.js";
import { GetNoteDto } from "../../dto/note/get-note.dto.js";
import { Note } from "../../entity/Note.entity.js";
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
            note.customer_id, note.user_id, note.note
        ]);

        return newNote!
    }

    async searchByFilters(options: GetNoteDto): Promise<GetNoteDtoResponse[]> {
        const page = options.page!;
        const limit = options.limit!;
        const offset = (page - 1) * limit;

        const params: Array<string | number> = [];
        params.push(options.user_id);
        let query = `
            select 
                c.id as customerId,
                concat(c.first_name ,' ', c.last_name) as customerName,
                c.email customerEmail,
                c.external_id as customerExternalId,
                cn.note,
                 to_char(cn.created_at ,'YYYY-MM-DD') createdAt
            from customer_notes cn
            inner join customers c on c.id = cn.customer_id 
            where cn.user_id = $${params.length}
        `;


        if (options.customer_id) {
            params.push(options.customer_id);
            query += ` and cn.customer_id = $${params.length}`;

        }

        params.push(limit, offset);
        query += ` order by cn.created_at ${options.sortOrder ? options.sortOrder.toUpperCase() : 'ASC'} limit $${params.length - 1} offset $${params.length};`;



        const notes = await this._db.query<GetNoteDtoResponse>(query, params);
        return notes;
    }

    // count de registros

    async getTotalRecords(options: GetNoteDto): Promise<number> {

        const params: Array<string | number> = [];
        let query = `
            select 
               count(*) as "totalRecords"
            from customer_notes cn
            inner join customers c on c.id = cn.customer_id 
            where cn.user_id = $1
        `;
        params.push(options.user_id);

        if (options.customer_id) {
            params.push(options.customer_id);
            query += ` and cn.customer_id = $${params.length}`;

        }

        const response = await this._db.query<{
            totalRecords: number
        }>(query, params);

        return Number(response[0]?.totalRecords || 0);
    }

}