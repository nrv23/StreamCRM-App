# API Summary

## Auth

```http
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

## Customers

```http
GET    /api/v1/customers
POST   /api/v1/customers
GET    /api/v1/customers/:id
PATCH  /api/v1/customers/:id
DELETE /api/v1/customers/:id
POST   /api/v1/customers/:id/notes
GET    /api/v1/customers/:id/history
```

## Imports

```http
POST /api/v1/imports/customers
GET  /api/v1/imports/:id
GET  /api/v1/imports/:id/errors
POST /api/v1/imports/:id/cancel
```

## Campaigns

```http
POST /api/v1/campaigns
GET  /api/v1/campaigns
GET  /api/v1/campaigns/:id
PATCH /api/v1/campaigns/:id
POST /api/v1/campaigns/:id/start
POST /api/v1/campaigns/:id/cancel
GET  /api/v1/campaigns/:id/progress
```

## Tickets

```http
POST /api/v1/tickets
GET  /api/v1/tickets
GET  /api/v1/tickets/:id
PATCH /api/v1/tickets/:id
POST /api/v1/tickets/:id/comments
POST /api/v1/tickets/:id/assign
POST /api/v1/tickets/:id/close
```

## Reports

```http
POST /api/v1/reports
GET  /api/v1/reports/:id
GET  /api/v1/reports/:id/download
GET  /api/v1/reports/templates
POST /api/v1/reports/templates
```

## Notifications

```http
GET  /api/v1/notifications
POST /api/v1/notifications/:id/read
GET  /api/v1/notifications/unread-count
```
