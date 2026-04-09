# API Response Changes — backend_mysql Alignment

All changes are in `backend_mysql/` only. `client/` and `backend/` were not modified.

---

## Summary of Root Cause

MySQL uses auto-increment integer `id` fields. The frontend was built against the MongoDB backend which uses `_id` (ObjectId string). Every response that returns a record or nested record must expose `_id` (string) instead of `id` (integer) for the frontend to work without modification.

---

## Change 1 — POST `/api/auth/signup`

**File:** `src/controllers/authController.js`

**Old Response:**
```json
{ "message": "Admin created successfully", "user": { "TOKEN_KEY": "...", "success": true } }
```

**New Response:**
```json
{ "TOKEN_KEY": "...", "success": true }
```

**Reason:** `axiosAuth.js` reads `response.data.token` directly. The old response wrapped the result in a `user` key, hiding the token. Now the service result is passed through directly.

---

## Change 2 — POST `/api/ingredients`

**File:** `src/services/InventoryService.js` → `addIngredient()`

**Old Response:**
```json
[{ "id": 1, "name": "Tomato", "unit": "kg", "current_stock": 15, "threshold_value": 5 }]
```

**New Response:**
```json
{ "_id": "1", "name": "Tomato", "unit": "kg", "current_stock": 15, "threshold_value": 5 }
```

**Reason:** Frontend uses `ing._id` as the key in dropdowns and edit payloads. Was returning an array with `id` integer.

---

## Change 3 — PUT `/api/ingredients`

**File:** `src/services/InventoryService.js` → `editIngredient()`

**Old Behaviour:** Extracted `id` from payload. Frontend sends `_id`.

**New Behaviour:** Extracts both `_id` and `id`, resolves to whichever is present (`_id` takes priority). Returns shaped object with `_id` string.

**Old Response:**
```json
[{ "id": 1, "name": "Tomato", ... }]
```

**New Response:**
```json
{ "_id": "1", "name": "Tomato", "unit": "kg", "current_stock": 15, "threshold_value": 5 }
```

**Reason:** `IngredientPage` sends `{ _id: editingIngredient._id, ... }` in the update payload.

---

## Change 4 — GET `/api/ingredients`

**File:** `src/services/InventoryService.js` → `getAllIngredients()`

**Old Response:**
```json
{ "data": [{ "id": "1", "name": "Tomato", ... }], "page": 1, "limit": 10, "total": 14 }
```

**New Response:**
```json
{ "data": [{ "_id": "1", "name": "Tomato", "unit": "kg", "current_stock": 15, "threshold_value": 5 }], "page": 1, "limit": 10, "total": 14 }
```

**Reason:** `IngredientPage` accesses `item._id`, `item.current_stock`, `item.threshold_value`. `WasteManagementPage` uses `ing._id` as option value. `ConsumptionPage` uses `ing._id || ing.id` — now consistently `_id`.

---

## Change 5 — POST `/api/recipe`

**File:** `src/services/InventoryService.js` → `createRecipe()`

**Old Response:**
```json
[{ "id": 3, "name": "Margherita Pizza" }]
```

**New Response:**
```json
{ "_id": "3", "name": "Margherita Pizza" }
```

**Reason:** Frontend refreshes the recipe list after creation — the response itself is not directly consumed by field, but consistency with `_id` is required.

---

## Change 6 — GET `/api/recipe`

**File:** `src/services/InventoryService.js` → `getAllRecipes()`

**Old Response:**
```json
{
  "data": [{
    "id": "1",
    "name": "Margherita Pizza",
    "ingredients": [{
      "ingredient_id": { "id": "2", "name": "Tomato", "unit": "kg" },
      "quantity_required": 0.2
    }]
  }]
}
```

**New Response:**
```json
{
  "data": [{
    "_id": "1",
    "name": "Margherita Pizza",
    "ingredients": [{
      "ingredient_id": { "_id": "2", "name": "Tomato", "unit": "kg" },
      "quantity_required": 0.2
    }]
  }]
}
```

**Reason:**
- `RecipePage` uses `r._id || r.id` as option value — now consistently `_id`
- `ConsumptionPage` reads `item.ingredient_id?._id` to populate consumption items
- Null ingredient rows from LEFT JOIN are filtered out

---

## Change 7 — GET `/api/consumption`

**File:** `src/services/InventoryService.js` → `getConsumptionLogs()`

**Old Response:**
```json
{
  "data": [{
    "id": 5,
    "quantity": "0.2",
    "ingredient_id": "{\"id\":2,\"name\":\"Tomato\",\"unit\":\"kg\"}",
    "recipe_id": "{\"id\":1,\"name\":\"Margherita Pizza\"}"
  }]
}
```

**New Response:**
```json
{
  "data": [{
    "_id": "5",
    "quantity": 0.2,
    "created_at": "2024-01-01T10:00:00.000Z",
    "ingredient_id": { "_id": "2", "name": "Tomato", "unit": "kg" },
    "recipe_id": { "_id": "1", "name": "Margherita Pizza" }
  }]
}
```

**Reason:**
- `ConsumptionPage` reads `log.ingredient_id?.name`, `log.ingredient_id?.unit`, `log.recipe_id?.name`
- MySQL returns `JSON_OBJECT` as a raw string — now parsed and reshaped with `_id`
- `quantity` cast to Number (was string from MySQL DECIMAL)

---

## Change 8 — POST `/api/waste`

**File:** `src/services/InventoryService.js` → `recordWaste()`

**Old Response:**
```json
[{ "id": 7, "type": "waste", "ingredient_id": 3, "quantity": 0.5, "reason": "Expired" }]
```

**New Response:**
```json
{ "_id": "7", "type": "waste", "ingredient_id": 3, "quantity": 0.5, "reason": "Expired" }
```

**Reason:** Consistent `_id` on mutation responses. Was returning an array.

---

## Change 9 — GET `/api/waste`

**File:** `src/services/InventoryService.js` → `getWasteLogs()`

**Old Response:**
```json
{
  "data": [{
    "id": 7,
    "quantity": "0.5",
    "ingredient_id": "{\"id\":3,\"name\":\"Lettuce\",\"unit\":\"pieces\"}"
  }]
}
```

**New Response:**
```json
{
  "data": [{
    "_id": "7",
    "quantity": 0.5,
    "reason": "Expired",
    "created_at": "2024-01-01T10:00:00.000Z",
    "ingredient_id": { "_id": "3", "name": "Lettuce", "unit": "pieces" }
  }]
}
```

**Reason:**
- `WasteManagementPage` reads `log.ingredient_id?.name`, `log.ingredient_id?.unit`
- `uniqueItems` Set uses `log.ingredient_id?._id`
- MySQL JSON string parsed and reshaped with `_id`
- `quantity` cast to Number

---

## Change 10 — GET `/api/notifications`

**File:** `src/services/NotificationService.js` → `getNotifications()`

**Old Response:**
```json
{
  "data": [{
    "id": 1,
    "type": "low_stock",
    "is_read": 0,
    "ingredient_id": "{\"id\":13,\"name\":\"Lettuce\",...}"
  }]
}
```

**New Response:**
```json
{
  "data": [{
    "_id": "1",
    "type": "low_stock",
    "message": "Lettuce is running low...",
    "is_read": false,
    "created_at": "2024-01-01T10:00:00.000Z",
    "ingredient_id": { "_id": "13", "name": "Lettuce", "unit": "pieces", "current_stock": 2, "threshold_value": 5 }
  }]
}
```

**Reason:**
- `NotificationsPage` uses `notif._id` as React key and in `markRead(notif._id)`
- `useNotifications` hook compares `n._id === id` in optimistic update
- `is_read` was MySQL TINYINT (0/1) — now cast to boolean
- `ingredient_id` JSON string parsed and reshaped with `_id`

---

## Change 11 — PATCH `/api/notifications/:id/read`

**File:** `src/services/NotificationService.js` → `markAsRead()`

**Old Response:**
```json
{ "id": 1, "type": "low_stock", "is_read": 1, ... }
```

**New Response:**
```json
{ "_id": "1", "type": "low_stock", "message": "...", "is_read": true, "created_at": "..." }
```

**Reason:** `is_read` must be boolean. `_id` required for consistency.

---

## No Changes Required

| Endpoint | Reason |
|---|---|
| `POST /api/auth/login` | Already returns `{ token, success, user: { id, name, role } }` — frontend only reads `token` and `user.name` |
| `GET /api/dashboard` | Already returns correct `summary`, `recent`, `metrics` shape |
| `POST /api/notifications/scan` | Returns `{ success: true }` — correct |
| `GET /api/notifications/unread-count` | Returns `{ count: N }` — correct |
| `PATCH /api/notifications/read-all` | Returns `{ success: true }` — correct |
| `POST /api/consumption/prepare` | Returns `{ message, result }` — frontend does not read result fields |
