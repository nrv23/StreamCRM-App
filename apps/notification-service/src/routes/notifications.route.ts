import { Router } from "express";
import { IRoutes } from "../interfaces/routes.interface.js";
import { getNotificationValidator } from "../validators/notification/get-notification.validator.js";
import { validateRequest } from "../shared/middleware/validate-errors.middleware.js";
import { fakeAuth } from "../shared/middleware/fake-user.middleware.js";
import { UnitOfWork } from "../config/unitOfWork.js";
import { NotificationRepository } from "../repository/notification/notification-repository.repository.js";
import { NotificationService } from "../services/Notification.service.js";
import { NotificationController } from "../controllers/notifications.controller.js";
import { markAsReadNotificationValidator } from "../validators/notification/mark-as-read-notification.validator.ts";

export class NotificationRoutes implements IRoutes {


    private _router: Router;
    private _notificationRepository: NotificationRepository;
    private _notificationService: NotificationService;
    private _notificationController: NotificationController;
    constructor() {

        this._notificationRepository = new NotificationRepository();
        this._notificationService = new NotificationService(this._notificationRepository);
        this._notificationController = new NotificationController(this._notificationService);
        this._router = Router();

    }

    BuildRoutes(): Router {
        this._router.post('/', getNotificationValidator, validateRequest, fakeAuth, this._notificationController.search.bind(this._notificationController));
        this._router.patch('/:notification_id', markAsReadNotificationValidator, validateRequest, fakeAuth, this._notificationController.markAsRead.bind(this._notificationController));
        return this._router;
    }
}