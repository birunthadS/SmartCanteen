# User Guide
## Smart Canteen Pre-Order & Queue Management System

**Version:** 1.0.0 | **Register No:** U23CB491

---

## Introduction

This guide explains how to use the Smart Canteen system for each type of user. The system has three portals:
- **Customer Portal** — For students and staff ordering food
- **Staff Portal** — For canteen staff managing orders
- **Admin Portal** — For canteen administrators

---

## Getting Started

### Accessing the System

Open your browser and navigate to: **http://localhost:5173**

You will see the landing page with a **"Get Started Free"** button and a **"Sign In"** button.

---

## 👨‍🎓 Customer Guide

### 1. Creating an Account

1. Click **"Get Started Free"** or **"Register"** in the navigation
2. Fill in your details:
   - Full Name
   - Email address
   - Phone number
   - Password (minimum 8 characters)
3. Click **"Create Account"**
4. You'll be redirected to the menu automatically

### 2. Logging In

1. Click **"Login"** or navigate to `/login`
2. Enter your email and password
3. Click **"Sign In"**

> **Quick Demo Login:** The login page has pre-filled buttons for Student, Staff, and Admin demo accounts.

---

### 3. Browsing the Menu

After logging in, you'll see the **Menu** page:

- **Category Tabs** — Click tabs (All, South Indian, Main Course, etc.) to filter
- **Search Bar** — Type to search by dish name
- **Veg Only Toggle** — Filter vegetarian items only
- **Item Cards** — Show name, price, preparation time, veg/non-veg badge, stock status

Click any item card to see its full details, ingredients, allergen info, and reviews.

---

### 4. Adding Items to Cart

**From Menu page:**
1. Click **"Add to Cart"** on any item card
2. A toast notification confirms the addition
3. The cart icon in the top bar shows the item count

**From Item Detail page:**
1. Use **+/-** buttons to select quantity
2. Click **"Add to Cart"**

**Viewing Cart:**
- Click the cart icon (🛒) in the top navigation
- Or navigate to `/cart`

In the cart you can:
- Increase/decrease quantities with + and – buttons
- Remove an item with the trash icon
- See subtotal, 5% GST, and total amount

---

### 5. Placing an Order (Checkout)

1. From the Cart page, click **"Proceed to Checkout"**
2. **Select Date** — Choose your pickup date (today or future dates)
3. **Select Time Slot** — Available slots are shown with remaining capacity
   - Slots showing "Full" cannot be selected
4. **Payment Method** — Choose Cash or Online
5. **Special Notes** — Optional instructions (e.g., "Extra spicy", "No onions")
6. Click **"Place Order"**

The system will:
- Reserve your slot
- Generate a unique Queue Token number
- Create your order

---

### 6. Your Queue Token

After placing the order, you'll see the **Order Confirmation** page showing:
- ✅ Order number (e.g., `CAN-20241017-4521`)
- 🎟️ Token number (e.g., `T-07`)
- 📍 Your pickup slot and date
- 💰 Payment details

**Keep your token number** — the staff will call your token when your food is ready.

---

### 7. Tracking Your Order

Click **"Track Order"** on the confirmation page or find it in **Order History**.

The tracking page shows a live progress bar:

```
🔵 PLACED → ✅ CONFIRMED → 🍳 PREPARING → 🔔 READY → ✅ COMPLETED
```

Updates appear automatically in real time (no need to refresh).

When status is **READY**, head to the counter with your token number.

---

### 8. Order History

Navigate to **My Orders** (sidebar) to see all past and active orders.

- Click any order to see full details
- **Repeat Order** — Adds the same items back to your cart
- Orders with status `COMPLETED` show a **"Leave a Review"** button

---

### 9. Notifications

Click the 🔔 bell icon to see your notifications:
- Order status updates
- System messages

Click **"Mark all as read"** to clear the badge.

---

### 10. Leaving a Review

After your order is **Completed**:
1. Go to **My Orders** and click the order
2. Click **"Leave a Review"**
3. Select a star rating (1–5)
4. Write an optional comment
5. Click **"Submit Review"**

You can leave one review per order.

---

### 11. Your Profile

Click your name or navigate to **Profile**:
- Update your name and phone number
- Change your password

---

## 👨‍🍳 Staff Guide

Staff accounts access a dedicated dashboard at `/staff`.

### 1. Staff Dashboard

Shows today's summary:
- Orders by status (Placed, Confirmed, Preparing, Ready)
- Quick action buttons

### 2. Queue Management

Navigate to **Queue** in the sidebar:
- All active orders are shown in chronological order
- Each entry shows: Token number, Customer name, Items ordered, Time slot

**To process the next order:**
1. Click **"Call Next"** at the top
2. The next CONFIRMED order moves to PREPARING status
3. The customer is notified automatically

**To update status manually:**
1. Click on an order row
2. Click the appropriate status button:
   - **Confirm** (PLACED → CONFIRMED)
   - **Start Preparing** (CONFIRMED → PREPARING)
   - **Mark Ready** (PREPARING → READY)
   - **Complete** (READY → COMPLETED)

### 3. Inventory View

Navigate to **Inventory**:
- See current stock levels for all items
- Items with stock < 10 are highlighted in amber
- Out-of-stock items are highlighted in red

> Note: Stock adjustments require Admin access.

---

## 🛡️ Admin Guide

Admin accounts access the full admin panel at `/admin`.

### 1. Admin Dashboard

The dashboard shows:
- **Revenue** — Total from paid orders
- **Today's Orders** — Scheduled for today
- **Avg Order Value** — Per completed order
- **Pending Orders** — Awaiting action

Charts show:
- Last 7 days revenue bar chart
- Orders by status pie chart
- Popular items leaderboard
- Low stock alerts

Click **"Export CSV"** to download a sales report.

---

### 2. Menu Management

Navigate to **Menu Management**:

**Add a New Item:**
1. Click **"+ Add Item"**
2. Fill in: Name, Price, Category, Prep Time, Stock, Description
3. Toggle Vegetarian and Available as needed
4. Click **"Create"**

**Edit an Item:**
1. Click the pencil icon (✏️) next to any item
2. Update fields and click **"Update"**

**Toggle Availability:**
- Click the toggle switch in the Status column to enable/disable an item instantly (no page reload)

**Delete an Item:**
- Click the trash icon (🗑️) and confirm

**Add a Category:**
1. Click **"+ Add Category"**
2. Enter the category name and click **"Create"**

---

### 3. Inventory Management

Navigate to **Inventory**:

**Adjust Stock:**
1. Find the item in the table
2. Click **"Adjust Stock"**
3. Enter quantity and optional reason
4. Click **"Add Stock"** or **"Remove Stock"**

Every stock adjustment is logged in the audit trail with timestamp and reason.

**Low Stock Alert:**
A banner appears at the top listing all items with fewer than 10 units.

---

### 4. Orders Management

Navigate to **Orders**:

**Filters:**
- Search by order number, customer name, or email
- Filter by status (Placed, Confirmed, Preparing, Ready, Completed, Cancelled)
- Filter by date

**Export:**
Click **"Export CSV"** to download all filtered orders as a spreadsheet.

**Pagination:**
Orders are shown 20 per page. Use ← → arrows to navigate.

---

### 5. User Management

Navigate to **Users**:

**Search/Filter:**
- Search by name or email
- Filter by role (Student, Staff, Admin)

**Change Role:**
Use the dropdown in the Role column to instantly switch a user's role.

**Activate/Deactivate:**
Click the shield icon to toggle a user's active status.
- Deactivated users cannot log in.

---

### 6. Feedback Moderation

Navigate to **Feedback**:

**Filter by Rating:**
Use the star buttons (1–5) at the top to filter by rating.

**Hide a Review:**
Click the 👁️ eye icon to hide a review from public view.  
Click again to make it visible again.

**Delete a Review:**
Click the 🗑️ trash icon and confirm. This is permanent.

---

### 7. Analytics

Navigate to **Analytics**:

View detailed charts:
- **Revenue & Order Trend** — Dual-axis line chart (7 days)
- **Top 10 Popular Items** — Horizontal bar chart
- **Payment Methods** — Pie chart with revenue breakdown
- **Daily Order Volume** — Bar chart

---

## Common Issues & Tips

| Issue | Solution |
|-------|----------|
| Can't add item to cart | Item may be out of stock or unavailable |
| Pickup slot shows "Full" | Choose a different time slot or date |
| Can't leave a review | Order must be in COMPLETED status |
| Token not shown | Check Order History → Order Details |
| SSE not updating | Refresh the tracking page |

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|---------|
| Open cart | Click cart icon in nav |
| Search menu | Click search bar or type |
| Close modals | Press `Escape` or click backdrop |

---

*Smart Canteen User Guide — Register No: U23CB491*
