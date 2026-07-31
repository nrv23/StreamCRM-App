import { databaseInstance } from "../../config/query.ts";
import { CreateNotificationDeliveryDto } from "../../dto/notifications/create-notification-delivery.dto.ts";
import { ApiErrorCode } from "../../enum/ErrorCodes.enum.ts";
import { NotificationDeliveryStatus } from "../../enum/NotificationDeliveryStatus.enum.ts";
import { IDatabase } from "../../interfaces/database.interface.ts";
import { INotificationDeliveryRepository } from "../../interfaces/notification/notification-delivery-repository.interface.ts";
import { ErrorFactory } from "../../shared/factory/error-factory.ts";

type NoificationDeliveryResponse = {
    id: number
}

export class NotificationDeliveryRepository implements INotificationDeliveryRepository {

    private _db: IDatabase;
    constructor(db?: IDatabase) {
        this._db = db ?? databaseInstance;
    }
    async save(dto: CreateNotificationDeliveryDto): Promise<void> {
        // crea el delivery y lo marca como pending
        const sql = 'insert into notification_deliveries(notification_id, status, channel) values($1,$2,$3) returning id;';
        const [response] = await this._db.query<NoificationDeliveryResponse>(sql, [dto.notification_id, NotificationDeliveryStatus.PENDING, dto.channel]);
        if (!response || !response.id)
            throw ErrorFactory.build(
                ApiErrorCode.INTERNAL_SERVER_ERROR,
                'An error was ocurred while trying to insert notification delivery'
            );

    }
    async markAsDelivered(notification_id: number, message_uuid: string): Promise<void> {

        const sql = `update notification_deliveries 
                    set status = $1, delivered_at = now(), attempts = 0, provider_message_id = $2 
                    where notification_id = $3 returning id;`;
        const [response] = await this._db.query<NoificationDeliveryResponse>(sql, [NotificationDeliveryStatus.DELIVERED, message_uuid, notification_id]);
        if (!response || !response.id)
            throw ErrorFactory.build(
                ApiErrorCode.INTERNAL_SERVER_ERROR,
                'An error was ocurred while trying to mark as delivered notification'
            );
    }
    async markAsFailed(notification_id: number, error_message: string): Promise<void> {
        const sql = `update notification_deliveries 
                    set status = $1, failed_at = now(), attempts = attempts + 1, error_message = $2 
                    where notification_id = $3 returning id;`;
        const [response] = await this._db.query<NoificationDeliveryResponse>(sql, [NotificationDeliveryStatus.FAILED, error_message, notification_id]);
        if (!response || !response.id)
            throw ErrorFactory.build(
                ApiErrorCode.INTERNAL_SERVER_ERROR,
                'An error was ocurred while trying to mark as failed notification'
            );
    }


}