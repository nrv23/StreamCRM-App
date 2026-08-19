import { GetNotificationDeliveriesResponse } from "../../repository/notification/notification-delivery-repository.repository.ts";

export interface ISocketPublisher {
    publish(delivery: GetNotificationDeliveriesResponse): Promise<void>;
}