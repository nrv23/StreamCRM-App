

export enum NotificationDeliveryStatus {
    PENDING = 'pending',
    DELIVERED = 'delivered',
    FAILED = 'failed',
    ACCEPTED = 'accepted',
    PROCESSING = 'processing'
}

// Actualmente "delivered" significa:
// "Proveedor aceptó la solicitud y devolvió un providerMessageId."
// En el futuro se implementarán Delivery Receipts.