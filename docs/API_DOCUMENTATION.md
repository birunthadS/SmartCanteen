# API Documentation
## Smart Canteen Pre-Order & Queue Management System

**Base URL:** `http://localhost:5000/api`  
**Auth:** `Authorization: Bearer <JWT_TOKEN>` (required on protected routes)  
**Content-Type:** `application/json`

---

## Table of Contents

- [Authentication](#authentication)
- [Menu](#menu)
- [Cart](#cart)
- [Orders](#orders)
- [Queue](#queue)
- [Reviews](#reviews)
- [Admin](#admin)
- [SSE](#sse-server-sent-events)
- [Error Responses](#error-responses)

---

## Authentication

### POST `/auth/register`
Register a new user.

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "password123"
}
```

**Response 201:**
```json
{
  "success": true,
  "token": "eyJhbGci...",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "STUDENT"
  }
}
```

---

### POST `/auth/login`
Login and receive JWT.

**Body:**
```json
{
  "email": "admin@canteen.demo",
  "password": "admin123"
}
```

**Response 200:**
```json
{
  "success": true,
  "token": "eyJhbGci...",
  "user": { "id": "...", "role": "ADMIN", ... }
}
```

---

### GET `/auth/me`
🔐 Get currently authenticated user.

**Response 200:**
```json
{
  "success": true,
  "user": { "id": "...", "name": "...", "email": "...", "role": "STUDENT" }
}
```

---

## Menu

### GET `/menu/categories`
Public. Get all active categories.

**Response 200:**
```json
{
  "success": true,
  "categories": [
    {
      "id": "uuid",
      "name": "Main Course",
      "isActive": true,
      "_count": { "menuItems": 5 }
    }
  ]
}
```

---

### GET `/menu/items`
Public. Get available menu items with optional filters.

**Query Params:**
| Param | Type | Description |
|-------|------|-------------|
| `category` | string | Category name |
| `search` | string | Search in name/description |
| `veg` | boolean | Filter vegetarian only |

**Response 200:**
```json
{
  "success": true,
  "items": [
    {
      "id": "uuid",
      "name": "Masala Dosa",
      "price": 45,
      "isVegetarian": true,
      "isAvailable": true,
      "stockQuantity": 50,
      "preparationMins": 10,
      "category": { "name": "South Indian" }
    }
  ]
}
```

---

### GET `/menu/items/all`
🔐 Admin/Staff. Get ALL items (including unavailable).

---

### GET `/menu/items/:id`
Public. Get single item with reviews.

**Response 200:**
```json
{
  "success": true,
  "item": {
    "id": "...",
    "name": "Masala Dosa",
    "avgRating": 4.2,
    "reviews": [
      { "rating": 5, "comment": "Excellent!", "user": { "name": "Priya" } }
    ]
  }
}
```

---

### POST `/menu/items`
🔐 Admin only. Create a new menu item.

**Body:**
```json
{
  "name": "Veg Burger",
  "price": 60,
  "categoryId": "uuid",
  "isVegetarian": true,
  "stockQuantity": 30,
  "preparationMins": 8,
  "description": "Crispy patty with fresh veggies"
}
```

---

### PUT `/menu/items/:id`
🔐 Admin only. Update a menu item.

---

### DELETE `/menu/items/:id`
🔐 Admin only. Deactivates (soft-delete) the item.

---

### PATCH `/menu/items/:id/toggle`
🔐 Admin/Staff. Toggle item availability.

---

### POST `/menu/items/:id/inventory`
🔐 Admin/Staff. Adjust stock.

**Body:**
```json
{
  "type": "ADD",
  "quantity": 20,
  "reason": "Morning restock"
}
```

`type`: `"ADD"` or `"REMOVE"`

---

### POST `/menu/categories`
🔐 Admin only. Create a category.

**Body:** `{ "name": "Beverages" }`

---

## Cart

> All cart endpoints require authentication (`STUDENT` or `STAFF`).

### GET `/cart`
Get current user's cart with calculated totals.

**Response 200:**
```json
{
  "success": true,
  "cart": {
    "items": [
      {
        "id": "uuid",
        "quantity": 2,
        "menuItem": { "id": "...", "name": "Masala Dosa", "price": 45 }
      }
    ],
    "subtotal": 90,
    "tax": 4.5,
    "total": 94.5
  }
}
```

---

### POST `/cart/items`
Add item to cart (merges if item already exists).

**Body:**
```json
{ "menuItemId": "uuid", "quantity": 2 }
```

---

### PUT `/cart/items/:id`
Update quantity.

**Body:** `{ "quantity": 3 }`

---

### DELETE `/cart/items/:id`
Remove a single cart item.

---

### DELETE `/cart`
Clear the entire cart.

---

## Orders

### POST `/orders/checkout`
🔐 Place order from current cart.

**Body:**
```json
{
  "pickupSlotId": "uuid",
  "scheduledDate": "2024-10-20",
  "paymentMethod": "CASH",
  "notes": "Extra spicy please"
}
```

**Response 201:**
```json
{
  "success": true,
  "order": {
    "id": "uuid",
    "orderNumber": "CAN-20241020-4521",
    "status": "PLACED",
    "total": 94.5,
    "token": { "tokenNumber": 7 }
  }
}
```

---

### GET `/orders/my-orders`
🔐 Get current user's order history.

**Query Params:** `status`, `page`, `limit`

---

### GET `/orders/:id`
🔐 Get full order details (customer can only access their own).

---

### PATCH `/orders/:id/status`
🔐 Staff/Admin. Update order status.

**Body:** `{ "status": "PREPARING", "note": "Started cooking" }`

**Valid Transitions:**
```
PLACED → CONFIRMED → PREPARING → READY → COMPLETED
PLACED → CANCELLED
CONFIRMED → CANCELLED
```

---

### POST `/orders/:id/cancel`
🔐 Cancel order (restores stock).

**Body:** `{ "reason": "Changed my mind" }`

---

### GET `/orders/today`
🔐 Staff/Admin. All orders scheduled for today.

---

## Queue

### GET `/queue`
🔐 Staff/Admin. Active orders queue for a date.

**Query Params:** `date` (YYYY-MM-DD, defaults to today)

**Response 200:**
```json
{
  "success": true,
  "queue": [
    {
      "id": "...",
      "status": "CONFIRMED",
      "queuePosition": 1,
      "token": { "tokenNumber": 3 },
      "user": { "name": "Rahul Kumar" },
      "items": [ { "name": "Biryani", "quantity": 1 } ]
    }
  ]
}
```

---

### GET `/queue/my-token/:orderId`
🔐 Get queue position and token for a specific order.

**Response 200:**
```json
{
  "success": true,
  "token": { "tokenNumber": 5 },
  "order": { "status": "PREPARING", "scheduledDate": "2024-10-20" },
  "queuePosition": 2
}
```

---

### POST `/queue/call-next`
🔐 Staff/Admin. Call next CONFIRMED order (moves it to PREPARING).

**Body:** `{ "date": "2024-10-20" }` (optional, defaults to today)

---

## Reviews

### POST `/reviews`
🔐 Create a review for a completed order (one per order).

**Body:**
```json
{
  "orderId": "uuid",
  "rating": 5,
  "comment": "Food was excellent and hot!"
}
```

---

### GET `/reviews`
Public. Get visible reviews.

**Query Params:** `menuItemId`, `page`, `limit`

---

### GET `/reviews/admin`
🔐 Admin. Get all reviews with optional rating filter.

**Query Params:** `rating` (1-5), `limit`

---

### PATCH `/reviews/:id/visibility`
🔐 Admin. Toggle review visibility (hide/show).

---

### DELETE `/reviews/:id`
🔐 Admin. Permanently delete a review.

---

## Admin

> All `/admin` routes require `ADMIN` role.

### GET `/admin/analytics`
Get full analytics summary.

**Query Params:** `startDate`, `endDate`

**Response 200:**
```json
{
  "success": true,
  "analytics": {
    "totalOrders": 142,
    "revenue": 8540.50,
    "todayOrders": 18,
    "pendingOrders": 3,
    "avgOrderValue": 60.14,
    "statusBreakdown": [
      { "status": "COMPLETED", "_count": 120 }
    ],
    "dailySales": [
      { "date": "2024-10-11", "revenue": 1240.00, "orders": 22 }
    ],
    "popularItems": [
      { "name": "Biryani", "_sum": { "quantity": 87 } }
    ],
    "lowStock": [
      { "name": "Veg Burger", "stockQuantity": 5, "category": { "name": "Snacks" } }
    ]
  }
}
```

---

### GET `/admin/analytics/csv`
Download orders CSV for date range.

**Query Params:** `startDate`, `endDate`  
**Response:** `text/csv` file download

---

### GET `/admin/orders`
Paginated orders list with filters.

**Query Params:** `status`, `date`, `search`, `skip`, `limit`

---

### GET `/admin/users`
Get all users.

**Query Params:** `search`, `role`

---

### PATCH `/admin/users/:id/toggle`
Toggle user active/inactive.

---

### PATCH `/admin/users/:id/role`
Change user role.

**Body:** `{ "role": "STAFF" }`

---

## Pickup Slots

### GET `/slots`
Public. Get active pickup slots.

**Query Params:** `date` (YYYY-MM-DD) — returns remaining capacity per slot.

**Response 200:**
```json
{
  "success": true,
  "slots": [
    {
      "id": "uuid",
      "label": "12:00 PM – 12:30 PM",
      "startTime": "12:00",
      "endTime": "12:30",
      "maxOrders": 20,
      "remaining": 14,
      "isFull": false
    }
  ]
}
```

---

## SSE (Server-Sent Events)

### GET `/sse/events`
🔐 Open a persistent SSE connection for real-time events.

**Response Headers:**
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

**Events Received:**

`connected` — Initial handshake:
```
data: {"type":"connected","message":"SSE connected"}
```

`ORDER_UPDATE` — Order status changed:
```
data: {"type":"ORDER_UPDATE","orderId":"uuid","status":"PREPARING","orderNumber":"CAN-..."}
```

`NEW_ORDER` — New order placed (for staff):
```
data: {"type":"NEW_ORDER","orderId":"uuid","orderNumber":"CAN-...","total":94.5}
```

`heartbeat` — Keep-alive every 30s:
```
data: {"type":"heartbeat","time":"2024-10-17T08:00:00.000Z"}
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "errors": [ ... ]  // Only for validation errors (Zod)
}
```

| Status | Meaning |
|--------|---------|
| 400 | Bad Request / Validation Error |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient role) |
| 404 | Resource Not Found |
| 409 | Conflict (e.g., duplicate review) |
| 500 | Internal Server Error |

---

*Smart Canteen API Documentation — Register No: U23CB491*
