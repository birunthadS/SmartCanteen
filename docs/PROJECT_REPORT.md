# Project Report
## Smart Canteen Pre-Order & Queue Management System

---

| Field | Details |
|-------|---------|
| **Project Title** | Smart Canteen Pre-Order & Queue Management System |
| **Register Number** | U23CB491 |
| **Project Domain** | Full-Stack Web Application |
| **Technology Stack** | React · TypeScript · Node.js · Express · Prisma · SQLite |
| **Version** | 1.0.0 |
| **Date** | October 2024 |

---

## Table of Contents

1. [Abstract](#1-abstract)
2. [Introduction](#2-introduction)
3. [Problem Statement](#3-problem-statement)
4. [Objectives](#4-objectives)
5. [System Requirements](#5-system-requirements)
6. [System Architecture](#6-system-architecture)
7. [Database Design](#7-database-design)
8. [Module Description](#8-module-description)
9. [Implementation](#9-implementation)
10. [Testing](#10-testing)
11. [Results & Screenshots](#11-results--screenshots)
12. [Conclusion](#12-conclusion)
13. [References](#13-references)

---

## 1. Abstract

The Smart Canteen Pre-Order & Queue Management System is a web application that digitizes college canteen operations. It enables students and staff to browse menus, place pre-orders, schedule pickup time slots, and track orders in real time using Server-Sent Events (SSE). The system eliminates manual queuing, reduces order wait times, and provides the canteen administration with analytics, inventory management, and user management tools. Built with React, TypeScript, Node.js/Express, Prisma ORM, and SQLite, it follows modern full-stack architecture patterns with JWT-based role-based access control (RBAC).

---

## 2. Introduction

College canteens face significant operational challenges during peak hours — long queues, order mix-ups, stock-outs, and inability to plan ingredient purchases. Students miss lectures waiting for food. Staff cannot predict demand. This project proposes a digital solution: a pre-order system where students schedule meals in advance, and staff manage preparation queues via a dashboard.

The application serves three categories of users:
- **Students/Staff (Customers)** — Browse, order, pay, and track
- **Canteen Staff** — Manage the preparation queue, update order statuses
- **Administrators** — Full control over menu, inventory, users, orders, and analytics

---

## 3. Problem Statement

Traditional college canteen systems suffer from:

1. **Long queues** — Students queue for 15–30 minutes during lunch breaks
2. **No order tracking** — No visibility into preparation status
3. **Stock wastage** — No demand forecasting leads to over/under-stocking
4. **Revenue loss** — Manual processes, no digital payment, no analytics
5. **Poor user experience** — No dietary filters (veg/non-veg), no allergy info

---

## 4. Objectives

- ✅ Allow students to pre-order meals and select pickup time slots
- ✅ Enable real-time order status tracking via SSE
- ✅ Provide staff with a queue management dashboard
- ✅ Give admins full menu CRUD, inventory management, and analytics
- ✅ Implement role-based access (Student / Staff / Admin)
- ✅ Generate unique queue tokens to organize pickup order
- ✅ Support Cash and Online payment methods
- ✅ Provide low-stock alerts and inventory audit trail
- ✅ Allow customers to rate and review completed orders
- ✅ Export sales data to CSV for reporting

---

## 5. System Requirements

### 5.1 Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-01 | Users can register with name, email, phone, and password |
| FR-02 | JWT tokens authenticate all API requests |
| FR-03 | Customers browse menu with search, category, and veg filters |
| FR-04 | Customers add items to cart, adjust quantities |
| FR-05 | Customers select pickup date and time slot during checkout |
| FR-06 | System generates unique queue tokens per order |
| FR-07 | Staff can call next token and update status (PREPARING→READY→COMPLETED) |
| FR-08 | Order status updates are pushed via SSE in real time |
| FR-09 | Admins can add/edit/delete menu items and categories |
| FR-10 | Admins can add or remove stock with reason logging |
| FR-11 | System alerts when item stock falls below 10 units |
| FR-12 | Admins export order data as CSV |
| FR-13 | Customers can rate and review completed orders |
| FR-14 | Admins can hide or delete offensive reviews |

### 5.2 Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-01 | API response time < 500ms for standard queries |
| NFR-02 | Passwords hashed with bcrypt (12 salt rounds) |
| NFR-03 | Role-based middleware on all protected routes |
| NFR-04 | Database transactions for checkout and stock operations |
| NFR-05 | Mobile-responsive UI (320px–1920px) |
| NFR-06 | Form validation on both client (Zod) and server (Zod) |

---

## 6. System Architecture

### 6.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    React SPA (Port 5173)                     │
│  ┌─────────────┐  ┌────────────────┐  ┌──────────────────┐  │
│  │  Customer   │  │    Staff       │  │     Admin        │  │
│  │  Portal     │  │    Portal      │  │     Portal       │  │
│  └─────────────┘  └────────────────┘  └──────────────────┘  │
│              AuthContext · CartContext · Axios                │
└──────────────────────────────┬───────────────────────────────┘
                               │ HTTPS / SSE
┌──────────────────────────────▼───────────────────────────────┐
│              Express REST API (Port 5000)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │  /auth   │ │  /menu   │ │ /orders  │ │  /admin          │ │
│  │ /cart    │ │ /queue   │ │ /reviews │ │  /sse            │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘ │
│              JWT Middleware · Zod Validation                  │
│                       Prisma ORM                             │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│                    SQLite Database                           │
│  13 Models · Prisma Migrations · Seeded Demo Data           │
└──────────────────────────────────────────────────────────────┘
```

### 6.2 Authentication Flow

```
Client               Server               Database
  │── POST /auth/login ──▶│                    │
  │                       │── findUser ────────▶│
  │                       │◀── user ────────────│
  │                       │   bcrypt.compare     │
  │◀─── JWT Token ────────│                    │
  │                       │                    │
  │── GET /api/... ───────▶│                    │
  │   Authorization: Bearer│                    │
  │                       │  verifyJWT          │
  │                       │  authorize(role)     │
  │◀── Response ──────────│                    │
```

### 6.3 Order Flow

```
Cart → Checkout → [Transaction Begin]
  ├── Validate pickup slot capacity
  ├── Deduct stock for each item
  ├── Create Order + OrderItems
  ├── Allocate QueueToken
  ├── Create Payment record
  ├── Clear cart
  └── [Transaction Commit]
       ↓ SSE broadcast to Staff
Staff Dashboard → Call Next → Update Status
  PLACED → CONFIRMED → PREPARING → READY → COMPLETED
       ↓ SSE push to Customer
Customer sees real-time status update
```

---

## 7. Database Design

### 7.1 Entity Relationship Diagram

```
User (1) ──────── (n) Order
  │                      │
  ├── (n) CartItem        ├── (n) OrderItem ──── MenuItem ──── MenuCategory
  │         │             │                          │
  │    MenuItem           ├── QueueToken             └── InventoryTransaction
  │                       ├── Payment
  └── (n) Notification    ├── OrderStatusHistory
                          ├── Review (1:1)
                          └── PickupSlot
```

### 7.2 Key Models

**User**
```sql
id, email (unique), name, phone, passwordHash,
role (STUDENT|STAFF|ADMIN), isActive, createdAt
```

**Order**
```sql
id, orderNumber (unique), userId, pickupSlotId, status,
paymentMethod, paymentStatus, subtotal, tax, discount, total,
notes, scheduledDate, cancelReason, createdAt
```

**MenuItem**
```sql
id, name, description, price, imageUrl, categoryId,
isVegetarian, isAvailable, stockQuantity,
preparationMins, allergyInfo, sortOrder
```

**QueueToken**
```sql
id, orderId (unique), tokenNumber, scope, isActive, calledAt
```

---

## 8. Module Description

### 8.1 Authentication Module (`/server/src/routes/auth.ts`)
- `POST /api/auth/register` — Creates user, hashes password with bcrypt
- `POST /api/auth/login` — Validates credentials, issues JWT (7d expiry)
- `GET /api/auth/me` — Returns authenticated user info
- JWT middleware validates `Authorization: Bearer <token>` on all protected routes

### 8.2 Menu Module (`/server/src/routes/menu.ts`)
- Categories: GET all (public), GET all (admin), POST/PUT/DELETE (admin)
- Items: GET filtered (public), GET all (admin/staff), GET by ID, POST/PUT/DELETE (admin)
- Availability toggle: PATCH `:id/toggle`
- Inventory: POST `:id/inventory` (add/remove with audit)

### 8.3 Cart Module (`/server/src/routes/cart.ts`)
- GET current user's cart with calculated subtotal, tax (5%), total
- POST add item (merge if exists)
- PUT update quantity
- DELETE remove item, DELETE clear cart

### 8.4 Orders Module (`/server/src/routes/orders.ts`)
- `POST /checkout` — Full transaction: validate slot, deduct stock, create order+items+token+payment, clear cart
- `GET /my-orders` — Customer's order history
- `GET /:id` — Single order detail
- `PATCH /:id/status` — Staff status update with transition validation
- `POST /:id/cancel` — Cancel with stock restoration

### 8.5 Queue Module (`/server/src/routes/queue.ts`)
- `GET /` — All active orders for today (staff/admin)
- `GET /my-token/:orderId` — Customer token + queue position
- `POST /call-next` — Mark next CONFIRMED order as PREPARING

### 8.6 SSE Module (`/server/src/routes/sse.ts`)
- `GET /api/sse/events` — Persistent SSE connection
- Broadcasts `ORDER_UPDATE` and `NEW_ORDER` events to all connected clients
- Keeps connection alive with 30-second heartbeats

### 8.7 Admin Module (`/server/src/routes/admin.ts`)
- Users: GET all, PATCH toggle, PATCH role
- Analytics: Revenue, order counts, status breakdown, daily sales (7d), popular items, low stock
- Orders: Paginated with search/date/status filter
- CSV Export: Sales report for date range

### 8.8 Reviews Module (`/server/src/routes/reviews.ts`)
- POST create review (for completed orders only, once per order)
- GET public reviews (hidden filtered)
- GET admin all reviews with rating filter
- PATCH toggle visibility, DELETE

---

## 9. Implementation

### 9.1 Key Design Decisions

**Prisma Transactions for Checkout**  
The checkout endpoint wraps all operations in a `prisma.$transaction()` to ensure atomicity. If stock deduction fails or slot capacity is exceeded, the entire operation rolls back.

**SSE for Real-Time Updates**  
Server-Sent Events were chosen over WebSockets for simplicity. SSE is unidirectional (server→client), which perfectly matches the use case of order status broadcasts. The client subscribes once and receives all updates.

**Role-Based Middleware**  
A reusable `authorize(...roles)` middleware checks the JWT-decoded role against allowed roles. Routes are protected at the Express router level.

**Queue Token Generation**  
Tokens are scoped per date (`YYYY-MM-DD`). The token number increments within the day scope, resetting daily. This gives each pickup day tokens like T-01, T-02, etc.

**Inventory Audit Trail**  
Every stock change (checkout, manual add/remove) creates an `InventoryTransaction` record with quantity, reason, and timestamp for full auditability.

### 9.2 Frontend Architecture

**React Contexts**
- `AuthContext` — User, token, login/logout/refresh
- `CartContext` — Cart state synced with backend

**API Client**  
Axios instance with base URL `http://localhost:5000/api` and request interceptor to inject JWT token from `localStorage`.

**Role Guards in Router**  
`App.tsx` checks `user.role` before rendering portal layouts. Unauthenticated users are redirected to `/login`.

---

## 10. Testing

### 10.1 Testing Strategy

The project uses **Vitest** + **React Testing Library** for frontend unit and integration tests.

### 10.2 Test Coverage Areas

| Module | Test Type | Description |
|--------|-----------|-------------|
| AuthContext | Unit | Login, register, logout, token persistence |
| CartContext | Unit | Add item, remove item, clear cart |
| LoginPage | Integration | Form validation, success/error flows |
| MenuPage | Integration | Filter, search, add to cart |
| StatusBadge | Unit | Renders correct badge for each status |
| API routes | Manual | Tested with HTTP client |

### 10.3 Running Tests

```bash
cd client
npm run test          # Run once
npm run test:watch    # Watch mode
```

---

## 11. Results & Screenshots

### Admin Dashboard
- 4 KPI stat cards (Revenue, Today's Orders, Avg Order Value, Pending)
- Recharts bar chart for 7-day revenue
- Pie chart for order status breakdown
- Popular items leaderboard
- Low stock alerts

### Staff Queue
- Real-time queue with token numbers
- One-click "Call Next" button
- Status step-by-step: CONFIRMED → PREPARING → READY → COMPLETED

### Customer Flow
- Browse menu with category tabs and search
- Cart with quantity controls
- Checkout with date picker and slot availability indicator
- Order confirmation with token number
- Real-time tracking page with SSE-driven progress bar

---

## 12. Conclusion

The Smart Canteen Pre-Order & Queue Management System successfully achieves all stated objectives. The application digitizes the complete canteen ordering lifecycle — from menu browsing to meal pickup — for students, staff, and administrators.

**Key Achievements:**
- Zero-queue experience via pre-ordering and token-based pickup
- Real-time order tracking eliminates uncertainty
- Admin analytics enable data-driven menu and stock decisions
- Role-based access ensures data security
- Inventory audit trail prevents stock discrepancies
- Scalable architecture ready for production deployment

**Future Enhancements:**
- Mobile app (React Native)
- UPI payment integration (Razorpay)
- Push notifications (Firebase Cloud Messaging)
- Multi-canteen support
- ML-based demand forecasting

---

## 13. References

1. Prisma ORM Documentation — https://www.prisma.io/docs
2. React Documentation — https://react.dev
3. Express.js Guide — https://expressjs.com
4. TailwindCSS Documentation — https://tailwindcss.com/docs
5. Recharts Documentation — https://recharts.org
6. JSON Web Tokens — https://jwt.io
7. Server-Sent Events MDN — https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events
8. Zod Schema Validation — https://zod.dev

---

*Smart Canteen Pre-Order & Queue Management System — Register No: U23CB491*
