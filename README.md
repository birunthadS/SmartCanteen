# Smart Canteen Pre-Order & Queue Management System

<div align="center">

![Smart Canteen Banner](https://img.shields.io/badge/Smart%20Canteen-Pre--Order%20System-1a6b3c?style=for-the-badge&logo=react)
![Register Number](https://img.shields.io/badge/Register%20No-U23CB491-f59e0b?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-1.0.0-blue?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**A full-stack web application to digitize college canteen operations — pre-order meals, skip queues, track orders in real time.**

[Live Demo](#quick-start) · [API Docs](docs/API_DOCUMENTATION.md) · [User Guide](docs/USER_GUIDE.md) · [Project Report](docs/PROJECT_REPORT.md)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Demo Accounts](#demo-accounts)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Documentation](#documentation)

---

## Overview

The **Smart Canteen Pre-Order & Queue Management System** is a college-level full-stack web application that digitizes campus canteen operations. Students and staff can browse the menu, add items to cart, schedule pickups at specific time slots, make payments, and track their orders in real time — eliminating the need to stand in queues.

**Register Number:** U23CB491  
**Project Domain:** Full-Stack Web Application  
**Institution:** College-level Software Engineering Project

---

## Features

### 👨‍🎓 Customer Portal
- 🏠 **Landing Page** — Hero section, features, stats
- 🔐 **Authentication** — JWT-based login & registration
- 🍽️ **Menu Browsing** — Search, filter by category/veg, view details
- 🛒 **Cart** — Add/remove items, quantity adjustment
- 📅 **Checkout** — Choose pickup date & time slot with capacity indicator
- 💳 **Payment** — Cash or Online payment selection
- 🎟️ **Queue Token** — Unique token generated per order
- 📡 **Real-time Tracking** — SSE-based live order status
- 📜 **Order History** — View past orders, repeat or review
- 🔔 **Notifications** — In-app notification center
- ⭐ **Feedback** — Rate and review completed orders
- 👤 **Profile** — Update personal information

### 👨‍🍳 Staff Portal
- 📊 **Dashboard** — Today's queue, statistics
- 📋 **Queue Management** — Call next order, update status step-by-step
- 📦 **Order Detail** — Full order info, mark PREPARING → READY → COMPLETED
- 📦 **Inventory View** — Read-only stock levels with low-stock alerts

### 🛡️ Admin Portal
- 📈 **Dashboard** — Revenue, order stats, charts, low stock alerts
- 🍕 **Menu CRUD** — Add/edit/delete items & categories, toggle availability
- 📦 **Inventory Management** — Add/remove stock with audit trail
- 📋 **Orders** — All orders with search, date/status filter, CSV export
- 👥 **User Management** — Activate/deactivate accounts, change roles
- ⭐ **Feedback Moderation** — Approve/hide/delete reviews
- 📊 **Analytics** — Revenue trend, order volume, payment method breakdown

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | TailwindCSS 3 + @tailwindcss/forms |
| **Charts** | Recharts 2 |
| **Icons** | Lucide React |
| **HTTP Client** | Axios |
| **Routing** | React Router DOM 6 |
| **Backend** | Node.js, Express 5 |
| **ORM** | Prisma 5 |
| **Database** | SQLite (dev) |
| **Auth** | JWT (jsonwebtoken) |
| **Validation** | Zod |
| **Real-time** | Server-Sent Events (SSE) |
| **Testing** | Vitest + Testing Library |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                 React Frontend (Vite)               │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────┐ │
│  │  Customer    │ │    Staff     │ │    Admin    │ │
│  │   Portal     │ │   Portal     │ │   Portal    │ │
│  └──────┬───────┘ └──────┬───────┘ └──────┬──────┘ │
│         └────────────────┼────────────────┘         │
│                     Axios + JWT                      │
└─────────────────────────┬───────────────────────────┘
                          │ HTTP / SSE
┌─────────────────────────▼───────────────────────────┐
│              Express REST API (Port 5000)            │
│  /api/auth  /api/menu  /api/orders  /api/queue      │
│  /api/cart  /api/admin /api/reviews /api/sse        │
│                    Prisma ORM                        │
└─────────────────────────┬───────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────┐
│              SQLite Database (Prisma)                │
│  User · MenuCategory · MenuItem · CartItem           │
│  PickupSlot · Order · OrderItem · QueueToken         │
│  Payment · OrderStatusHistory · Review               │
│  Notification · InventoryTransaction                 │
└─────────────────────────────────────────────────────┘
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm 9+

### 1. Clone & Install

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Setup Database

```bash
cd server

# Run migrations
npx prisma migrate deploy

# Seed demo data
npx ts-node src/seed.ts
```

### 3. Start Servers

**Terminal 1 — Backend:**
```bash
cd server
npx ts-node-dev --respawn --transpile-only src/index.ts
# Server running at http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
# App running at http://localhost:5173
```

### 4. Open App

Visit **http://localhost:5173** and use a [demo account](#demo-accounts) to log in.

---

## Demo Accounts

All demo accounts share the same password: **`Demo@1234`**

| Role | Email | Password | Access |
|------|-------|----------|--------|
| 🛡️ **Admin** | admin@canteen.demo | Demo@1234 | Full admin panel |
| 👨‍🍳 **Staff** | staff@canteen.demo | Demo@1234 | Staff dashboard |
| 👨‍🎓 **Student** | student@canteen.demo | Demo@1234 | Customer portal |
| 👨‍🎓 **Student 2** | priya@canteen.demo | Demo@1234 | Customer portal |

> 💡 **New registrations** go through an admin approval workflow. Submit a request on the Register page and an admin must approve it before you can log in.

---

## Project Structure

```
spm/
├── client/                     # React frontend
│   ├── src/
│   │   ├── contexts/           # AuthContext, CartContext
│   │   ├── layouts/            # CustomerLayout, StaffLayout, AdminLayout
│   │   ├── lib/                # Axios API client
│   │   ├── pages/
│   │   │   ├── auth/           # Login, Register
│   │   │   ├── customer/       # Menu, Cart, Checkout, Tracking, History...
│   │   │   ├── staff/          # Dashboard, Queue, Order Detail, Inventory
│   │   │   └── admin/          # Dashboard, Menu, Inventory, Orders, Users...
│   │   ├── components/shared/  # StatusBadge, LoadingScreen
│   │   ├── types/              # TypeScript interfaces
│   │   └── App.tsx             # Router with role guards
│   ├── tailwind.config.js
│   └── package.json
│
├── server/                     # Express backend
│   ├── prisma/
│   │   ├── schema.prisma       # 13-model database schema
│   │   └── migrations/         # SQL migration files
│   ├── src/
│   │   ├── routes/             # auth, menu, orders, cart, queue, admin, reviews, sse
│   │   ├── middleware/         # auth (JWT), errorHandler, notFound
│   │   ├── lib/                # prisma client singleton
│   │   ├── seed.ts             # Database seeder
│   │   └── index.ts            # Express app entry point
│   └── package.json
│
├── docs/                       # Project documentation
│   ├── PROJECT_REPORT.md
│   ├── API_DOCUMENTATION.md
│   ├── USER_GUIDE.md
│   └── DEMO_GUIDE.md
└── README.md
```

---

## API Reference

See **[docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)** for the full REST API reference.

**Base URL:** `http://localhost:5000/api`

| Group | Endpoints |
|-------|-----------|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| Menu | `GET /menu/items`, `GET /menu/categories`, `POST /menu/items` (Admin) |
| Cart | `GET /cart`, `POST /cart/items`, `DELETE /cart/items/:id` |
| Orders | `POST /orders/checkout`, `GET /orders/my-orders`, `PATCH /orders/:id/status` |
| Queue | `GET /queue`, `POST /queue/call-next`, `GET /queue/my-token/:orderId` |
| Reviews | `POST /reviews`, `GET /reviews`, `PATCH /reviews/:id/visibility` |
| Admin | `GET /admin/analytics`, `GET /admin/orders`, `GET /admin/users`, `GET /admin/analytics/csv` |
| SSE | `GET /sse/events` |

---

## Database Schema

**13 Models:**

```
User ──────────────────────────────────────────────
  ↓ orders (1:n)
Order ─── OrderItem ─── MenuItem ─── MenuCategory
  │ ── QueueToken
  │ ── Payment
  │ ── OrderStatusHistory
  │ ── Review
  └── PickupSlot

CartItem ─── MenuItem (user's active cart)
Notification (user notifications)
InventoryTransaction (stock audit log)
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [PROJECT_REPORT.md](docs/PROJECT_REPORT.md) | Formal project report with system design |
| [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) | Complete REST API reference |
| [USER_GUIDE.md](docs/USER_GUIDE.md) | End-user manual for all roles |
| [DEMO_GUIDE.md](docs/DEMO_GUIDE.md) | Step-by-step demo walkthrough |

---

## License

MIT © 2024 — Smart Canteen Project — Register No: U23CB491
