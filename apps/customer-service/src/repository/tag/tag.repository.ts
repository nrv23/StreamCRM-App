import { databaseInstance } from "../../config/query.js";
import { CreateTagDto } from "../../dto/tag/create-tag.dto.js";
import { Tag } from "../../entity/Tag.entity.js";
import { ApiErrorCode } from "../../enum/ErrorCodes.enum.js";
import { IDatabase } from "../../interfaces/database.interface.js";
import { ITagRepository } from "../../interfaces/tag/tag-repository.interface.js";
import { ErrorFactory } from "../../shared/factory/error-factory.js";



export class TagRepository implements ITagRepository {
    private _db: IDatabase;
    constructor(db?: IDatabase) {
        this._db = db ?? databaseInstance;
    }

    async save(tag: CreateTagDto): Promise<Tag> {
        const [newTag] = await this._db.query<Tag>('Insert into tags(name) values($1) RETURNING *', [tag.name]);
        if (!newTag) throw ErrorFactory.build(
            ApiErrorCode.CONFLICT_ERROR,
            "Tag was not inserted"
        );
        return newTag;
    }

    async addTagToCustomer(customerId: number, tagId: number): Promise<boolean> {

        const response = await this._db.query<{ id: number }>('insert into customer_tags(customer_id, tag_id) values($1,$2) RETURNING tag_id',
            [customerId, tagId]);

        if (!response.length) throw ErrorFactory.build(
            ApiErrorCode.CONFLICT_ERROR,
            "TagToCustomer was not inserted"
        );
        return true;
    }
}