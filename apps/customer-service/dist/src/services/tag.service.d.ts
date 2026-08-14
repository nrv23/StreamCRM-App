import { UnitOfWork } from '../config/unitOfWork.js';
import { CreateTagDto } from '../dto/tag/create-tag.dto.js';
import { Logger } from 'winston';
export declare class TagService {
    private _unitOfWork;
    private _logger;
    constructor(unitOfWork: UnitOfWork, logger: Logger);
    save(dto: CreateTagDto): Promise<import("../entity/Tag.entity.ts").Tag>;
}
//# sourceMappingURL=tag.service.d.ts.map