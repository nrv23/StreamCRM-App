import { Router } from "express";
import { IRoutes } from "../interfaces/routes.interface.js";
import { UnitOfWork } from "../config/unitOfWork.js";
import { NoteController } from "../controllers/note.controller.js";
import { NoteService } from "../services/note.service.js";


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

        return this.route;
    }


}