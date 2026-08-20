import { GetNotificationsDto } from "../dto/notifications/get-notifications.dto.js";
import { ApiErrorCode } from "../enum/ErrorCodes.enum.ts";
import { NotificationCommand } from "../enum/Notification-Command.enum.ts";
import { IPaginationResponse } from "../interfaces/pagination.interface.js";
import { GetNotificationsResponse, NotificationRepository } from "../repository/notification/notification-repository.repository.js";
import { ErrorFactory } from "../shared/factory/error-factory.ts";


export class NotificationService {

    private _notificationRepository: NotificationRepository;

    constructor(notificationRepository: NotificationRepository) {
        this._notificationRepository = notificationRepository;
    }

    async search(options: GetNotificationsDto) {

        const page = options.page || 1;
        const limit = options.limit ? options.limit > 20 ? 20 : options.limit : 20;

        options.limit = limit;
        options.page = page;

        // 4. CÁLCULO DE NEXT Y PREVIOUS (Tu ajuste clave)
        const [notifications, totalItems] = await Promise.all([
            this._notificationRepository.searchByFilters(options), this._notificationRepository.getTotalRecords(options)
        ]);

        const totalPages = Math.ceil(totalItems / limit);
        const prevPage = page! > 1 ? page! - 1 : null;
        const nextPage = page! < totalPages ? page! + 1 : null;

        const response: IPaginationResponse<GetNotificationsResponse[]> = {
            data: notifications,
            paginationData: {
                page: +page,
                pageSize: notifications.length,
                totalPages,
                totalRecords: totalItems,
                previousPage: prevPage!,
                nextPage: nextPage!
            }
        }

        return response;
    }

    async markAsRead(notification_id: number, user_id: number) {

        const currentNotification = await this._notificationRepository.getNotficationById(notification_id, user_id);
        if (!currentNotification.length) throw ErrorFactory.build(ApiErrorCode.BAD_REQUEST, 'notification not found');
        await this._notificationRepository.markAsRead(notification_id, user_id);
    }

    async geUnreadNotificactionsCount(user_id: number) {
        const response = await this._notificationRepository.geUnreadNotificactionsCount(user_id, NotificationCommand.WEBSOCKET);
        return response;
    }
}