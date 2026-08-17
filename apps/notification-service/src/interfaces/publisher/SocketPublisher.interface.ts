import { GetNotificationDeliveriesResponse } from "../../repository/notification/notification-delivery-repository.repository.ts";

export interface ISocketPublisher {
    publish(deliverdeliveries: GetNotificationDeliveriesResponse[]): Promise<void>;
}