import { matchedData } from 'express-validator';
export class NoteController {
    _noteService;
    constructor(noteService) {
        this._noteService = noteService;
    }
    async save(req, res) {
        const { customer_id } = req.params;
        const { note } = req.body;
        const { user: { id } } = req;
        const { ip_address, user_agent } = req.requestDataInfo;
        const noteDto = {
            customer_id: +customer_id,
            note,
            user_id: id,
            ip_address,
            user_agent
        };
        const data = await this._noteService.save(noteDto);
        const response = {
            success: true,
            response: {
                message: 'Note created',
                details: data
            }
        };
        return res.status(201).json(response);
    }
    async search(req, res) {
        const { id } = req.user;
        // matchedData extrae SOLO los datos validados y ya convertidos (por ej: .toInt())
        const queryOptions = matchedData(req, { locations: ['query'] });
        const options = {
            ...queryOptions,
            user_id: id,
        };
        const data = await this._noteService.search(options);
        const response = {
            success: true,
            response: {
                message: '',
                details: data
            }
        };
        return res.status(200).json(response);
    }
}
//# sourceMappingURL=note.controller.js.map