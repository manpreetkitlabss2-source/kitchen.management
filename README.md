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
- [API Documentation](#api-documentation)
- [Setup Instructions](#setup-instructions)
- [Environment Configuration](#environment-configuration)
- [Running Tests](#running-tests)
- [Docker](#docker)
- [Demo Credentials](#demo-credentials)

---

## Project Overview

Kitchen Pro is a full-stack restaurant management system built for admin and multi-role team use. It provides a centralized dashboard to track ingredient stock levels, manage ingredient batches with expiry dates, map ingredients to recipes, log consumption when dishes are prepared, record waste with reasons, and receive automated low-stock and out-of-stock notifications.

The system is designed with a backend-first architecture — all data aggregation, filtering, and pagination happens on the server. The frontend consumes minimal, pre-shaped API responses.

---

## Problem Statement

Restaurants lose significant revenue due to:

- **Untracked ingredient usage** — no visibility into what gets consumed per dish
- **Unmonitored wastage** — spoiled or overcooked ingredients go unrecorded
- **Manual stock checks** — managers discover stockouts only when cooking starts
- **No analytics** — no data to make purchasing or menu decisions
- **Single-role systems** — no way to control what staff can see or do

Kitchen Pro solves all of these with automated deduction, batch tracking, waste logging, role-based access, threshold alerts, and a live analytics dashboard.

---

## Key Features

### Authentication & Access Control
- JWT-based login and signup
- Role-based access control (RBAC): Admin, Manager, Chef, Inventory Staff
- All routes protected via auth and role middleware
- Passwords hashed with bcrypt

### Ingredient Inventory
- Add ingredients with name, unit, stock quantity, and alert threshold
- Edit stock levels manually
- Server-side paginated ingredient list
- Status indicators: In Stock / Low Stock / Out of Stock
- Soft delete support

### Batch Management
- Track ingredient stock as individual batches with expiry dates
- FIFO consumption — oldest batch deducted first
- Expiry alerts for batches nearing their expiry date
- Stock level auto-recalculated from active batches

### Recipe Management
- Create dishes and map required ingredients with quantities
- Ingredient names resolved via database joins
- Paginated recipe list

### Consumption & Order Tracking
- Place orders that auto-deduct ingredient stock via FIFO batch logic
- Full transaction support — if any ingredient is insufficient, the entire operation rolls back
- Paginated consumption and order history

### Waste Management
- Log wasted ingredients with quantity and reason (Expired, Spoiled, Overcooked, Damaged, Other)
- Automatically deducts from stock
- Paginated waste history

### Notification System
- Scan stock levels on demand via "Scan Stock" button
- Generates notifications when `current_stock < threshold_value` (low stock) or `current_stock = 0` (out of stock)
- Deduplication: one notification per ingredient per type
- Bell icon badge shows live unread count (polls every 60 seconds)
- Mark individual or all notifications as read

### Dashboard & Analytics
- Single optimized aggregation query — no multiple round trips
- Inventory health overview
- Consumption vs Waste volume comparison
- Critical low stock table
- Summary cards: total ingredients, low stock count, out of stock count, total waste volume

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router v7, Tailwind CSS v4 |
| Charts | Chart.js 4, react-chartjs-2 |
| Icons | Lucide React |
| Backend | Node.js, Express 5 |
| Database | MySQL (mysql2, Aiven Cloud) |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Dev Server | Nodemon, Vite |
| Containerisation | Docker |
| Testing | Jest 29, Supertest, React Testing Library |

---

## Architecture

```
Client (React)
  ├── /client/hooks/           ← Custom hooks (local state, no global store)
  ├── /client/services/        ← Axios API clients
  └── /client/app/components/  ← Page components consume hooks only

Backend (Express + MySQL)
  ├── routes/       ← Route definitions
  ├── controllers/  ← Request/response handling
  ├── services/     ← All business logic and DB queries
  ├── models/       ← Query helpers per entity
  ├── middleware/   ← Auth + RBAC middleware
  └── config/       ← DB pool, table setup, role definitions
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
├── backend_mysql/              ← Active backend (MySQL)
│   └── src/
│       ├── config/
│       │   ├── db.js           ← MySQL connection pool
│       │   ├── tables.js       ← Schema setup on startup
│       │   └── roles.js        ← RBAC role definitions
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── inventoryController.js
│       │   ├── batchController.js
│       │   ├── notificationController.js
│       │   └── userController.js
│       ├── middleware/
│       │   ├── authMiddleware.js
│       │   └── rbacMiddleware.js
│       ├── models/
│       │   ├── Ingredient.js
│       │   ├── Logs.js
│       │   ├── Notification.js
│       │   ├── Recipe.js
│       │   └── User.js
│       ├── routes/
│       │   ├── authRoutes.js
│       │   ├── inventoryRoutes.js
│       │   ├── batchRoutes.js
│       │   ├── notificationRoutes.js
│       │   └── userRoutes.js
│       ├── services/
│       │   ├── authService.js
│       │   ├── InventoryService.js
│       │   ├── batchService.js
│       │   ├── NotificationService.js
│       │   └── userService.js
│       ├── app.js              ← Express app (no server binding)
│       └── server.js           ← Entry point (DB setup + listen)
│
├── client/                     ← React frontend
│   ├── app/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── batch/
│   │   │   ├── notifications/
│   │   │   └── utils/
│   │   └── routes.ts
│   ├── hooks/
│   └── services/
│
└── tests/                      ← Standalone test suite
    ├── backend/
    │   └── unit/               ← Service tests with mocked DB
    ├── frontend/               ← React Testing Library component tests
    └── setup/                  ← Jest config, env, global teardown
```

---

## Database Design

This project uses **MySQL**. Tables are created automatically by `setupDatabase()` on first server start. No manual migration is required for development.

### `users`
| Field | Type | Notes |
|---|---|---|
| `id` | INT | Auto-increment PK |
| `name` | VARCHAR | Required |
| `restaurantName` | VARCHAR | Required |
| `email` | VARCHAR | Unique |
| `password` | VARCHAR | bcrypt hashed |
| `role` | ENUM | `admin`, `manager`, `chef`, `inventory_staff` |
| `restaurant_id` | INT | Self-referencing for admin grouping |
| `deleted_at` | DATETIME | Soft delete |

### `ingredients`
| Field | Type | Notes |
|---|---|---|
| `id` | INT | Auto-increment PK |
| `name` | VARCHAR | Required |
| `unit` | ENUM | `kg`, `liters`, `pieces`, `grams`, `ml` |
| `current_stock` | DECIMAL | Recalculated from batches |
| `threshold_value` | DECIMAL | Triggers low-stock alerts |
| `restaurant_id` | INT | FK → users |
| `deleted_at` | DATETIME | Soft delete |

### `ingredient_batches`
| Field | Type | Notes |
|---|---|---|
| `id` | INT | Auto-increment PK |
| `ingredient_id` | INT | FK → ingredients |
| `quantity` | DECIMAL | Remaining quantity in batch |
| `expiry_date` | DATE | Used for FIFO and expiry alerts |
| `status` | ENUM | `active`, `depleted`, `expired` |

### `recipes`
| Field | Type | Notes |
|---|---|---|
| `id` | INT | Auto-increment PK |
| `name` | VARCHAR | Required |
| `restaurant_id` | INT | FK → users |

### `recipe_ingredients`
| Field | Type | Notes |
|---|---|---|
| `recipe_id` | INT | FK → recipes |
| `ingredient_id` | INT | FK → ingredients |
| `quantity_required` | DECIMAL | Per-dish quantity |

### `logs`
| Field | Type | Notes |
|---|---|---|
| `id` | INT | Auto-increment PK |
| `type` | ENUM | `consumption` or `waste` |
| `ingredient_id` | INT | FK → ingredients |
| `recipe_id` | INT | FK → recipes, nullable |
| `quantity` | DECIMAL | Required |
| `reason` | VARCHAR | Waste logs only |
| `created_at` | DATETIME | Auto |

### `notifications`
| Field | Type | Notes |
|---|---|---|
| `id` | INT | Auto-increment PK |
| `ingredient_id` | INT | FK → ingredients |
| `type` | ENUM | `low_stock` or `out_of_stock` |
| `message` | VARCHAR | Human-readable alert text |
| `is_read` | TINYINT | Default 0 |
| `created_at` | DATETIME | Auto |

Unique constraint on `(ingredient_id, type, restaurant_id)` — one notification per ingredient per alert type per restaurant.

---

## API Documentation

All routes except `/api/auth/*` require:
```
Authorization: Bearer <token>
```

### Auth — `/api/auth`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register new admin |
| POST | `/api/auth/login` | Login and receive JWT |
| GET | `/api/auth/me` | Get authenticated user profile |

### Ingredients — `/api/ingredients`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/ingredients?page=1&limit=10` | Paginated ingredient list |
| POST | `/api/ingredients` | Add new ingredient |
| PUT | `/api/ingredients` | Update existing ingredient |
| DELETE | `/api/ingredients/:id` | Soft-delete ingredient |

### Batches — `/api/batches`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/batches?page=1&limit=10` | Paginated batch list |
| GET | `/api/batches/expiring?days=7` | Batches expiring within N days |
| GET | `/api/batches/:id` | Single batch detail |
| GET | `/api/batches/ingredient/:id` | Batches for one ingredient |
| POST | `/api/batches` | Add new batch |
| PUT | `/api/batches/:id` | Update batch |
| DELETE | `/api/batches/:id` | Delete batch |

### Recipes — `/api/recipe`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/recipe?page=1&limit=10` | Paginated recipe list |
| POST | `/api/recipe` | Create new recipe |

### Orders — `/api/orders`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/orders?page=1&limit=10` | Paginated order history |
| POST | `/api/orders` | Place order and deduct stock (transactional) |

### Consumption — `/api/consumption`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/consumption?page=1&limit=10` | Paginated consumption history |
| POST | `/api/consumption/prepare` | Prepare dish and deduct stock |

### Waste — `/api/waste`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/waste?page=1&limit=10` | Paginated waste history |
| POST | `/api/waste` | Log waste and deduct from stock |

### Dashboard — `/api/dashboard`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard` | Single aggregated analytics response |

### Notifications — `/api/notifications`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/notifications/scan` | Scan all ingredients and generate alerts |
| GET | `/api/notifications?page=1&limit=20` | Paginated notification list |
| GET | `/api/notifications/unread-count` | Unread badge count |
| PATCH | `/api/notifications/:id/read` | Mark single notification as read |
| PATCH | `/api/notifications/read-all` | Mark all notifications as read |

### Users — `/api/users`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users` | List sub-users for this restaurant |
| POST | `/api/users/create` | Admin creates a sub-user with a role |
| DELETE | `/api/users/:id` | Hard-delete a sub-user |

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- MySQL instance (local or [Aiven Cloud](https://aiven.io))

### 1. Clone the repository
```bash
git clone <repo-url>
cd management-system
```

### 2. Backend setup
```bash
cd backend_mysql
npm install
cp .env.example .env   # fill in your values
npm run dev
# Server runs on http://localhost:5000
```

### 3. Frontend setup
```bash
cd client
npm install
cp .env.example .env   # set VITE_API_BASE_URL=http://localhost:5000
npm run dev
# App runs on http://localhost:5173
```

Both servers must be running simultaneously.

---

## Environment Configuration

### `backend_mysql/.env`
```env
PORT=5000
DB_HOST=your-mysql-host
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=your-db-name
DB_PORT=3306
JWT_SECRET=your-jwt-secret-min-32-chars
```

### `client/.env`
```env
VITE_API_BASE_URL=http://localhost:5000
```

See `.env.example` in each directory for a full template.

---

## Running Tests

```bash
cd tests
npm install
npm test              # unit + frontend (no DB required)
npm run test:unit     # service logic with mocked DB
npm run test:frontend # React component tests
npm run test:coverage # coverage report
```

> API and integration tests require a live MySQL database. See `tests/README.md` for full setup.

---

## Docker

```bash
# Build the backend image
docker build -t kitchen-pro-backend ./backend_mysql

# Run the container
docker run -p 5000:5000 --env-file ./backend_mysql/.env kitchen-pro-backend
```

- `.env` is loaded at runtime — never baked into the image
- Server available at `http://localhost:5000`

---

## Demo Credentials

```
Email:    admin@kitchenpro.com
Password: admin123
```

> Register via `POST /api/auth/signup` on a fresh database before using these credentials.
