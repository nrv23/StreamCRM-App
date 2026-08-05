import { databaseInstance } from "../../config/query.js";
import { CreateNoteDto } from "../../dto/note/create-not.dto.js";
import { GetNoteDtoResponse } from "../../dto/note/get-note-response.dto.js";
import { GetNoteDto } from "../../dto/note/get-note.dto.js";
import { Note } from "../../entity/Note.entity.js";
import { ApiErrorCode } from "../../enum/ErrorCodes.enum.js";
import { IDatabase } from "../../interfaces/database.interface.js";
import { INoteRepository } from "../../interfaces/note/note-repository.interface.js";
import { ErrorFactory } from "../../shared/factory/error-factory.js";

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

        if (!newNote) throw ErrorFactory.build(
            ApiErrorCode.CONFLICT_ERROR,
            "Note was not inserted"
        );
        return newNote;
    }

    async searchByFilters(options: GetNoteDto): Promise<GetNoteDtoResponse[]> {
        const page = options.page ?? 1;
        const limit = options.limit ?? 20;
        const offset = (page - 1) * limit;

        const params: unknown[] = [options.user_id];

        let query = `
        SELECT 
            c.id AS "customerId",
            CONCAT(c.first_name, ' ', c.last_name) AS "customerName",
            c.email AS "customerEmail",
            c.external_id AS "customerExternalId",
            cn.note AS "note",
            TO_CHAR(cn.created_at, 'YYYY-MM-DD') AS "createdAt"
        FROM customer_notes cn
        INNER JOIN customers c ON c.id = cn.customer_id 
        WHERE cn.user_id = $${params.length}
    `;

        if (options.customer_id) {
            params.push(options.customer_id);
            query += ` AND cn.customer_id = $${params.length}`;
        }

        // Lista blanca estricta para el ordenamiento (evita SQL Injection)
        const sortOrder = options.sortOrder?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

        // Agregamos LIMIT y OFFSET ordenadamente al array de parámetros
        params.push(limit);
        const limitIndex = params.length;

        params.push(offset);
        const offsetIndex = params.length;

        query += `
        ORDER BY cn.created_at ${sortOrder}
        LIMIT $${limitIndex} OFFSET $${offsetIndex};
    `;

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