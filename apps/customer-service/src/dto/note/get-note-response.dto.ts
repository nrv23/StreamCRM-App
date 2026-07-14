

export class GetNoteDtoResponse {

    constructor(
        public readonly customerId: number,
        public customerName: string,
        public customerEmail: string,
        public customerExternalId: string,
        public note: string,
        public createdAt: string

    ) {

    }

}