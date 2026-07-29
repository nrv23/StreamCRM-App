import { CreateNotificationDto } from "../../dto/notifications/create-notification.dto.ts";
import { RabbitEventDto } from "../../dto/outboxEvents/rabbitEvent.dto.ts";

/*

    customer.status.changed
    customer.tag.added
    customer.updated
    customer.created
    customer.deleted

*/
export interface IntegrationEventHandler<Tevent> {
    handle(event: Tevent): Promise<void>;
}
