import { CreateTagDto } from "../../dto/tag/create-tag.dto.js";
import { Tag } from "../../entity/Tag.entity.js";
export interface ITagRepository {
    save(tag: CreateTagDto): Promise<Tag>;
}
//# sourceMappingURL=tag-repository.interface.d.ts.map