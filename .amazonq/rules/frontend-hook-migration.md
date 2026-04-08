# Frontend Hook Migration Rules

## Migration Phase

The backend APIs and new hooks are already implemented.

Your task is to migrate pages to use the new hooks instead of legacy hooks.

Do not create new backend logic.

Do not modify backend code.

Focus only on frontend page updates.

---

## Core Objective

Replace old hooks with new hooks across pages safely and consistently.

Always preserve:

- UI layout
- component structure
- routing
- pagination behavior
- filters
- table rendering

---

## Source of Truth

Always refer to:

/client/hooks/

These hooks are the approved data-fetching layer.

Never use:

- old hooks
- contextReducer data fetching
- direct API calls inside components

---

## Hook Replacement Rules

When updating a page:

Always:

1) Identify old hook usage
2) Import the new hook from /client/hooks/
3) Replace old hook call
4) Map returned data fields correctly
5) Keep UI logic unchanged
6) Keep pagination controls intact
7) Keep filters intact
8) Keep loading and error handling

Never:

- Rewrite UI components unnecessarily
- Change table structure
- Change route structure
- Remove pagination
- Modify backend APIs
- Introduce new state logic

---

## Import Rules

Always update imports to:

/client/hooks/

Example:

OLD:

import { useUsersContext } from "../../context/users";

NEW:

import { useUsers } from "../../hooks/useUsers";

---

## Data Mapping Rule

If new hook response structure differs:

Always:

Map data safely.

Example:

OLD:

users

NEW:

data

Then update usage accordingly.

Never assume field names are identical.

---

## Pagination Rule

Always preserve:

page
limit
total
onPageChange

Never remove pagination logic.

---

## File Scope Rule

Only modify:

/client/src/pages/

Do not modify:

/client/hooks/
/backend/
/models/
/services/

---

## Migration Strategy Rule

Always migrate:

One page at a time.

Never migrate:

Multiple unrelated pages in one step.

---

## Stability Rule

After updating a page:

Always ensure:

- No unused imports
- No console errors
- Hook is called correctly
- Loading state works
- Pagination works
- Filters work

---

## Deprecated Hook Rule

Never use:

Legacy hooks

Examples:

useUsersContext
useWasteContext
useConsumptionContext

Always use:

useUsers
useWaste
useConsumption

---

## Refactoring Priority

When updating pages:

Always prioritize:

1) Hook replacement
2) Import cleanup
3) Data mapping
4) State removal
5) Code cleanup

Never redesign components.

---

## Final Verification Rule

Before finishing:

Ensure:

The page uses the new hook from:

/client/hooks/

and does not reference:

contextReducer
legacy hooks
direct API calls