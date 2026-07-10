import { Request, Response } from 'express';
import { TagService } from "../services/tag,service.js";
import { CreateTagDto } from "../dto/tag/create-tag.dto.js";
import { Tag } from "../entity/Tag.entity.js";
import { ApiResponse } from "../shared/types/api-response.js";



export class TagController {


    private _tagService: TagService

    constructor(tagService: TagService) {
        this._tagService = tagService;
    }

    async save(req: Request, res: Response) {

        const { customerId } = req.params;
        const { name } = req.body;

        const newTag = {
            customerId: +customerId!,
            name
        };

        const data = await this._tagService.save(newTag as CreateTagDto);

        const response: ApiResponse<Tag> = {
            response: {
                message: "Tag created",
                details: data
            },
            success: true,
        }
        res.status(200).json(response);
    }
}