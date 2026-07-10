import { CreateTagDto } from "../../dto/tag/create-tag.dto.js";


export interface ITagRepository {

    save(tag: CreateTagDto): Promise<void>;
}