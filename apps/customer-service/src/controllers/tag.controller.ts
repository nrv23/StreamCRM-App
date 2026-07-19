import { Request, Response } from 'express';
import { TagService } from "../services/tag.service.js";
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
        const { id } = req.user;
        const { name } = req.body;
        const { ip_address, user_agent } = req.requestDataInfo;
        const newTag = {
            customerId: +customerId!,
            name,
            user_id: id,
            ip_address,
            user_agent
        };

        const data = await this._tagService.save(newTag);
        const response: ApiResponse<Tag> = {
            response: {
                message: "Tag created",
                details: data
            },
            success: true,
        }
        res.status(201).json(response);
    }
}