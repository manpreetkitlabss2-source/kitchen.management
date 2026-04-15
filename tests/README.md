# Kitchen Pro — Test Suite

Production-grade test suite for the Kitchen Pro restaurant management system.

---

## Folder Structure

```
tests/
├── setup/
│   ├── jest.config.js      # Jest configuration (multi-project: backend + frontend)
│   ├── testSetup.js        # Global setup — env guard, console suppression
│   └── .env.test           # Test environment variables (never commit real credentials)
│
├── backend/
│   ├── api/                # Supertest HTTP tests against real Express app
│   │   ├── auth.test.js
│   │   ├── batches.test.js
│   │   ├── ingredients.test.js
│   │   ├── notifications.test.js
│   │   ├── orders.test.js
│   │   └── users.test.js
│   │
│   ├── unit/               # Isolated service tests with mocked DB pool
│   │   ├── authService.test.js
│   │   ├── batchService.test.js
│   │   ├── inventoryService.test.js
│   │   ├── roles.test.js
│   │   └── userService.test.js
│   │
│   └── integration/        # End-to-end flows across multiple API calls
│       ├── batchStockFlow.test.js
│       ├── inventoryFlow.test.js
│       └── notificationFlow.test.js
│
├── frontend/
│   └── components/
│       └── Login.test.jsx  # React Testing Library component tests
│
├── utils/
│   ├── testDataFactory.js  # Faker-based payload generators
│   ├── mockUser.js         # JWT token helpers for all roles
│   ├── mockOrder.js        # Order / consumption payload builders
│   ├── dbHelper.js         # Raw SQL helper for direct DB assertions
│   └── __mocks__/
│       └── styleMock.js    # CSS module mock for jsdom
│
├── babel.config.js         # Babel preset for Jest (CommonJS + React JSX)
└── package.json            # Test dependencies and npm scripts
```

---

## Prerequisites

- Node.js 18+
- MySQL running locally (or remote) with a dedicated test database
- The `backend_mysql` server dependencies installed (`cd backend_mysql && npm install`)

---

## Install Test Dependencies

```bash
cd tests
npm install
```

---

## Environment Setup

Copy and fill in `tests/setup/.env.test`:

```env
NODE_ENV=test
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=kitchen_pro_test
DB_PORT=3306
JWT_SECRET=test_jwt_secret_do_not_use_in_production
PORT=5001
```

Create the test database:

```sql
CREATE DATABASE IF NOT EXISTS kitchen_pro_test;
```

The backend's `setupDatabase()` will create all tables on first run.

---

## Running Tests

```bash
# All tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# By category
npm run test:unit
npm run test:api
npm run test:integration
npm run test:frontend

# CI mode (coverage + no watch)
npm run test:ci
```

Run a specific file:

```bash
npx jest --config setup/jest.config.js auth
npx jest --config setup/jest.config.js roles
```

---

## Module Aliases

All test files use path aliases instead of fragile relative paths:

| Alias | Resolves to |
|---|---|
| `@backend/*` | `backend_mysql/src/*` |
| `@client/*` | `client/*` |

---

## Test Categories

| Category | What it tests | DB required |
|---|---|---|
| Unit | Service logic with mocked pool | No |
| API | HTTP routes via Supertest | Yes |
| Integration | Multi-step real flows | Yes |
| Frontend | React components via jsdom | No |

---

## Safety Rules

- `NODE_ENV` must equal `"test"` — testSetup.js throws if not
- Never connect to the production database during tests
- Unit tests mock `@backend/config/db` — no real DB calls
- API and integration tests require a real MySQL test database

---

## Coverage

After running `npm run test:coverage`, open:

```
tests/coverage/index.html
```
