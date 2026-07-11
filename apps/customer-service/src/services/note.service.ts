import { UnitOfWork } from "../config/unitOfWork.js";
import { CreateNoteDto } from "../dto/note/create-not.dto.js";
import { ApiErrorCode } from "../enum/error-codes.enum.js";
import { ErrorFactory } from "../shared/factory/error-factory.js";

export class NoteService {

    private _unitOfWork: UnitOfWork;
    constructor(unitOfWork: UnitOfWork) {
        this._unitOfWork = unitOfWork;
    }

    async save(dto: CreateNoteDto) {

        return await this._unitOfWork.execute(async ({ customers, notes }) => {
            const customer = await customers.findById(dto.customer_id);
            if (!customer) throw ErrorFactory.build(ApiErrorCode.NOT_FOUND, 'Customer is no exists', '');
            return await notes.save(dto);
        })
    }
}