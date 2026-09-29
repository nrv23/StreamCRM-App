import { createEventDto } from "../../dto/event/create-event.dto.ts";


export interface IListenNotify<T> {
    listen(event: string): Promise<void>;
    connect(): Promise<void>;
}