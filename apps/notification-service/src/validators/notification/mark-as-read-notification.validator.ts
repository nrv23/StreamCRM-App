import { param } from 'express-validator';


export const markAsReadNotificationValidator = [

    param('notification_id')
        .isInt({
            min: 1
        })
        .withMessage('notification_id debe ser un número entero mayor a 0')
        .toInt(),

];
