export const ROLE_PERMISSION_POLICY = {
    viewer: {
        permissions: [
            'customers.read',
            'tickets.read',
            'campaigns.read',
            'imports.read',
            'reports.read',
            'notifications.read',
        ],
        roleId: 1
    },

    operator: {
        permissions: [
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
        roleId: 2
    },

    admin: {
        permissions: [
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
        roleId: 3
    },
    superadmin: {
        permissions: '*',
        roleId: 4
    },
};