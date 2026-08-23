import path from "node:path";
import { fileURLToPath } from "node:url";
import { RabbitEventDto } from "../dto/outboxEvents/rabbitEvent.dto.ts";
import { IntegrationEventHandler } from "../interfaces/handler/integration-event-handler.interface.ts";
import { NotificationDispatcher } from "./notification-dispatcher.ts";
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
import { UnitOfWork } from "../config/unitOfWork.ts";
import { SocketServer } from "../config/socketio.ts";
import { SocketPublisher } from "../publisher/Socket.publsher.ts";
import { WinstonLogger } from "../shared/utils/winstonLogger.ts";
import { env } from "../config/enviroment.ts";
import { RedisEmitter } from "../publisher/RedisEmitter.publisher.ts";
import { RedisBootstrap } from "../config/redis.ts";
env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// instancia de template engine
const templatesDirectoryPath = path.join(__dirname, './../templates/');
const templateEngine = new HandlebarsTemplateEngine(templatesDirectoryPath);
// 2. Instancias el sender y tu nuevo NotificationDispatcher
//const emailSender = new EmailSender(templateEngine); // (O la clase real que use nodemailer)
//const smsSender = new SmsSender();
//const notificationDispatcher = new NotificationDispatcher(emailSender, smsSender);

//const socketServer = SocketServer.getInstance();
const logger = WinstonLogger.getInstance(
    env.elastic_search_url,
    'handlers',
    'debug',
    env.index_elastic_search_name
)
const socketPublisher = new SocketPublisher(logger);
const redisEmitter = new RedisEmitter(RedisBootstrap.getInstance().getPublisher(), logger)
const unitOfWork = new UnitOfWork();
const limit = 20;
export const handlers = new Map<string, IntegrationEventHandler<RabbitEventDto>>([
    [
        CREATE_CUSTOMER,
        new CreateCustomerHandler(unitOfWork, redisEmitter, limit),
    ],
    // notificaciones que llegan a userId y adminIds
    [
        UPDATE_CUSTOMER,
        new UpdateCustomerHandler(unitOfWork, redisEmitter, limit),
    ],
    [
        DELETE_CUSTOMER,
        new DeleteCustomerHandler(unitOfWork, redisEmitter, limit),
    ],
    [
        CHANGE_CUSTOMER_STATUS,
        new CustomerStatusChangeHandler(unitOfWork, redisEmitter, limit),
    ],

    [
        CREATE_TAG,
        new CreateTagHandler(unitOfWork, redisEmitter, limit),
    ],

]);

/*
    customer.status.changed -- 
    customer.tag.added
    customer.updated -- 
    customer.created -- 
    customer.deleted --
*/