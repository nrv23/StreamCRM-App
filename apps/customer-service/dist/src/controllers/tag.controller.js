export class TagController {
    _tagService;
    constructor(tagService) {
        this._tagService = tagService;
    }
    async save(req, res) {
        const { customerId } = req.params;
        const { id } = req.user;
        const { name } = req.body;
        const { ip_address, user_agent } = req.requestDataInfo;
        const newTag = {
            customerId: +customerId,
            name,
            user_id: id,
            ip_address,
            user_agent
        };
        const data = await this._tagService.save(newTag);
        const response = {
            response: {
                message: "Tag created",
                details: data
            },
            success: true,
        };
        res.status(201).json(response);
    }
}
//# sourceMappingURL=tag.controller.js.map