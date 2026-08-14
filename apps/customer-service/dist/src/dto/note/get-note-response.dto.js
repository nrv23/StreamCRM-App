export class GetNoteDtoResponse {
    customerId;
    customerName;
    customerEmail;
    customerExternalId;
    note;
    createdAt;
    constructor(customerId, customerName, customerEmail, customerExternalId, note, createdAt) {
        this.customerId = customerId;
        this.customerName = customerName;
        this.customerEmail = customerEmail;
        this.customerExternalId = customerExternalId;
        this.note = note;
        this.createdAt = createdAt;
    }
}
//# sourceMappingURL=get-note-response.dto.js.map