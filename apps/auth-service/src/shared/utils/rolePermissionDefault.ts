export const ROLE_PERMISSION_POLICY = {
    viewer: [
        'customers.read',
        'tickets.read',
        'campaigns.read',
        'imports.read',
        'reports.read',
        'notifications.read',
    ],

    operator: [
        'customers.read',
        'customers.create',
        'customers.update',

        'tickets.read',
        'tickets.create',
        'tickets.update',

        'campaigns.read',

        'imports.read',
        'imports.create',

        'reports.read',

        'notifications.read',
    ],

    administrator: [
        'customers.read',
        'customers.create',
        'customers.update',
        'customers.delete',

        'tickets.read',
        'tickets.create',
        'tickets.update',
        'tickets.assign',

        'campaigns.read',
        'campaigns.create',
        'campaigns.update',

        'imports.read',
        'imports.create',

        'reports.read',
        'reports.create',

        'notifications.read',

        'users.read',
        'users.create',
        'users.update_status',

        'roles.read',
    ],

    superadmin: '*',
};