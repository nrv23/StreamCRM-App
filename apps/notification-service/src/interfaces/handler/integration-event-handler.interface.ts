import { CreateNotificationDto } from "../../dto/notifications/create-notification.dto.ts";

/*

    customer.status.changed
    customer.tag.added
    customer.updated
    customer.created
    customer.deleted

*/
export interface IntegrationEventHandler {
    handle(event: CreateNotificationDto): Promise<void>;
}
