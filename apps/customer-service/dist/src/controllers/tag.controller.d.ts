import { Request, Response } from 'express';
import { TagService } from "../services/tag.service.js";
export declare class TagController {
    private _tagService;
    constructor(tagService: TagService);
    save(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=tag.controller.d.ts.map