# Business Requirements Document

## Kitchen Pro — Restaurant Management System

**Version:** 1.0
**Status:** Active Development
**Prepared for:** Client Review

---

## 1. Executive Summary

Kitchen Pro is a restaurant operations management system designed to improve inventory control, reduce food wastage, and ensure smooth kitchen operations through real-time stock tracking, automated consumption logging, and actionable insights.

The system replaces manual inventory processes with a centralized digital platform that provides complete visibility into ingredient usage, stock levels, and waste — enabling faster and more informed business decisions.

---

## 2. Business Problem

Restaurants commonly face operational challenges that directly impact profitability and service quality:

| Problem | Business Impact |
|---|---|
| Unexpected stock shortages | Service disruptions, lost revenue |
| Untracked food wastage | Increased costs, no accountability |
| Manual inventory checks | Staff time wasted, human error |
| No real-time visibility | Reactive decisions instead of proactive |
| Single-role access | No control over what staff can see or do |
| No consumption analytics | Purchasing decisions based on guesswork |

---

## 3. Proposed Solution

Kitchen Pro provides a centralized platform that automates key kitchen and inventory processes:

- Real-time ingredient stock tracking with batch-level granularity
- Automatic stock deduction during food preparation (FIFO order)
- Waste logging with reason tracking and automatic stock adjustment
- Low-stock and out-of-stock alerts with a notification centre
- Role-based access control for Admin, Manager, Chef, and Inventory Staff
- Operational dashboards with consumption and waste analytics

---

## 4. Key Business Benefits

- **Reduced food wastage** — expiry tracking and FIFO consumption prevent spoilage
- **Prevented stock shortages** — threshold alerts fire before stockouts occur
- **Improved inventory accuracy** — every deduction is logged automatically
- **Staff time savings** — no manual stock counts or spreadsheet updates
- **Better purchasing decisions** — consumption data drives reorder quantities
- **Operational accountability** — role-based access ensures staff see only what they need
- **Improved profit margins** — waste reduction and accurate purchasing lower costs

---

## 5. System Modules

### 5.1 Authentication & Access Control

- Secure JWT-based login and registration
- Role-based access control (RBAC) with four roles: Admin, Manager, Chef, Inventory Staff
- All system routes protected via authentication middleware
- Passwords stored using bcrypt hashing

### 5.2 Ingredient Inventory Management

- Add and update ingredients with name, unit, stock quantity, and alert threshold
- Stock status indicators: In Stock, Low Stock, Out of Stock
- Server-side paginated ingredient list
- Soft delete — ingredients are archived, not permanently removed

### 5.3 Batch Management

- Track ingredient stock as individual batches with expiry dates
- FIFO consumption — oldest batch is always deducted first
- Expiry alerts for batches approaching their expiry date
- Stock level automatically recalculated from all active batches

### 5.4 Recipe Management

- Create dishes and define required ingredients with exact quantities
- Ingredient names resolved automatically — no raw IDs shown to users
- Paginated recipe list

### 5.5 Consumption & Order Tracking

- Place orders that automatically deduct ingredient stock via FIFO batch logic
- Full transaction support — if any ingredient has insufficient stock, the entire order rolls back
- Paginated order and consumption history

### 5.6 Waste Management

- Log wasted ingredients with quantity and reason (Expired, Spoiled, Overcooked, Damaged, Other)
- Stock automatically deducted on waste entry
- Paginated waste history for reporting

### 5.7 Notification System

- On-demand stock scan generates alerts for low-stock and out-of-stock ingredients
- Deduplication — one notification per ingredient per alert type
- Bell icon badge shows live unread count, polling every 60 seconds
- Mark individual or all notifications as read

### 5.8 Dashboard & Analytics

- Single optimised query — all metrics returned in one API call
- Summary cards: total ingredients, low stock count, out of stock count, total waste volume
- Consumption vs waste volume comparison
- Critical low stock table showing items requiring immediate action
- Inventory health overview

---

## 6. Technical Overview

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router v7, Tailwind CSS v4 |
| Backend | Node.js, Express 5 |
| Database | MySQL (Aiven Cloud) |
| Authentication | JWT, bcryptjs |
| Containerisation | Docker |
| Testing | Jest 29, React Testing Library |

**Architecture principle:** Backend-first. All filtering, sorting, pagination, and aggregation runs on the server. The frontend receives only pre-shaped, minimal responses.

---

## 7. User Roles & Permissions

| Permission | Admin | Manager | Chef | Inventory Staff |
|---|---|---|---|---|
| Manage ingredients | ✅ | ✅ | ❌ | ✅ |
| Manage batches | ✅ | ✅ | ❌ | ✅ |
| Create recipes | ✅ | ✅ | ✅ | ❌ |
| Place orders | ✅ | ✅ | ✅ | ❌ |
| Log waste | ✅ | ✅ | ✅ | ✅ |
| View notifications | ✅ | ✅ | ✅ | ✅ |
| View dashboard | ✅ | ✅ | ❌ | ❌ |
| Manage users | ✅ | ✅ | ❌ | ❌ |

---

## 8. Future Roadmap

The following features are planned for future versions:

### Phase 2 — Supplier & Purchasing
- Supplier directory with contact information
- Purchase order creation and tracking
- Automatic stock update on delivery confirmation
- Full procurement history

### Phase 3 — Advanced Analytics & Automation
- AI-based demand forecasting using historical consumption data
- Automated reorder triggers when stock falls below threshold
- Waste pattern detection with menu optimisation suggestions
- Smart recipe cost analysis and ingredient substitution recommendations

### Phase 4 — Platform Expansion
- Multi-branch and multi-restaurant support
- Branch-level inventory with central reporting
- Real-time push notifications via WebSockets
- Mobile-responsive progressive web app (PWA)

---

## 9. Implementation Timeline

| Phase | Description | Duration |
|---|---|---|
| Phase 1 | System setup and configuration | 1 week |
| Phase 2 | Data setup and testing | 1 week |
| Phase 3 | Training and deployment | 1 week |

**Total estimated time: 2–3 weeks**

---

## 10. Deliverables

The following will be provided to the client upon project completion:

- Fully functional restaurant management system (frontend + backend)
- User accounts configured with appropriate roles
- Dashboard and reporting tools
- System and API documentation
- Docker deployment configuration
- User training and handover support

---

## 11. Success Criteria

The project will be considered successful when:

- Inventory is tracked accurately with no manual intervention required
- Waste is recorded consistently by kitchen staff
- Stock shortages are detected before they impact service
- All staff roles can operate the system without technical assistance
- Dashboard reports support daily operational decisions

---

## 12. Constraints & Assumptions

- Client provides a MySQL-compatible database instance (Aiven Cloud recommended)
- Client provides server infrastructure for deployment (or uses Docker)
- Initial data entry (ingredients, recipes) is performed by the client during onboarding
- Internet connectivity is required for cloud database access
