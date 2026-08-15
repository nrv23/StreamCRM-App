import { databaseInstance } from "../../config/query.js";
import { CreateNotificationDto } from "../../dto/notifications/create-notification.dto.js";
import { GetNotificationsDto } from "../../dto/notifications/get-notifications.dto.js";
import { ApiErrorCode } from "../../enum/ErrorCodes.enum.js";
import { NotificationStatus } from "../../enum/notification-status.enum.js";
import { NotificationType } from "../../enum/notification-type.enum.js";
import { IDatabase } from "../../interfaces/database.interface.js";
import { INotificationRepository } from "../../interfaces/notification/notification-repository.interface.js";
import { ErrorFactory } from "../../shared/factory/error-factory.js";

export type NotificationCreatedRow = {
    id: number;
    created_at: Date;
}

export type GetNotificationsResponse = {

    notification_id: number;
    external_id: string;
    title: string;
    message: string;
    type: NotificationType;
    status: NotificationStatus
    read_at: string;
    created_at: string;
}

export type GetNotificationsCountResponse = {
    count: number;
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

    async setNotificationStatus(notification_id: number, status: NotificationStatus): Promise<void> {

        const sql = 'update notifications set status = $1 where id = $2 RETURNING id, created_at;';
        console.log('setting notification status...')
        const [row] = await this._db.query<NotificationCreatedRow>(sql, [status, notification_id]);

        if (!row) {
            throw ErrorFactory.build(
                ApiErrorCode.INTERNAL_SERVER_ERROR,
                'There was an error when trying to update notification status'
            );
        }
    }



    async searchByFilters(dto: GetNotificationsDto): Promise<GetNotificationsResponse[]> {

        const limit = dto.limit ?? 20;
        const offset = (dto.page! - 1) * limit;
        const params: Array<string | number> = [];

        params.push(dto.user_id);

        let sql = `
        
            select 
                n.id as notification_id,
                n.external_id ,
                n.title ,
                n.message ,
                n.type,
                n.status,
                n.read_at,
                TO_CHAR(n.created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at
                
            from notifications n
            where n.user_id = $${params.length}
        `;

        if (dto.search) {

            params.push(`%${dto.search}%`);
            sql += ` and n.title ilike $${params.length}`;
        }

        if (dto.status) {
            params.push(dto.status);
            sql += ` and n.status = $${params.length}`;
        }

        if (dto.type) {
            params.push(dto.type);
            sql += ` and n.status = $${params.length}`;
        }

        const limitIndex = params.push(limit);
        const offsetIndex = params.push(offset);

        sql += `
            order by n.created_at desc 
            limit $${limitIndex} offset $${offsetIndex}
        `;

        const response = await this._db.query<GetNotificationsResponse>(sql, params);

        return response;
    }
    async getTotalRecords(dto: GetNotificationsDto): Promise<number> {

        const params: Array<string | number> = [];

        params.push(dto.user_id);

        let sql = `
        
            select 
                count(1) as count
            from notifications n
            where n.user_id = $${params.length}
        `;

        if (dto.search) {

            params.push(`%${dto.search}%`);
            sql += ` and n.title ilike $${params.length}`;
        }

        if (dto.status) {
            params.push(dto.status);
            sql += ` and n.status = $${params.length}`;
        }

        if (dto.type) {
            params.push(dto.type);
            sql += ` and n.type = $${params.length}`;
        }

        const [response] = await this._db.query<GetNotificationsCountResponse>(sql, params);
        return +response!.count;
    }
}