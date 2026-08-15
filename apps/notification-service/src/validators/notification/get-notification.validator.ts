import { body } from 'express-validator';
import { NotificationStatus } from '../../enum/notification-status.enum.ts';
import { NotificationType } from '../../enum/notification-type.enum.ts';

export const getNotificationValidator = [

    body('page')
        .optional({ nullable: true })
        .isInt({ min: 1 })
        .withMessage('page debe ser un número entero mayor a 0')
        .toInt(),

    body('limit')
        .optional({ nullable: true })
        .isInt({ min: 1 })
        .withMessage('limit debe ser un número entero mayor a 0')
        .toInt(),

    body('status')
        .optional({ nullable: true })
        .isIn(Object.values(NotificationStatus))
        .withMessage(`status debe ser un valor válido (${Object.values(NotificationStatus).join(', ')})`),

    body('type')
        .optional({ nullable: true })
        .isIn(Object.values(NotificationType))
        .withMessage(`type debe ser un valor válido (${Object.values(NotificationType).join(', ')})`),

    body('search')
        .optional({ nullable: true })
        .isString()
        .trim()
];
