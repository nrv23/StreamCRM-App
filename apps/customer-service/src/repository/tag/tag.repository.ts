import { databaseInstance } from "../../config/query.js";
import { CreateTagDto } from "../../dto/tag/create-tag.dto.js";
import { IDatabase } from "../../interfaces/customer/database.interface.js";
import { ITagRepository } from "../../interfaces/tag/tag-repository.interface.js";



export class TagRepository implements ITagRepository {
    private _db: IDatabase;
    constructor(db?: IDatabase) {
        this._db = db ?? databaseInstance;
    }

    save(tag: CreateTagDto): Promise<void> {
        return;
    }


}