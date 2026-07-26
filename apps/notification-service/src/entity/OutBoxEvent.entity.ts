

export class OutBoxEvent {

    constructor(
        public readonly id: number,
        public event_id: string,
        public event_name: string,
        public aggregate_id: string,
        public aggregate_type: string,
        public payload: JSON,
        public headers: JSON,
        public status: string, // crear un enum
        public retry_count: number, // crear un enum
        public error_message: string, // crear un enum
        public created_at: string, // crear un enum
        public published_at: string, // crear un enum
    ) {

    }
}