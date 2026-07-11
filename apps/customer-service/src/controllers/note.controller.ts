import { NoteService } from "../services/note.service.js";
import { Request, response, Response } from 'express';
import { ApiResponse } from './../shared/types/api-response.js'
import { Note } from "../entity/note.entity.js";

export class NoteController {


    private _noteService: NoteService;

    constructor(noteService: NoteService) {
        this._noteService = noteService;
    }


    async save(req: Request, res: Response) {

        const { customer_id } = req.params;
        const { note } = req.body;
        const { user: { id } } = req;

        const noteDto = {
            customer_id: +customer_id!,
            note,
            user_id: id
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
}