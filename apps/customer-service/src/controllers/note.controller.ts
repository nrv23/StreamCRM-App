import { NoteService } from "../services/note.service.js";
import { Request, response, Response } from 'express';
import { matchedData } from 'express-validator';
import { ApiResponse } from './../shared/types/api-response.js'
import { Note } from "../entity/Note.entity.js";
import { GetNoteDto } from "../dto/note/get-note.dto.js";
import { IPaginationResponse } from "../interfaces/pagination.interface.js";
import { GetNoteDtoResponse } from "../dto/note/get-note-response.dto.js";

export class NoteController {


    private _noteService: NoteService;

    constructor(noteService: NoteService) {
        this._noteService = noteService;
    }


    async save(req: Request, res: Response) {

        const { customer_id } = req.params;
        const { note } = req.body;
        const { user: { id } } = req;
        const { ip_address, user_agent } = req.requestDataInfo;

        const noteDto = {
            customer_id: +customer_id!,
            note,
            user_id: id,
            ip_address,
            user_agent
        }

        const data = await this._noteService.save(noteDto);

        const response: ApiResponse<Note> = {

            success: true,
            response: {
                message: 'Note created',
                details: data
            }
        }

        return res.status(201).json(response);
    }

    async search(req: Request, res: Response) {

        const { id } = req.user;
        // matchedData extrae SOLO los datos validados y ya convertidos (por ej: .toInt())
        const queryOptions = matchedData(req, { locations: ['query'] }) as unknown as GetNoteDto;
        const options: GetNoteDto = {
            ...queryOptions,
            user_id: id,
        }

        const data = await this._noteService.search(options);
        const response: ApiResponse<IPaginationResponse<GetNoteDtoResponse[]>> = {

            success: true,
            response: {
                message: '',
                details: data
            }
        }

        return res.status(200).json(response);
    }
}