# Dashboard Full Stack Implementation Rules

## Objective

Ensure DashboardPage uses a backend-driven architecture with a single optimized database query.

---

## Scope Rule (Critical)

Only modify:

/backend/src/routes/dashboard.routes.ts
/backend/src/controllers/dashboard.controller.ts
/backend/src/services/dashboard.service.ts
/client/hooks/useDashboard.ts
/client/src/pages/DashboardPage.tsx

Never modify:

Other pages
Other hooks
Shared components
Existing services
Database schemas

---

## Backend Detection Rule

Before creating new logic:

Check if dashboard endpoint exists.

Route:

GET /dashboard

If exists:

Reuse it.

If not:

Create new backend structure.

---

## Backend Structure Rule

Always create:

Route
Controller
Service

Flow:

Route
→ Controller
→ Service
→ Database

Never:

Put database logic in controller
Put business logic in route

---

## Database Query Rule (Critical)

Always use:

Single optimized database query.

Use:

Join
Aggregation
Lookup

Never:

Multiple sequential database queries
Multiple API calls
Frontend aggregation

---

## Dashboard Data Rule

Dashboard service must fetch:

Counts
Totals
Recent records
Summary metrics

From multiple collections in one query.

---

## Response Structure Rule

Always return:

{
  summary: {},
  counts: {},
  recent: {},
  metrics: {}
}

Never return:

Raw database objects
Entire collections
Unused fields

---

## Hook Rule

If hook does not exist:

Create:

/client/hooks/useDashboard.ts

Hook must:

Call backend API
Provide loading state
Provide error state
Provide refetch
Use existing hook pattern

---

## Page Rule

DashboardPage must:

Use useDashboard()

Never:

Fetch data directly
Use contextReducer
Call APIs inside component

---

## Isolation Rule (Critical)

Dashboard implementation must not affect:

Other pages
Other hooks
Other services
Global state

Changes must be fully isolated.