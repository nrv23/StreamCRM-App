import { databaseInstance } from "../../config/query.js";
import { ApiErrorCode } from "../../enum/ErrorCodes.enum.js";
import { ErrorFactory } from "../../shared/factory/error-factory.js";
export class TagRepository {
    _db;
    constructor(db) {
        this._db = db ?? databaseInstance;
    }
    async save(tag) {
        const [newTag] = await this._db.query('Insert into tags(name) values($1) RETURNING *', [tag.name]);
        if (!newTag)
            throw ErrorFactory.build(ApiErrorCode.CONFLICT_ERROR, "Tag was not inserted");
        return newTag;
    }
    async addTagToCustomer(customerId, tagId) {
        const response = await this._db.query('insert into customer_tags(customer_id, tag_id) values($1,$2) RETURNING tag_id', [customerId, tagId]);
        if (!response.length)
            throw ErrorFactory.build(ApiErrorCode.CONFLICT_ERROR, "TagToCustomer was not inserted");
        return true;
    }
}
//# sourceMappingURL=tag.repository.js.map