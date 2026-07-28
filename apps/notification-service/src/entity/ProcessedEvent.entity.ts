

export class ProcessedEvent {
    constructor(
        public readonly id: number,
        public readonly event_id: string,
        public readonly event_name: string,
        public readonly processed_at: Date,
    ) {

    }
}