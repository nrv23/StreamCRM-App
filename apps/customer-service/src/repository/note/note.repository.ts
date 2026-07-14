import { databaseInstance } from "../../config/query.js";
import { CreateNoteDto } from "../../dto/note/create-not.dto.js";
import { GetNoteDtoResponse } from "../../dto/note/get-note-response.dto.js";
import { GetNoteDto } from "../../dto/note/get-note.dto.js";
import { Note } from "../../entity/note.entity.js";
import { IDatabase } from "../../interfaces/database.interface.js";
import { INoteRepository } from "../../interfaces/note/note-repository.interface.js";
import { IPaginationResponse } from "../../interfaces/pagination.interface.js";



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

        const params: any[] = [];
        let query = `
            select 
                c.id as customerId,
                concat(c.first_name ,' ', c.last_name) as customerName,
                c.email customerEmail,
                c.external_id as customerExternalId,
                cn.note,
                cn.created_at createdAt
            from customer_notes cn
            inner join customers c on c.id = cn.customer_id 
            where c.user_id = $1
        `;
        params.push(options.user_id);

        if (options.customer_id) {
            query += ' and cn.customer_id = $2';
            params.push(options.customer_id);
        }

        if (options.created_at) {
            query += " and TO_CHAR($3, 'YYYY-MM-DD')";
            params.push(options.created_at);
        }

        const sortOrder = options.orderBy?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'; // 3

        query += ` order by createdAt $4 limit $5 offset $6;`;

        params.push(sortOrder, limit, offset);

        const notes = await this._db.query<GetNoteDtoResponse>(query, params);
        return notes;
    }

    // count de registros

    async getTotalRecords(options: GetNoteDto): Promise<number> {

        const params: any[] = [];
        let query = `
            select 
               count(*) as "totalRecords"
            from customer_notes cn
            inner join customers c on c.id = cn.customer_id 
            where c.user_id = $1
        `;
        params.push(options.user_id);

        if (options.customer_id) {
            query += ' and cn.customer_id = $2';
            params.push(options.customer_id);
        }

        if (options.created_at) {
            query += " and TO_CHAR($3, 'YYYY-MM-DD')";
            params.push(options.created_at);
        }

        const response = await this._db.query<{
            totalRecords: number
        }>(query, params);

        return Number(response[0]?.totalRecords || 0);
    }

}