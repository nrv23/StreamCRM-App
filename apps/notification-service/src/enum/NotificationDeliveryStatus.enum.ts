

export enum NotificationDeliveryStatus {
    PENDING = 'pending',
    DELIVERED = 'delivered',
    FAILED = 'failed',
    ACCEPTED = 'accepted'
}

// Actualmente "delivered" significa:
// "Proveedor aceptó la solicitud y devolvió un providerMessageId."
// En el futuro se implementarán Delivery Receipts.