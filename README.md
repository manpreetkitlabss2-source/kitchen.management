# Kitchen Pro — Restaurant Management System

A production-grade internal operations platform for restaurants to manage kitchen inventory, track ingredient consumption, monitor wastage, and receive real-time stock alerts.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Problem Statement](#problem-statement)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Folder Structure](#folder-structure)
- [Database Design](#database-design)
- [Database Setup & Seed Data](#database-setup--seed-data)
- [API Documentation](#api-documentation)
- [Setup Instructions](#setup-instructions)
- [Environment Configuration](#environment-configuration)
- [Demo Credentials](#demo-credentials)
- [Notification Behaviour](#notification-behaviour)

---

## Project Overview

Kitchen Pro is a full-stack restaurant management system built for admin/manager use. It provides a centralized dashboard to track ingredient stock levels, map ingredients to recipes, log consumption when dishes are prepared, record waste with reasons, and receive automated low-stock and out-of-stock notifications.

The system is designed with a backend-first architecture — all data aggregation, filtering, and pagination happens on the server. The frontend consumes minimal, pre-shaped API responses.

---

## Problem Statement

Restaurants lose significant revenue due to:

- **Untracked ingredient usage** — no visibility into what gets consumed per dish
- **Unmonitored wastage** — spoiled or overcooked ingredients go unrecorded
- **Manual stock checks** — managers discover stockouts only when cooking starts
- **No analytics** — no data to make purchasing or menu decisions

Kitchen Pro solves all of these with automated deduction, waste logging, threshold alerts, and a live analytics dashboard.

---

## Key Features

### Authentication
- JWT-based login and signup
- Single admin/manager role
- All inventory routes protected via middleware
- Passwords hashed with bcrypt

### Ingredient Inventory
- Add ingredients with name, unit, stock quantity, and alert threshold
- Edit stock levels manually
- Server-side paginated ingredient list
- Status indicators: In Stock / Low Stock / Out of Stock

### Recipe Management
- Create dishes and map required ingredients with quantities
- Ingredient names resolved via database joins (no raw IDs on frontend)
- Paginated recipe list

### Consumption Tracking
- Two modes: **Recipe mode** (auto-populates ingredients from recipe) and **Manual mode** (free-form entry)
- Preparing a dish automatically deducts all mapped ingredient quantities from stock
- Full transaction support — if any ingredient is insufficient, the entire operation rolls back
- Paginated consumption history with ingredient and recipe names resolved

### Waste Management
- Log wasted ingredients with quantity and reason (Expired, Spoiled, Overcooked, Damaged, Other)
- Automatically deducts from stock
- Paginated waste history

### Notification System
- Scan stock levels on demand via "Scan Stock" button
- Generates notifications when `current_stock < threshold_value` (low stock) or `current_stock = 0` (out of stock)
- Deduplication: one notification per ingredient per type — marking as read silences it until stock recovers and drops again
- Bell icon badge in header shows live unread count (polls every 60 seconds)
- Mark individual or all notifications as read

### Dashboard & Analytics
- Single optimized aggregation query — no multiple round trips
- Inventory health doughnut chart (Healthy / Low / Out of Stock)
- Top stock levels horizontal bar chart
- Consumption vs Waste volume bar chart
- Critical low stock table (top 5 items needing action)
- Summary cards: total ingredients, low stock count, out of stock count, total waste volume

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router v7, Tailwind CSS v4 |
| Charts | Chart.js 4, react-chartjs-2 |
| Icons | Lucide React |
| Backend | Node.js, Express 5 |
| Database | MongoDB (Mongoose 9) |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Dev Server | Nodemon, Vite 8 |

---

## Architecture

```
Client (React)
  └── /client/hooks/          ← Custom hooks (local state, no global store for data)
  └── /client/services/   ← Axios API clients
  └── /client/app/components/ ← Page components consume hooks only

Backend (Express)
  └── routes/      ← Route definitions
  └── controllers/ ← Request/response handling
  └── services/    ← All business logic and DB queries
  └── models/      ← Mongoose schemas
```

**Backend-first data rules:**
- All filtering, sorting, and pagination runs on the server
- Frontend receives only the current page slice
- No full collections are loaded into frontend state
- Dashboard data is pre-aggregated — one API call returns all metrics

---

## Folder Structure

```
management-system/
├── backend/
│   └── src/
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── inventoryController.js
│       │   └── notificationController.js
│       ├── middleware/
│       │   └── authMiddleware.js
│       ├── models/
│       │   ├── Ingredient.js
│       │   ├── Logs.js
│       │   ├── Notification.js
│       │   ├── Recipe.js
│       │   └── User.js
│       ├── routes/
│       │   ├── authRoutes.js
│       │   ├── inventoryRoutes.js
│       │   └── notificationRoutes.js
│       ├── services/
│       │   ├── authService.js
│       │   ├── InventoryService.js
│       │   └── NotificationService.js
│       └── app.js
│
└── client/
    ├── app/
    │   ├── components/
    │   │   ├── auth/
    │   │   │   ├── Login.jsx
    │   │   │   └── Signup.jsx
    │   │   ├── dashboard/
    │   │   │   ├── AdminLayout.jsx
    │   │   │   ├── DashboardPage.jsx
    │   │   │   ├── IngredientPage.jsx
    │   │   │   ├── RecipePage.jsx
    │   │   │   ├── ConsumptionPage.jsx
    │   │   │   └── WasteManagementPage.jsx
    │   │   ├── notifications/
    │   │   │   ├── NotificationBell.jsx
    │   │   │   └── NotificationsPage.jsx
    │   │   └── utils/
    │   │       ├── GlobalTable.jsx
    │   │       └── FloatingFormCard.jsx
    │   ├── services/
    │   │   ├── axiosAuth.js
    │   │   ├── dashboard.js
    │   │   └── notifications.js
    │   └── routes.ts
    └── hooks/
        ├── useIngredients.js
        ├── useRecipes.js
        ├── useConsumption.js
        ├── useWaste.js
        ├── useDashboard.js
        └── useNotifications.js
```

---

## Database Design

This project uses **MongoDB** (schema-less NoSQL). No SQL migration files are needed. Mongoose handles collection creation automatically on first run.

### `users`
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Auto-generated |
| `name` | String | Required |
| `restaurantName` | String | Required |
| `email` | String | Unique |
| `password` | String | bcrypt hashed |
| `role` | String | `admin` (default) |

### `ingredients`
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Auto-generated |
| `name` | String | Required |
| `unit` | String | `kg`, `liters`, `pieces`, `grams`, `ml` |
| `current_stock` | Number | Default 0 |
| `threshold_value` | Number | Default 10, triggers alerts |

### `recipes`
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Auto-generated |
| `name` | String | Required |
| `ingredients` | Array | `[{ ingredient_id, quantity_required }]` |

### `logs` (consumption + waste unified)
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Auto-generated |
| `type` | String | `consumption` or `waste` |
| `ingredient_id` | ObjectId | Ref: Ingredient |
| `recipe_id` | ObjectId | Ref: Recipe, nullable |
| `quantity` | Number | Required |
| `reason` | String | Waste logs only |
| `created_at` | Date | Auto |

### `notifications`
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Auto-generated |
| `ingredient_id` | ObjectId | Ref: Ingredient |
| `type` | String | `low_stock` or `out_of_stock` |
| `message` | String | Human-readable alert text |
| `is_read` | Boolean | Default false |
| `created_at` | Date | Auto |

Unique index on `(ingredient_id, type)` — one notification per ingredient per alert type.

---

## Database Setup & Seed Data

### Setup

MongoDB collections are created automatically by Mongoose when the backend starts. No migration scripts or SQL files are required.

1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a database user with read/write access
3. Whitelist your IP address (or use `0.0.0.0/0` for development)
4. Copy the connection string into `backend/.env` as `MONGO_URI`

The backend will connect and create all collections on first request.

### Seed Data

Use the following API calls (via Postman or curl) after creating an admin account to populate the database with realistic data.

**Step 1 — Create admin account**
```bash
POST /api/auth/signup
{
  "name": "Admin User",
  "restaurantName": "Kitchen Pro Demo",
  "email": "admin@kitchenpro.com",
  "password": "admin123"
}
```
Save the returned `token` — all subsequent requests require it as `Authorization: Bearer <token>`.

**Step 2 — Seed ingredients**
```bash
POST /api/ingredients   # repeat for each ingredient below

{ "name": "Tomato",        "unit": "kg",     "currentStock": 15,  "minThreshold": 5  }
{ "name": "Mozzarella",    "unit": "kg",     "currentStock": 8,   "minThreshold": 3  }
{ "name": "Pizza Dough",   "unit": "pieces", "currentStock": 20,  "minThreshold": 10 }
{ "name": "Olive Oil",     "unit": "liters", "currentStock": 4,   "minThreshold": 2  }
{ "name": "Basil",         "unit": "grams",  "currentStock": 200, "minThreshold": 50 }
{ "name": "Chicken",       "unit": "kg",     "currentStock": 10,  "minThreshold": 4  }
{ "name": "Pasta",         "unit": "kg",     "currentStock": 6,   "minThreshold": 2  }
{ "name": "Cream",         "unit": "liters", "currentStock": 3,   "minThreshold": 1  }
{ "name": "Garlic",        "unit": "grams",  "currentStock": 300, "minThreshold": 80 }
{ "name": "Parmesan",      "unit": "grams",  "currentStock": 400, "minThreshold": 100}
{ "name": "Beef Mince",    "unit": "kg",     "currentStock": 5,   "minThreshold": 2  }
{ "name": "Burger Bun",    "unit": "pieces", "currentStock": 30,  "minThreshold": 10 }
{ "name": "Lettuce",       "unit": "pieces", "currentStock": 2,   "minThreshold": 5  }
{ "name": "Cheddar",       "unit": "grams",  "currentStock": 0,   "minThreshold": 100}
```
> Note: Lettuce and Cheddar are intentionally low/out-of-stock to demonstrate alerts.

**Step 3 — Seed recipes**

First collect the `_id` values returned from the ingredient seed calls, then:
```bash
POST /api/recipe

# Margherita Pizza
{
  "name": "Margherita Pizza",
  "ingredientsMap": [
    { "ingredient_id": "<tomato_id>",      "quantity_required": 0.2 },
    { "ingredient_id": "<mozzarella_id>",  "quantity_required": 0.15 },
    { "ingredient_id": "<pizza_dough_id>", "quantity_required": 1 },
    { "ingredient_id": "<olive_oil_id>",   "quantity_required": 0.05 },
    { "ingredient_id": "<basil_id>",       "quantity_required": 5 }
  ]
}

# Chicken Pasta
{
  "name": "Chicken Pasta",
  "ingredientsMap": [
    { "ingredient_id": "<chicken_id>",  "quantity_required": 0.3 },
    { "ingredient_id": "<pasta_id>",    "quantity_required": 0.2 },
    { "ingredient_id": "<cream_id>",    "quantity_required": 0.1 },
    { "ingredient_id": "<garlic_id>",   "quantity_required": 10 },
    { "ingredient_id": "<parmesan_id>", "quantity_required": 30 }
  ]
}

# Classic Burger
{
  "name": "Classic Burger",
  "ingredientsMap": [
    { "ingredient_id": "<beef_mince_id>",  "quantity_required": 0.2 },
    { "ingredient_id": "<burger_bun_id>",  "quantity_required": 1 },
    { "ingredient_id": "<lettuce_id>",     "quantity_required": 1 },
    { "ingredient_id": "<cheddar_id>",     "quantity_required": 40 }
  ]
}
```

**Step 4 — Seed consumption logs**
```bash
POST /api/consumption/prepare
{ "recipe_id": "<margherita_pizza_id>", "items": [...] }

POST /api/consumption/prepare
{ "recipe_id": "<chicken_pasta_id>", "items": [...] }
```

**Step 5 — Seed waste logs**
```bash
POST /api/waste
{ "ingredientId": "<tomato_id>",   "quantity": 0.5, "reason": "Expired"    }
{ "ingredientId": "<lettuce_id>",  "quantity": 1,   "reason": "Spoiled"    }
{ "ingredientId": "<chicken_id>",  "quantity": 0.3, "reason": "Overcooked" }
```

**Step 6 — Generate notifications**
```bash
POST /api/notifications/scan
```
This will create low-stock and out-of-stock alerts for Lettuce and Cheddar automatically.

---

## API Documentation

All routes except `/api/auth/*` require:
```
Authorization: Bearer <token>
```

---

### Auth — `/api/auth`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register new admin |
| POST | `/api/auth/login` | Login and receive JWT |

#### POST `/api/auth/signup`
```json
Body:     { "name": "string", "restaurantName": "string", "email": "string", "password": "string" }
Response: { "TOKEN_KEY": "string", "success": true }
```

#### POST `/api/auth/login`
```json
Body:     { "email": "string", "password": "string" }
Response: { "TOKEN_KEY": "string", "success": true, "user": { "id", "name", "role" } }
```

---

### Ingredients — `/api/ingredients`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/ingredients?page=1&limit=10` | Paginated ingredient list |
| POST | `/api/ingredients` | Add new ingredient |
| PUT | `/api/ingredients` | Update existing ingredient |

#### GET `/api/ingredients?page=1&limit=10`
```json
Response: { "data": [...], "page": 1, "limit": 10, "total": 42 }
```

#### POST `/api/ingredients`
```json
Body:     { "name": "Tomato", "unit": "kg", "currentStock": 20, "minThreshold": 5 }
Response: { ingredient object }
```

#### PUT `/api/ingredients`
```json
Body:     { "_id": "...", "name": "Tomato", "unit": "kg", "current_stock": 15, "threshold_value": 5 }
Response: { updated ingredient object }
```

---

### Recipes — `/api/recipe`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/recipe?page=1&limit=10` | Paginated recipe list with populated ingredients |
| POST | `/api/recipe` | Create new recipe with ingredient mapping |

#### GET `/api/recipe?page=1&limit=10`
```json
Response: { "data": [...], "page": 1, "limit": 10, "total": 5 }
```

#### POST `/api/recipe`
```json
Body: {
  "name": "Margherita Pizza",
  "ingredientsMap": [
    { "ingredient_id": "...", "quantity_required": 200 }
  ]
}
Response: { recipe object }
```

---

### Consumption — `/api/consumption`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/consumption?page=1&limit=10` | Paginated consumption history |
| POST | `/api/consumption/prepare` | Prepare dish and deduct stock (transactional) |

#### GET `/api/consumption?page=1&limit=10`
```json
Response: { "data": [...], "page": 1, "limit": 10, "total": 30 }
```

#### POST `/api/consumption/prepare`
```json
Body: {
  "recipe_id": "...",
  "items": [{ "ingredient_id": "...", "quantity_required": 200 }]
}
Response: { "message": "Stock deducted successfully", "result": [...] }
```
> Runs inside a MongoDB transaction. If any ingredient has insufficient stock the entire operation rolls back.

---

### Waste — `/api/waste`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/waste?page=1&limit=10` | Paginated waste history |
| POST | `/api/waste` | Log waste and deduct from stock |

#### GET `/api/waste?page=1&limit=10`
```json
Response: { "data": [...], "page": 1, "limit": 10, "total": 15 }
```

#### POST `/api/waste`
```json
Body:     { "ingredientId": "...", "quantity": 2.5, "reason": "Expired" }
Response: { waste log object }
```

---

### Dashboard — `/api/dashboard`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard` | Single aggregated analytics response |

#### GET `/api/dashboard`
```json
Response: {
  "summary": {
    "totalIngredients": 14,
    "lowStockCount": 3,
    "outOfStockCount": 1,
    "totalConsumption": 450.5,
    "totalWaste": 12.3
  },
  "recent": {
    "lowStockItems": [...],
    "topWaste": [...]
  },
  "metrics": {
    "topStock": [...],
    "consumptionTotal": 450.5,
    "wasteTotal": 12.3
  }
}
```
> Single query — two parallel `$facet` aggregation pipelines over `ingredients` and `logs` collections.

---

### Notifications — `/api/notifications`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/notifications/scan` | Scan all ingredients and generate alerts |
| GET | `/api/notifications?page=1&limit=20` | Paginated notification list |
| GET | `/api/notifications/unread-count` | Unread badge count |
| PATCH | `/api/notifications/:id/read` | Mark single notification as read |
| PATCH | `/api/notifications/read-all` | Mark all notifications as read |

#### POST `/api/notifications/scan`
```json
Response: { "success": true }
```

#### GET `/api/notifications?page=1&limit=20`
```json
Response: { "data": [...], "page": 1, "limit": 20, "total": 8 }
```

#### GET `/api/notifications/unread-count`
```json
Response: { "count": 4 }
```

#### PATCH `/api/notifications/:id/read`
```json
Response: { updated notification object }
```

#### PATCH `/api/notifications/read-all`
```json
Response: { "success": true }
```

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB instance)

### 1. Clone the repository
```bash
git clone <repo-url>
cd management-system
```

### 2. Backend setup
```bash
cd backend
npm install
cp .env.example .env   # then fill in your values
npm run dev
# Server runs on http://localhost:5000
```

### 3. Frontend setup
```bash
cd client
npm install
cp .env.example .env   # set VITE_API_BASE_URL=http://localhost:5000/api
npm run dev
# App runs on http://localhost:5173
```

Both servers must be running simultaneously. Open two terminal tabs.

---

## Environment Configuration

### `backend/.env`
```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/<dbname>
JWT_SECRET=your_jwt_secret_here
PORT=5000
```

### `client/.env`
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## Demo Credentials

```
Email:    admin@kitchenpro.com
Password: admin123
```

> If the database is fresh, register via `/signup` or `POST /api/auth/signup` first, then run the seed steps above.

---

## Notification Behaviour

The notification system uses a scan-on-demand model:

1. Click **Scan Stock** on the Notifications page
2. The backend checks every ingredient against its threshold
3. Notifications are created for breaches — deduplicated by `(ingredient_id, type)`
4. Marking a notification as read silences it permanently for that breach cycle
5. When stock recovers above threshold the notification is deleted — so if stock drops again later a fresh notification fires correctly
6. The bell badge polls `/unread-count` every 60 seconds automatically
