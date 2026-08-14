import { CreateTagDto } from "../../dto/tag/create-tag.dto.js";
import { Tag } from "../../entity/Tag.entity.js";
import { IDatabase } from "../../interfaces/database.interface.js";
import { ITagRepository } from "../../interfaces/tag/tag-repository.interface.js";
export declare class TagRepository implements ITagRepository {
    private _db;
    constructor(db?: IDatabase);
    save(tag: CreateTagDto): Promise<Tag>;
    addTagToCustomer(customerId: number, tagId: number): Promise<boolean>;
}
//# sourceMappingURL=tag.repository.d.ts.map