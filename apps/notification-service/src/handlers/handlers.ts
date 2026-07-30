import path from "node:path";
import { fileURLToPath } from "node:url";
import { RabbitEventDto } from "../dto/outboxEvents/rabbitEvent.dto.ts";
import { IntegrationEventHandler } from "../interfaces/handler/integration-event-handler.interface.ts";
import { NotificationDispatcher } from "./notification-dispatcher.ts";
import { NotificationRepository } from "../repository/notification/notification-repository.repository.ts";
import { EmailSender } from "../sender/email.sender.ts";
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
import { HandlebarsTemplateEngine } from "../handlebars/handlebarsTemplateEngine.ts";
import { SmsSender } from "../sender/sms.sender.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// instancia de template engine
const templatesDirectoryPath = path.join(__dirname, './../templates/');
const templateEngine = new HandlebarsTemplateEngine(templatesDirectoryPath);
// 2. Instancias el sender y tu nuevo NotificationDispatcher
const emailSender = new EmailSender(templateEngine); // (O la clase real que use nodemailer)
const smsSender = new SmsSender();
const notificationDispatcher = new NotificationDispatcher(emailSender, smsSender);


const notificationRepository = new NotificationRepository();
export const handlers = new Map<string, IntegrationEventHandler<RabbitEventDto>>([
    [
        CREATE_CUSTOMER,
        new CreateCustomerHandler(notificationRepository, notificationDispatcher),
    ],
    [
        UPDATE_CUSTOMER,
        new UpdateCustomerHandler(notificationRepository, notificationDispatcher),
    ],
    [
        DELETE_CUSTOMER,
        new DeleteCustomerHandler(notificationRepository, notificationDispatcher),
    ],
    [
        CHANGE_CUSTOMER_STATUS,
        new CustomerStatusChangeHandler(notificationRepository, notificationDispatcher),
    ],

    [
        CREATE_TAG,
        new CreateTagHandler(notificationRepository, notificationDispatcher),
    ],

]);

/*
    customer.status.changed -- 
    customer.tag.added
    customer.updated -- 
    customer.created -- 
    customer.deleted --
*/