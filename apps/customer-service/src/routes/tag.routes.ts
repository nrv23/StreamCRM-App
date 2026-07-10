import { Router } from "express";
import { TagController } from "../controllers/tag.controller.js";
import { TagService } from "../services/tag,service.js";
import { UnitOfWork } from "../config/unitOfWork.js";
import { TagRepository } from "../repository/tag/tag.repository.js";
import { createTagValidator } from "../validators/tag/create-tag.validator.js";
import { validateRequest } from "../shared/middleware/validate-errors.middleware.js";
import { IRoutes } from "../interfaces/routes.interface.js";



export class TagRoutes implements IRoutes {

    private _router: Router;
    private _controller: TagController;
    private _tagService: TagService;
    //private _tagRepository: TagRepository;
    private _unitOfWork: UnitOfWork;

    constructor() {

        //this._tagRepository = new TagRepository();
        this._unitOfWork = new UnitOfWork();
        this._tagService = new TagService(
            this._unitOfWork
        );
        this._router = Router();
        this._controller = new TagController(this._tagService)
    }

    BuildRoutes(): Router {

        this._router.post('/:customerId/', createTagValidator, validateRequest, this._controller.save.bind(this._controller));

        return this._router;
    }
}