import { databaseInstance } from "../../config/query.js";
import { CreateTagDto } from "../../dto/tag/create-tag.dto.js";
import { Tag } from "../../entity/Tag.entity.js";
import { IDatabase } from "../../interfaces/database.interface.js";
import { ITagRepository } from "../../interfaces/tag/tag-repository.interface.js";



export class TagRepository implements ITagRepository {
    private _db: IDatabase;
    constructor(db?: IDatabase) {
        this._db = db ?? databaseInstance;
    }

    async save(tag: CreateTagDto): Promise<Tag> {
        const [newTag] = await this._db.query('Insert into tags(name) values($1) RETURNING *', [tag.name]);
        return newTag as Tag;
    }

    async addTagToCustomer(customerId: number, tagId: number): Promise<boolean> {

        const response = await this._db.query<{ id: number }>('insert into customer_tags(customer_id, tag_id) values($1,$2) RETURNING tag_id',
            [customerId, tagId]);

        return Boolean(response.length);
    }
}