# Notification System Rules

## Core Principle

The notification system must be implemented as an isolated feature.

Do not modify existing working logic.

Only extend functionality using new modules.

---

## Scope Rule (Critical)

Only create new files.

Do not modify:

Existing services
Existing controllers
Existing routes
Existing hooks
Existing pages
Existing reducers
Existing database tables

---

## Database Rule

Create a new table:

notifications

Columns:

id
type
message
entity_id
is_read
created_at

---

## Notification Types

Supported:

LOW_STOCK
OUT_OF_STOCK
SYSTEM
INFO

---

## Trigger Rule

Create notification when:

current_stock < threshold

Create notification when:

current_stock = 0

---

## Backend Structure Rule

Always create:

/backend/src/models/Notification.js

/backend/src/services/NotificationService.js

/backend/src/controllers/NotificationController.js

/backend/src/routes/notification.routes.js

Never modify:

InventoryService
ConsumptionService
WasteService

---

## Notification Creation Rule

Notification logic must be called as a separate function.

Example:

NotificationService.checkStockLevel()

Never embed notification logic inside existing services.

---

## Query Rule

Use efficient query:

Check stock status only when inventory updates.

Never run background full-table scans.

---

## API Endpoints

Create:

GET /notifications

GET /notifications/unread-count

PATCH /notifications/:id/read

---

## Pagination Rule

Notifications list must support:

page
limit
total
data

---

## Frontend Hook Rule

Create new hook:

/client/hooks/useNotifications.js

Hook must:

Fetch notifications
Fetch unread count
Mark notification as read
Support refetch

---

## UI Rule

Create:

Notification Bell Icon Badge

Show:

Unread count

Never block UI rendering.

---

## Page Rule

Create:

/client/src/pages/NotificationsPage.jsx

Display:

List of notifications

---

## Read Status Rule

When notification is opened:

Update:

is_read = true

---

## Isolation Rule (Critical)

Notification system must not affect:

Inventory logic
Consumption logic
Waste logic
Dashboard logic
Existing UI components

---

## Performance Rule

Always:

Use indexed queries

Index:

is_read
created_at

---

## Safety Rule

Never:

Rewrite existing code

Never:

Change existing API behavior

Never:

Change existing database schema









# Notification Trigger Integration Rules

## Purpose

Trigger notifications after inventory updates safely.

---

## Integration Rule

Use post-operation hooks.

Never modify core logic.

---

## Allowed Integration Points

After:

Inventory update

Consumption record

Waste record

---

## Implementation Pattern

Call:

NotificationService.checkStockLevel()

After database update succeeds.

---

## Never:

Rewrite existing service logic

Never:

Change return values

Never:

Interrupt existing flow