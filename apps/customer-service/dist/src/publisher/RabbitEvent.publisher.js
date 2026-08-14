import { rabbitMQClient } from "../config/raabbitmq.js";
export class RabbitEventPublisher {
    _rabbitClient;
    constructor() {
        this._rabbitClient = rabbitMQClient;
    }
    async publish(event) {
        return await this._rabbitClient.publish(event.event_name, event);
    }
}
//# sourceMappingURL=RabbitEvent.publisher.js.map