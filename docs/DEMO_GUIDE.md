# Demo Guide
## Smart Canteen Pre-Order & Queue Management System

**Register Number:** U23CB491

This guide walks through a complete live demo of the system, covering all three user portals.

---

## Pre-Demo Checklist

Before starting the demo, ensure:
- [ ] Backend running: `cd server && npx ts-node src/index.ts` → Port 5000
- [ ] Frontend running: `cd client && npm run dev` → Port 5173
- [ ] Database seeded with demo data
- [ ] Browser open at **http://localhost:5173**
- [ ] Two browser windows/tabs ready (for Customer + Staff side-by-side)

---

## Demo Flow Overview

```
1. Landing Page (1 min)
2. Student Registration & Login (2 min)
3. Browse Menu + Add to Cart (2 min)
4. Checkout with Pickup Slot (2 min)
5. Order Confirmation + Queue Token (1 min)
6. Real-Time Order Tracking (2 min)
7. Staff Portal — Queue Management (3 min)
8. Admin Portal — Dashboard & Analytics (3 min)
9. Admin — Menu & Inventory Management (2 min)
10. Feedback & Review Flow (1 min)
```

**Total: ~19 minutes**

---

## Step 1: Landing Page

**URL:** http://localhost:5173

Point out:
- Hero section with tagline "Skip the Queue. Eat on Time."
- Feature highlights (pre-order, real-time tracking, queue token)
- Statistics: 25+ Menu Items, 9 Pickup Slots, 3 User Roles
- Call-to-action buttons: "Get Started Free" and "Sign In"

**Say:** *"This is the main entry point for students and staff. No login required to see the landing page."*

---

## Step 2: Quick Demo Login (Admin)

**URL:** http://localhost:5173/login

1. Show the **Quick Demo Login** section — three pre-filled buttons
2. Click **"👑 Admin"** — it auto-fills `admin@canteen.demo` / `admin123`
3. Click **"Sign In"**

**Say:** *"In a real deployment, students would register with their college email. For this demo, we have pre-seeded accounts."*

---

## Step 3: Admin Dashboard

**URL:** http://localhost:5173/admin

Show:
- Four KPI stat cards: Total Revenue, Today's Orders, Avg Order Value, Pending Orders
- **Revenue chart** — Last 7 days bar chart
- **Status breakdown** pie chart
- Popular Items leaderboard (shows "No data yet" for fresh install)
- Low Stock Alerts panel
- **"Export CSV"** button in the top right

**Say:** *"Admins have full visibility into the business. All metrics update in real time as orders come in."*

---

## Step 4: Menu Management (Admin)

Click **"Menu Management"** in the sidebar.

Show:
- List of 25+ seeded menu items with category, price, stock
- **Toggle switch** — click one to toggle availability (no page reload!)
- Click **"+ Add Item"** → show the modal form (then close without saving)
- Click the **pencil icon** on any item to show the edit modal
- Show the **"+ Add Category"** button

**Say:** *"Admins can add, edit, and toggle items instantly. The toggle updates availability in real time — customers won't see the item until it's re-enabled."*

---

## Step 5: Inventory Management (Admin)

Click **"Inventory"** in the sidebar.

Show:
- Table with stock levels and color coding:
  - 🟢 Green = good stock
  - 🟡 Amber = low stock (<10)
  - 🔴 Red = out of stock
- Low stock banner at top (if any items < 10)
- Click **"Adjust Stock"** on any item → expand inline form
- Enter quantity 50 and reason "Morning restock", click **"Add Stock"**
- Stock count updates immediately

**Say:** *"Every stock adjustment is logged with a reason and timestamp for full audit trail."*

---

## Step 6: Switch to Student Portal

**Open a new browser tab or use Incognito mode**

1. Navigate to **http://localhost:5173/login**
2. Click **"🎓 Student"** quick login button
3. Click **"Sign In"**

You're now in the **Customer Portal**.

---

## Step 7: Browse Menu

**URL:** http://localhost:5173/menu

Show:
- Category tabs at the top — click each to filter
- Search bar — type "dosa" to filter
- **Veg Only** toggle — show it filters the list
- Click a menu item card to see detail page
  - Show: description, allergen info, prep time, rating, reviews

**Say:** *"Students can easily find their favourite dishes with filters and search. Allergen info helps students with dietary restrictions."*

---

## Step 8: Add to Cart

1. Click **"Add to Cart"** on several items
2. See the cart badge update in the top nav
3. Navigate to cart (click cart icon or sidebar)

In the cart:
- Show quantity +/- buttons
- Show the price breakdown: Subtotal, GST (5%), Total
- Click **"Proceed to Checkout"**

---

## Step 9: Checkout — Slot Selection

**URL:** http://localhost:5173/checkout

Show:
1. **Date picker** — select today's date
2. **Pickup Slots** — show time slots with remaining capacity indicators
   - Hover over a nearly-full slot
3. Select any available slot
4. Leave **Payment Method** as Cash
5. Add a **note**: "Extra spicy please"
6. Click **"Place Order"**

**Say:** *"The slot capacity system ensures the kitchen isn't overloaded. Once a slot fills up, it's automatically disabled."*

---

## Step 10: Order Confirmation + Token

Show:
- ✅ Success screen
- **Order number** (e.g., CAN-20241017-4521)
- 🎟️ **Queue Token** (e.g., Token #7)
- Order summary with items and total
- Pickup slot and date
- **"Track Order"** button

**Say:** *"Each order gets a unique queue token. The student takes this token and waits at the counter. When the staff calls Token #7, they collect their food — no standing in line!"*

---

## Step 11: Real-Time Tracking

Click **"Track Order"**.

**URL:** http://localhost:5173/track/:orderId

Show:
- Status progress bar: PLACED → CONFIRMED → PREPARING → READY → COMPLETED
- Current status highlighted
- Order details below

**Now switch to the Staff tab (keep this tab visible)**

**Say:** *"This updates in real time. Watch what happens when the staff processes the order..."*

---

## Step 12: Staff Portal — Queue Management

**Open another tab** → **http://localhost:5173/login** → click **"👨‍🍳 Staff"** → Sign In

Click **"Queue"** in the sidebar.

Show:
- The student's order appears in the queue
- Token number, customer name, items ordered, pickup slot
- Click **"Confirm"** → status changes to CONFIRMED
- Click **"Call Next"** button at top → moves to PREPARING

**Switch back to the Student tracking tab!**

The progress bar has jumped to **PREPARING** automatically (SSE real-time update).

**Say:** *"That update happened instantly via Server-Sent Events — no polling, no page refresh needed. The student knows their food is being prepared."*

Back in Staff portal:
- Click **"Mark Ready"** → READY
- Watch the student tab update again
- Final: Click **"Complete"** → COMPLETED

---

## Step 13: Admin Analytics

**Switch back to Admin tab**

Click **"Analytics"** in the sidebar.

Show:
- **Revenue & Order Trend** — dual-axis line chart
- **Top 10 Popular Items** — horizontal bar chart
- **Payment Methods** pie chart with revenue breakdown
- **Daily Order Volume** bar chart
- **"Export CSV"** button

Click **"Export CSV"** to download the report.

**Say:** *"The admin can track revenue, popular items, and payment trends to make informed decisions about the menu and staffing."*

---

## Step 14: User Management

Click **"Users"** in the sidebar.

Show:
- Student, Staff, Admin accounts listed
- **Role dropdown** — show how you can change a user's role in-place
- **Shield icon** — show deactivate/activate toggle
- Search bar — search for "student"

**Say:** *"Admins can manage all users — activate/deactivate accounts, change roles, without touching the database."*

---

## Step 15: Feedback Moderation

Click **"Feedback"** in the sidebar.

**Switch to Student tab first:** go to **My Orders** → click the completed order → click **"Leave a Review"** → give 5 stars and write "Excellent food, quick service!" → submit.

**Back in Admin tab:** refresh Feedback page.

Show:
- The new review appears
- Average rating stat card
- Filter by rating buttons
- Click 👁️ eye to hide the review
- Review gets "Hidden" badge

**Say:** *"Admins can moderate reviews to prevent abuse, while keeping authentic feedback visible to other students."*

---

## Demo Summary

In this demo we covered:

| Feature | Demonstrated |
|---------|-------------|
| User Authentication | ✅ Quick demo login, JWT |
| Menu Browsing | ✅ Search, filter, veg toggle |
| Cart & Checkout | ✅ Add items, slot selection |
| Queue Token | ✅ Unique token generated |
| Real-Time Tracking | ✅ SSE live updates |
| Staff Queue Management | ✅ Call next, status transitions |
| Admin Dashboard | ✅ KPIs, charts |
| Menu CRUD | ✅ Add/edit/toggle |
| Inventory Management | ✅ Stock adjust with audit |
| User Management | ✅ Role change, activate/deactivate |
| Feedback Moderation | ✅ Hide/show reviews |
| Analytics | ✅ Charts, CSV export |

---

## Key Talking Points

1. **Zero-Queue Experience** — Pre-order eliminates physical queuing
2. **Real-Time Updates** — SSE pushes status changes instantly  
3. **Role-Based Security** — JWT + middleware protects all routes
4. **Atomic Transactions** — Checkout uses Prisma transactions (stock + order + payment)
5. **Audit Trail** — All inventory changes logged
6. **Scalable Architecture** — React + Express + Prisma ready for production

---

*Smart Canteen Demo Guide — Register No: U23CB491*
