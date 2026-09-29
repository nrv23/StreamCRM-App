import { Client } from "pg";
import { createEventDto } from "../dto/event/create-event.dto.ts";

import { EventPublisher } from "../interfaces/publisher/EventPublisher.interface.ts";
import { IListenNotify } from "../interfaces/user/listen-notification.interface.ts";
import { IDobleAuthenticateRepositpry } from "../interfaces/user/doble-authenticate.interface.ts";
import { IOutboxEventsRepository } from "../interfaces/user/outbox_event-repository.interface.ts";



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

            try {

                if (!data.payload) return;
                console.log("Nueva notificacion", data.payload);


                const event = JSON.parse(data.payload) as createEventDto;
                console.log({ event })

                /*    this._outBoxListener.publish({
                        event_id: event.event_id,
                        event_name: event.event_name,
                        aggregate_id: event.aggregate_id,
                        aggregate_type: event.aggregate_type,
                        headers: event.headers,
                        payload: event.payload,
                        status: 'pending',
                        retry_count: 0, // crear un enum
                        error_message: '', // crear un enum
                        created_at: new Date().toISOString(), // crear un enum
                    })
                    */
                //await this._outboxEventRepository.markAsPublished()
            } catch (error) {
                //await this._outboxEventRepository.markAsFailed()
            }
        });
    }

    async close(): Promise<void> {
        await this._client.end();
    }

}