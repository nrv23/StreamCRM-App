export type CustomerCreatedEvent = {
  eventId: string;
  eventName: "customer.created";
  occurredAt: string;
  correlationId?: string;
  payload: {
    customerId: string;
    email: string | null;
  };
};
