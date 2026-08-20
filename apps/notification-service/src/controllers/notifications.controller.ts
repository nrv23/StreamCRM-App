import { Request, Response } from 'express';
import { NotificationService } from "../services/Notification.service.ts";
import { GetNotificationsDto } from '../dto/notifications/get-notifications.dto.ts';
import { ApiResponse } from '../shared/types/api-response.ts';
import { GetNotificationsResponse, GetUnReadNotificationsCount } from '../repository/notification/notification-repository.repository.ts';
import { IPaginationResponse } from '../interfaces/pagination.interface.ts';

// comentario de prueba

export class NotificationController {

    private _notificationService: NotificationService;


    constructor(notificationService: NotificationService) {
        this._notificationService = notificationService;
    }

    async search(req: Request, res: Response) {

        const { id } = req.user;
        const { page, limit, status, type, search } = req.body;
        const dto: GetNotificationsDto = {
            user_id: +id,
            page,
            limit,
            status,
            type,
            search
        };

        const notificationResponse = await this._notificationService.search(dto);

        const response: ApiResponse<IPaginationResponse<GetNotificationsResponse[]>> = {
            response: {
                message: "",
                details: notificationResponse
            },
            success: true
        }


        res.status(200).json(response);
        return;
    }

    async markAsRead(req: Request, res: Response) {

        const { notification_id } = req.params;
        const { id: user_id } = req.user;

        await this._notificationService.markAsRead(+notification_id!, user_id)

        const response: ApiResponse<null> = {
            response: {
                message: "Notification was marked as read"
            },
            success: true
        };

        res.status(200).json(response);
        return;
    }

    async getUnreadNotifications(req: Request, res: Response) {

        const { id: user_id } = req.user;
        const unreadNotificationsCount = await this._notificationService.geUnreadNotificactionsCount(user_id);
        const response: ApiResponse<GetUnReadNotificationsCount> = {
            success: true,
            response: {
                details: unreadNotificationsCount
            }
        }

        res.status(200).json(response);
        return;
    }
}