import { NoteService } from "../services/note.service.js";
import { Request, Response } from 'express';
export declare class NoteController {
    private _noteService;
    constructor(noteService: NoteService);
    save(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    search(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=note.controller.d.ts.map