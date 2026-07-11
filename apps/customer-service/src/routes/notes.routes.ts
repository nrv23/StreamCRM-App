import { Router } from "express";
import { IRoutes } from "../interfaces/routes.interface.js";
import { UnitOfWork } from "../config/unitOfWork.js";
import { NoteController } from "../controllers/note.controller.js";
import { NoteService } from "../services/note.service.js";
import { createNoteValidator } from "../validators/notes/create-note.validator.js";
import { validateRequest } from "../shared/middleware/validate-errors.middleware.js";
import { fakeAuth } from "../shared/middleware/fake-user.middleware.js";


export class NotesRoutes implements IRoutes {

    private _unitOfWork: UnitOfWork;
    private _noteController: NoteController;
    private _noteService: NoteService;
    private _router: Router;

    constructor() {

        this._unitOfWork = new UnitOfWork();
        this._noteService = new NoteService(this._unitOfWork);
        this._noteController = new NoteController(this._noteService);
        this._router = Router();
    }

    BuildRoutes(): Router {

        this._router.post('/:customer_id', createNoteValidator, validateRequest, fakeAuth, this._noteController.save.bind(this._noteController));
        return this._router;
    }


}