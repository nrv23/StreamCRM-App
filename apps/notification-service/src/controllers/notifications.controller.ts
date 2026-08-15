import { Request, Response } from 'express';
import { NotificationService } from "../services/Notification.service.ts";
import { GetNotificationsDto } from '../dto/notifications/get-notifications.dto.ts';
import { ApiResponse } from '../shared/types/api-response.ts';
import { GetNotificationsResponse } from '../repository/notification/notification-repository.repository.ts';
import { IPaginationResponse } from '../interfaces/pagination.interface.ts';


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


        res.status(201).json(response);
        return;
    }
}