import { databaseInstance } from "../../config/query.ts";
import { CreateNotificationDeliveryDto } from "../../dto/notifications/create-notification-delivery.dto.ts";
import { JsonObject } from "../../dto/outboxEvents/createOutboxEvent.dto.ts";
import { NotificationDelivery } from "../../entity/NotificationDeliveries.entity.ts";
import { ApiErrorCode } from "../../enum/ErrorCodes.enum.ts";
import { NotificationCommand } from "../../enum/Notification-Command.enum.ts";
import { NotificationDeliveryStatus } from "../../enum/NotificationDeliveryStatus.enum.ts";
import { IDatabase } from "../../interfaces/database.interface.ts";
import { INotificationDeliveryRepository } from "../../interfaces/notification/notification-delivery-repository.interface.ts";
import { ErrorFactory } from "../../shared/factory/error-factory.ts";

export type NoificationDeliveryResponse = {
    id: number
}

export type GetNotificationDeliveriesResponse = {
    notification_id: number;
    channel: NotificationCommand;
    delivery_id: number;
    notification_external_id: string;
    title: string;
    message: string;
    metadata: JsonObject;
}


export class NotificationDeliveryRepository implements INotificationDeliveryRepository {

    private _db: IDatabase;
    constructor(db?: IDatabase) {
        this._db = db ?? databaseInstance;
    }

    async save(dto: CreateNotificationDeliveryDto): Promise<NoificationDeliveryResponse> {
        // crea el delivery y lo marca como pending
        const sql = 'insert into notification_deliveries(notification_id, status, channel) values($1,$2,$3) returning id;';
        const [response] = await this._db.query<NoificationDeliveryResponse>(sql, [dto.notification_id, NotificationDeliveryStatus.PENDING, dto.channel]);
        if (!response || !response.id)
            throw ErrorFactory.build(
                ApiErrorCode.INTERNAL_SERVER_ERROR,
                'An error was ocurred while trying to insert notification delivery'
            );
        return response;

    }
    async markAsDelivered(notification_delivery_id: number, message_uuid: string): Promise<void> {

        const sql = `update notification_deliveries 
                    set status = $1, failed_at = null, delivered_at = now(), attempts = 0, provider_message_id = $2 
                    where id = $3 returning id;`;
        console.log('marking as delivered...')
        const [response] = await this._db.query<NoificationDeliveryResponse>(sql, [NotificationDeliveryStatus.DELIVERED, message_uuid, notification_delivery_id]);
        if (!response || !response.id)
            throw ErrorFactory.build(
                ApiErrorCode.INTERNAL_SERVER_ERROR,
                'An error was ocurred while trying to mark as delivered notification'
            );
    }
    async markAsFailed(notification_delivery_id: number, error_message: string): Promise<void> {
        const sql = `update notification_deliveries 
                    set status = CASE
                        WHEN attempts >= 5 THEN $1
                        ELSE $2
                    END, 
                    failed_at = now(), attempts = attempts + 1, error_message = $3 
                    where id = $4 returning id;`;
        console.log('marking as failed...')
        const [response] = await this._db.query<NoificationDeliveryResponse>(sql,
            [NotificationDeliveryStatus.FAILED, NotificationDeliveryStatus.PENDING, error_message, notification_delivery_id]);
        if (!response || !response.id)
            throw ErrorFactory.build(
                ApiErrorCode.INTERNAL_SERVER_ERROR,
                'An error was ocurred while trying to mark as failed notification'
            );
    }
    // agregar metodo para buscar deliveries en pending, 5 intentos marca el evento como failed.

    async getNotficationDeliveries(status: NotificationDeliveryStatus, limit: number, allowedDeliveryChannel: NotificationCommand[]): Promise<GetNotificationDeliveriesResponse[]> {

        const sql = `
            SELECT
                n.id AS notification_id,
                n.external_id as notification_external_id,
                nd.id AS delivery_id,
                nd.channel,
                n.title,
                n.message,
                n.metadata
            FROM notification_deliveries nd
            INNER JOIN notifications n
                ON n.id = nd.notification_id
            WHERE nd.status = $1
            AND nd.channel =  ANY($2::varchar[]) -- obtiene los deliveries de channel email o sms
            ORDER BY nd.id DESC
            LIMIT $3;
        `;


        console.log('getting NotficationDeliveries...')
        const response = await this._db.query<GetNotificationDeliveriesResponse>(sql, [status, limit, allowedDeliveryChannel]);
        return response
    }

    async findStatusesByNotificationId(
        notificationId: number,
    ): Promise<NotificationDeliveryStatus[]> {
        const sql = `
        SELECT status
        FROM notification_deliveries
        WHERE notification_id = $1
        ORDER BY id ASC;
    `;

        console.log('finding Statuses By NotificationId....')
        const rows =
            await this._db.query<{
                status: NotificationDeliveryStatus;
            }>(
                sql,
                [notificationId],
            );

        return rows.map(row => row.status);
    }

    async setStatusProcessing(deliveriesId: number[]): Promise<void> {

        const sql = `
            UPDATE notification_deliveries
            SET status = $1
            WHERE id = ANY($2::int[]) -- esto permite usar un array como lista de parametros
            RETURNING id;
        `;

        await this._db.query<NoificationDeliveryResponse>(
            sql,
            [
                NotificationDeliveryStatus.PROCESSING,
                deliveriesId,
            ],
        );

    }
}