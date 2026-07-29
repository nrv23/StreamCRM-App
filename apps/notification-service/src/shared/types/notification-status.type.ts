
// (ARRAY['pending'::character varying, 'sent'::character varying, 'read'::character varying, 'failed'::character varying]::text[]))
export enum NotificationStatus {
    PENDING = 'pending',
    SENT = 'sent',
    READ = 'read',
    FAILED = 'failed',
}