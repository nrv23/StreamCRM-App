import { IntegrationEventHandler } from "../interfaces/handler/integration-event-handler.interface.ts";
import { NotificationRepository } from "../repository/notification/notification-repository.repository.ts";
import {
    CHANGE_CUSTOMER_STATUS,
    CREATE_CUSTOMER,
    CREATE_TAG,
    DELETE_CUSTOMER,
    UPDATE_CUSTOMER
} from "../shared/types/events.type..ts";
import { CreateCustomerHandler } from "./createCustomer.handler.ts";
import { CreateTagHandler } from "./createTag.handler.ts";
import { CustomerStatusChangeHandler } from "./customerStatusChange.handler.ts";
import { DeleteCustomerHandler } from "./deleteCustomer.handler.ts";
import { UpdateCustomerHandler } from "./updateCustomer.handler.ts";

const notificationRepository = new NotificationRepository();
export const handlers = new Map<string, IntegrationEventHandler>([
    [
        CREATE_CUSTOMER,
        new CreateCustomerHandler(notificationRepository),
    ],
    [
        UPDATE_CUSTOMER,
        new UpdateCustomerHandler(notificationRepository),
    ],
    [
        DELETE_CUSTOMER,
        new DeleteCustomerHandler(notificationRepository),
    ],
    [
        CHANGE_CUSTOMER_STATUS,
        new CustomerStatusChangeHandler(notificationRepository),
    ],

    [
        CREATE_TAG,
        new CreateTagHandler(notificationRepository),
    ],

]);

/*
    customer.status.changed -- 
    customer.tag.added
    customer.updated -- 
    customer.created -- 
    customer.deleted --
*/