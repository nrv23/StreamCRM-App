import { ApiErrorCode } from "../../enum/ErrorCodes.enum.ts";
import { CREATE_CUSTOMER, LOGIN_USER } from "../types/events.type..ts";
import { ErrorFactory } from "./error-factory.ts";


export class TemplateFactory {

    static set(event: string) {

        let templatePath: string;
        switch (event) {

            case CREATE_CUSTOMER:
                templatePath = 'create-customer.handlebars'
                break;
            case LOGIN_USER:
                templatePath = '2fa-auth.code.handlebarse'
                break;
            default:
                throw ErrorFactory.build(ApiErrorCode.INTERNAL_SERVER_ERROR, 'Event not implemented');
        }

        return templatePath;
    }
}