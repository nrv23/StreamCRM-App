import { Router } from "express";
import { TagController } from "../controllers/tag.controller.js";
import { TagService } from "../services/tag.service.js";
import { UnitOfWork } from "../config/unitOfWork.js";
import { createTagValidator } from "../validators/tag/create-tag.validator.js";
import { validateRequest } from "../shared/middleware/validate-errors.middleware.js";
import { fakeAuth } from "../shared/middleware/fake-user.middleware.js";
import { WinstonLogger } from "../shared/utils/winstonLogger.js";
import { env } from "../config/enviroment.js";
export class TagRoutes {
    _router;
    _controller;
    _tagService;
    //private _tagRepository: TagRepository;
    _unitOfWork;
    constructor() {
        //this._tagRepository = new TagRepository();
        this._unitOfWork = new UnitOfWork();
        this._tagService = new TagService(this._unitOfWork, WinstonLogger.getInstance(env.elastic_search_url, 'tag-module', 'debug', env.index_elastic_search_name));
        this._router = Router();
        this._controller = new TagController(this._tagService);
    }
    BuildRoutes() {
        this._router.post('/:customerId/', createTagValidator, validateRequest, fakeAuth, this._controller.save.bind(this._controller));
        return this._router;
    }
}
//# sourceMappingURL=tag.routes.js.map