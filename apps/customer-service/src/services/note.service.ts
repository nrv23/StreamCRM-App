import { UnitOfWork } from "../config/unitOfWork.js";
import { CreateNoteDto } from "../dto/note/create-not.dto.js";
import { GetNoteDtoResponse } from "../dto/note/get-note-response.dto.js";
import { GetNoteDto } from "../dto/note/get-note.dto.js";
import { Note } from "../entity/Note.entity.js";
import { ApiErrorCode } from "../enum/error-codes.enum.js";
import { IPaginationResponse } from "../interfaces/pagination.interface.js";
import { ErrorFactory } from "../shared/factory/error-factory.js";
import { CREATE_NOTE } from "../shared/types/events.type.js";
import { EntityType } from "../enum/entity-type.enum.js";

export class NoteService {

    private _unitOfWork: UnitOfWork;
    constructor(unitOfWork: UnitOfWork) {
        this._unitOfWork = unitOfWork;
    }

    async save(dto: CreateNoteDto): Promise<Note> {

        return await this._unitOfWork.execute(async ({ customers, notes, auditLogs }) => {
            const customer = await customers.findById(dto.customer_id);
            if (!customer) throw ErrorFactory.build(ApiErrorCode.NOT_FOUND, 'Customer is no exists', '');

            const newNote = await notes.save(dto);

            await auditLogs.save({
                entity_id: newNote.id,
                entity_type: EntityType.CUSTOMER_NOTE,
                action: CREATE_NOTE,
                changed_by_user_id: dto.user_id,
                old_values: {},
                new_values: { ...newNote }
            })

            return newNote;
        })
    }

    async search(options: GetNoteDto): Promise<IPaginationResponse<GetNoteDtoResponse[]>> {

        return await this._unitOfWork.execute(async ({ notes }) => {

            const page = options.page || 1;
            const limit = options.limit || 20;

            options.limit = limit;
            options.page = page;

            const [notesData, totalItems] = await Promise.all([notes.searchByFilters(options), notes.getTotalRecords(options)]);
            const totalPages = Math.ceil(totalItems / limit);
            const prevPage = page! > 1 ? page! - 1 : null;
            const nextPage = page! < totalPages ? page! + 1 : null;

            const response: IPaginationResponse<GetNoteDtoResponse[]> = {
                data: notesData,
                paginationData: {
                    page,
                    pageSize: notesData.length,
                    totalPages,
                    totalRecords: totalItems,
                    previousPage: prevPage!,
                    nextPage: nextPage!
                }
            }

            return response;
        })
    }
}