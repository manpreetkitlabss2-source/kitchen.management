# Backend-First Data Architecture Rules

## Core Principle

Always treat the backend as the source of truth for data.

Never load or manage large datasets entirely in frontend global state.

---

## Data Fetching Rules

Always:

- Fetch data from backend APIs
- Use server-side pagination
- Request only the required dataset per page
- Use database joins or aggregations to combine related data
- Return optimized response payloads

Never:

- Fetch entire database collections to frontend
- Store large paginated datasets in global state
- Perform heavy filtering on frontend
- Duplicate database logic in React components

---

## Backend Query Rules

Source:

Always refer to:

/backend/src

When generating database logic:

- Use joins or aggregations instead of multiple queries
- Use indexed fields for filtering
- Use pagination
- Use limit and offset or cursor pagination
- Optimize queries before modifying frontend

---

## Pagination Rules

Always implement:

Server-side pagination

Required fields:

page
limit
total
data

Response format:

{
  data: [],
  page: number,
  limit: number,
  total: number
}

Never:

- Return full datasets
- Handle pagination purely on frontend
- Store paginated results globally

---

## Caching Rules

Always:

- Cache frequently accessed queries
- Cache lookup tables
- Use query keys

Never:

- Cache large paginated datasets globally
- Cache user-specific dynamic datasets unnecessarily

---

## Frontend State Management Rules

Global state should only store:

- UI state
- authentication
- filters
- selected items
- small datasets

Never store:

- full paginated datasets
- large collections
- database records across multiple pages

---

## Hook Rules

Always use custom hooks for data fetching.

Example pattern:

useUsers()
useConsumpation()
useWaste()

Hooks must: 

- call backend APIs
- support pagination
- support loading state
- support error handling
- support refetch

Never:

- fetch data directly inside components
- manage database logic in reducers
- store large datasets in contextReducer

---

## File Placement Rules

Backend:

New queries:

/backend/src/services/

New controllers:

/backend/src/controllers/

New database models:

/backend/src/models/

Frontend:

Hooks:

/client/hooks/

API clients:

/client/src/api/

Components:

/client/src/components/

---

## Workflow Rule (Critical)

Always modify backend logic first.

Only after backend response structure is finalized:

Then update frontend hooks and components.

Never:

Change frontend before backend API is confirmed.

---

## Performance Priority Rule

When optimizing performance:

Always optimize in this order:

1) Database query
2) API response size
3) Pagination
4) Caching
5) Frontend rendering

Never optimize frontend before backend query performance.

---

## Deprecated Pattern Rule

Do not use:

contextReducer for storing paginated datasets

Only use contextReducer for:

- UI state
- auth state
- filters
- theme