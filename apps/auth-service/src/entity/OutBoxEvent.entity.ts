import { JsonObject } from "../dto/event/create-event.dto.ts";


export class OutBoxEvent {

    constructor(

        public event_id: string,
        public event_name: string,
        public aggregate_id: BigInt | number,
        public aggregate_type: string,
        public payload: JsonObject,
        public headers: JsonObject,
        public status: string, // crear un enum
        public retry_count: number, // crear un enum
        public error_message: string, // crear un enum
        public created_at: string, // crear un enum
        public published_at?: string, // crear un enum
        public readonly id?: number,
    ) {

    }
}