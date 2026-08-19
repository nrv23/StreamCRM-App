
import { ApiErrorCode } from "../../enum/ErrorCodes.enum.ts";
import { SocketPayload } from "../../interfaces/socket/SocketMessage.interface.ts";
import { GetNotificationDeliveriesResponse } from "../../repository/notification/notification-delivery-repository.repository.ts";
import { UPDATE_CUSTOMER, CHANGE_CUSTOMER_STATUS, DELETE_CUSTOMER, CREATE_TAG } from "../types/events.type..ts";
import { ErrorFactory } from "./error-factory.ts";


export class SocketPayloadFactory {

    public static build(delivery: GetNotificationDeliveriesResponse): SocketPayload | null {
        let newPayload: SocketPayload | null;

        if (!delivery.metadata.event) throw ErrorFactory.build(ApiErrorCode.INTERNAL_SERVER_ERROR, 'delivery metada miss event property');

        switch (delivery.metadata!.event!.toString()) {
            case UPDATE_CUSTOMER:
                newPayload = {
                    message: 'Customer info was updated',
                    data: {
                        email: delivery.metadata!.email!.toString(),
                        fullName: ''.concat(delivery.metadata!.firstName!.toString(), ' ', delivery.metadata!.lastName!.toString()),
                        event: delivery.metadata!.event!.toString()
                    }
                }
                break;

            case CHANGE_CUSTOMER_STATUS:
                newPayload = {
                    message: 'Customer status was changed',
                    data: {
                        email: delivery.metadata!.email!.toString(),
                        fullName: ''.concat(delivery.metadata!.firstName!.toString(), ' ', delivery.metadata!.lastName!.toString()),
                        prevStatus: delivery.metadata.previousStatus?.toString()!,
                        newStatus: delivery.metadata.newStatus!.toString(),
                        event: delivery.metadata!.event!.toString()
                    }
                }
                break;

            case DELETE_CUSTOMER:
                newPayload = {
                    message: 'Customer was deleted',
                    data: {
                        email: delivery.metadata!.email!.toString(),
                        fullName: ''.concat(delivery.metadata!.firstName!.toString(), ' ', delivery.metadata!.lastName!.toString()),
                        event: delivery.metadata!.event!.toString()
                    }
                }
                break;

            case CREATE_TAG:
                newPayload = {
                    message: 'Tag was created',
                    data: {
                        tag_id: delivery.metadata!.tag_id!,
                        tag_name: delivery.metadata!.tag_name!.toString(),
                        event: delivery.metadata!.event!.toString()
                    }
                }
                break;
            default:
                newPayload = null;
        }

        return newPayload;
    }
}