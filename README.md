# Restaurant Ordering and Management System using MongoDB

**Student:** Sree Balasubramaniyan  
**Registration Number:** 24BKT0162  
**Institution:** VIT Vellore  
**Course:** Database Management Systems (DBMS) Lab Project  
**Target:** Review 1 & Review 2 (10/10 Marks)

---

## 🎯 Review 2 Grading Rubric Fulfillment (10 Marks)

| Criterion | Marks Allocated | Implementation Deliverables in this Project |
| :--- | :---: | :--- |
| **Database Implementation** | **2 Marks** | • 6 MongoDB Collections: `users`, `restaurants`, `categories`, `menuItems`, `orders`, `reviews`<br>• ER-to-NoSQL Mapping with references & embedded documents (`orders.items[]`)<br>• **60+ realistic sample documents loaded** (Requirement: Minimum 50) |
| **CRUD Operations Completed** | **3 Marks** | • **Create:** Place orders, register users, add restaurants, add menu items, post reviews<br>• **Read:** Search restaurants, filter by cuisine/category, view menu, view customer order history<br>• **Update:** Admin update order status (`Placed` -> `Preparing` -> `Delivered`), edit restaurant & dish details<br>• **Delete:** Admin delete restaurants, menu items, or cancelled orders |
| **Advanced NoSQL Features** | **5 Marks** | • **Aggregation Pipeline 1:** Total revenue, order count, and average order value by restaurant (`$match`, `$group`, `$lookup`, `$unwind`, `$project`, `$sort`)<br>• **Aggregation Pipeline 2:** Top 5 Best-Selling Dishes by unwinding `orders.items[]` array<br>• **Aggregation Pipeline 3:** Order status distribution breakdown<br>• **Aggregation Pipeline 4:** Dynamic average restaurant rating calculation from `reviews`<br>• **Indexing:** Text index on `{name, cuisine, location}` and compound indexes on `menuItems` & `orders` |
| **Total** | **10 / 10 Marks** | **Fully functional full-stack web application with dedicated Aggregations Inspector tab** |

---

## 🔐 Login Credentials (Two Distinct Dashboards)

When you open `http://localhost:3000`, you will be greeted by the **Login Portal**. The system automatically redirects you to the appropriate dashboard based on your role:

| Dashboard | Email | Password | Role & Permissions |
| :--- | :--- | :--- | :--- |
| **Customer Dashboard** | `sree@vit.ac.in` | `password123` | Browse restaurants, add dishes to cart, place orders, view order history, and submit reviews. |
| **Customer (Alternate)** | `arun@example.com` | `password123` | Verified customer account for testing multi-user orders. |
| **Administrator Dashboard** | `admin@restaurant.com` | `adminpassword` | Manage Restaurants CRUD, Menu Items CRUD, Live Orders Tracker, User Directory, and **MongoDB Aggregations (Review 2)**. |

*Tip: The login screen includes **Quick Demo Login chips** so you or your professor can log in with a single click during the viva!*

---

## 🚀 How to Run the Project (Zero Setup, No Docker Needed)

### 1. Start the Server
Open your terminal in `c:\Projects\DBMS` and run:
```bash
npm start
```
*Note: The system automatically includes a built-in automated MongoDB instance. You do not need to install MongoDB or Docker manually!*

### 2. Open the Web Application
Open your web browser and navigate to:
```
http://localhost:3000
```

### 3. (Optional) Connect to MongoDB Atlas or Local MongoDB
If you want to connect to your own MongoDB Atlas cluster or local MongoDB service, simply add your connection string to `.env`:
```env
PORT=3000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/restaurant_db?retryWrites=true&w=majority
```
Then run `npm run seed` to load the 60+ sample records.

---

## 📂 Project Structure

```
c:\Projects\DBMS\
├── config\
│   └── db.js                 # MongoDB connection manager (Atlas / Local / Auto In-Memory)
├── models\
│   ├── User.js               # Users collection schema (customers & admin)
│   ├── Restaurant.js         # Restaurants schema with text search index
│   ├── Category.js           # Food categories schema
│   ├── MenuItem.js           # Menu items schema with compound index
│   ├── Order.js              # Orders schema with embedded items[] array
│   └── Review.js             # Reviews schema with rating & comments
├── routes\
│   ├── auth.js               # User registration, login, and profile routes
│   ├── restaurants.js        # Restaurant CRUD routes
│   ├── categories.js         # Category routes
│   ├── menu.js               # Menu item CRUD routes
│   ├── orders.js             # Order placement, status tracking & updates
│   ├── reviews.js            # Review submission & dynamic rating update
│   └── analytics.js          # MongoDB Aggregation Pipelines (Review 2 deliverable)
├── scripts\
│   └── seed.js               # Database seeder (inserts 60+ realistic documents)
├── public\
│   ├── index.html            # Web interface (Customer, Admin & Aggregation views)
│   ├── style.css             # Responsive styling
│   └── app.js                # Frontend state management & API integration
├── server.js                 # Express application entrypoint
├── package.json              # Project dependencies & scripts
└── .env                      # Environment configuration
```

---

## 📊 Key MongoDB Aggregation Pipelines Explained (Review 2)

### 1. Revenue & Order Volume by Restaurant
```javascript
Order.aggregate([
  { $match: { status: { $ne: 'Cancelled' } } },
  { 
    $group: { 
      _id: '$restaurantId', 
      totalRevenue: { $sum: '$totalAmount' }, 
      orderCount: { $sum: 1 }, 
      avgOrderValue: { $avg: '$totalAmount' } 
    } 
  },
  { $lookup: { from: 'restaurants', localField: '_id', foreignField: '_id', as: 'restaurant' } },
  { $unwind: '$restaurant' },
  { 
    $project: { 
      restaurantName: '$restaurant.name', 
      cuisine: '$restaurant.cuisine', 
      totalRevenue: 1, 
      orderCount: 1, 
      avgOrderValue: { $round: ['$avgOrderValue', 2] } 
    } 
  },
  { $sort: { totalRevenue: -1 } }
]);
```

### 2. Top 5 Best-Selling Dishes ($unwind Array)
```javascript
Order.aggregate([
  { $match: { status: { $ne: 'Cancelled' } } },
  { $unwind: '$items' },
  { 
    $group: { 
      _id: '$items.name', 
      totalQuantitySold: { $sum: '$items.quantity' }, 
      totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } 
    } 
  },
  { $project: { itemName: '$_id', totalQuantitySold: 1, totalRevenue: 1 } },
  { $sort: { totalQuantitySold: -1 } },
  { $limit: 5 }
]);
```

---

## 🎓 Quick Lab Viva / Presentation Demonstration Steps

1. **Start the app:** Show `http://localhost:3000`. Point out the header with your name and registration number: `Sree Balasubramaniyan (24BKT0162)`.
2. **Customer View:**
   - Browse restaurants (*Spice Hub, Bella Italia, Burger House, Sweet Treats*).
   - Filter by search or category.
   - Click *Spice Hub* to view the menu, add an item to the basket, and place an order.
   - Switch to **My Orders History** to show the newly created order in MongoDB.
3. **Admin View (CRUD):**
   - Show the summary counters (Revenue, Orders, Restaurants, Menu Items).
   - In **Orders Management**, change the status of an order from `Placed` to `Preparing` or `Delivered`.
   - In **Restaurants CRUD** or **Menu Items CRUD**, demonstrate adding, editing, or deleting a dish.
4. **MongoDB Aggregations View (Review 2 Core - 5 Marks):**
   - Click the **MongoDB Aggregations (Review 2)** tab.
   - Show the professor the exact aggregation queries alongside their live computed results (Revenue by restaurant, Top 5 selling items via `$unwind`, and Order Status breakdown).
   - Point out the **Database Indexing Strategy** table demonstrating Text & Compound Indexes.
