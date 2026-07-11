


export class Note {

    constructor(
        public readonly id: number,
        public note: string,
        public customer_id: number,
        public user_id: number,
        public created_at: string

    ) {

    }

}