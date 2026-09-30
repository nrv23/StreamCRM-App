import { Client } from "pg";
import { createEventDto } from "../dto/event/create-event.dto.ts";

import { EventPublisher } from "../interfaces/publisher/EventPublisher.interface.ts";
import { IListenNotify } from "../interfaces/user/listen-notification.interface.ts";
import { IDobleAuthenticateRepositpry } from "../interfaces/user/doble-authenticate.interface.ts";
import { IOutboxEventsRepository } from "../interfaces/user/outbox_event-repository.interface.ts";
import { StatusEvent } from "../enum/StatusEvent.enum.ts";



export class ListenNotifyDb implements IListenNotify<createEventDto> {


    constructor(
        private _client: Client,
        private _outBoxListener: EventPublisher,
        private _outboxEventRepository: IOutboxEventsRepository

    ) {

    }
    async connect(): Promise<void> {
        await this._client.connect();
    }

    async listen(event: string): Promise<void> {


        await this._client.query(`LISTEN ${event}`);

        this._client.on('notification', async data => {

            if (!data.payload) return;
            console.log("Nueva notificacion", data.payload);


            const event = JSON.parse(data.payload) as createEventDto;
            console.log({ event })

            try {
                await this._outboxEventRepository.markAsProcessing(event.event_id);
                await this._outBoxListener.publish({
                    event_id: event.event_id,
                    event_name: event.event_name,
                    aggregate_id: event.aggregate_id,
                    aggregate_type: event.aggregate_type,
                    headers: event.headers,
                    payload: event.payload,
                    status: StatusEvent.pending,
                    retry_count: 0, // crear un enum
                    error_message: '', // crear un enum
                    created_at: new Date().toISOString(), // crear un enum
                })

                await this._outboxEventRepository.markAsPublished(event.event_id);

            } catch (error) {
                const errMessage = error instanceof Error ? error.message : String(error);
                console.log({ errMessage });
                await this._outboxEventRepository.markAsFailed(event.event_id, errMessage)
            }
        });
    }

    async close(): Promise<void> {
        await this._client.end();
    }

}