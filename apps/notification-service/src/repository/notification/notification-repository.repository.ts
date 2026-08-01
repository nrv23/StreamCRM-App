import { databaseInstance } from "../../config/query.ts";
import { CreateNotificationDto } from "../../dto/notifications/create-notification.dto.ts";
import { NotificationDelivery } from "../../entity/NotificationDeliveries.entity.ts";
import { ApiErrorCode } from "../../enum/ErrorCodes.enum.ts";
import { NotificationDeliveryStatus } from "../../enum/NotificationDeliveryStatus.enum.ts";
import { IDatabase } from "../../interfaces/database.interface.ts";
import { INotificationRepository } from "../../interfaces/notification/notification-repository.interface.ts";
import { ErrorFactory } from "../../shared/factory/error-factory.ts";

export type NotificationCreatedRow = {
    id: number;
    created_at: Date;
}


export class NotificationRepository implements INotificationRepository {


    private _db: IDatabase;
    constructor(db?: IDatabase) {
        this._db = db ?? databaseInstance;
    }

    async save(dto: CreateNotificationDto): Promise<NotificationCreatedRow> {
        const sql = `
        INSERT INTO notifications (
            external_id,
            user_id,
            title,
            message,
            type,
            status,
            metadata,
            event_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, created_at
    `;

        const [row] = await this._db.query<NotificationCreatedRow>(
            sql,
            [
                dto.external_id,
                dto.userId,
                dto.title,
                dto.message,
                dto.type,
                dto.status,
                dto.metadata,
                dto.eventId,
            ],
        );

        if (!row) {
            throw ErrorFactory.build(
                ApiErrorCode.INTERNAL_SERVER_ERROR,
                'There was an error when trying to insert a new notification'
            );
        }

        return row;
    }

}