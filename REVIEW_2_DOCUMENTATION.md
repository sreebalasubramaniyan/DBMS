# DBMS LAB PROJECT — REVIEW 2
## Database Implementation & Core Functionalities (10 Marks)

**Project Title:** Restaurant Ordering and Management System Using MongoDB  
**Student Name:** Sree Balasubramaniyan  
**Registration Number:** 24BKT0162  
**Institution:** School of Computer Science and Engineering, VIT Vellore  
**Database:** MongoDB Atlas (Cloud NoSQL Database)  
**Cluster:** `cluster0.r6sjbfy.mongodb.net`  
**Database Name:** `restaurant_db`  

---

## 1. Review 2 Grading Criteria & Deliverables Mapping

| Criterion | Marks | Deliverable Status | Where Demonstrated |
| :--- | :---: | :---: | :--- |
| **Database Implementation** | **2 Marks** | ✅ Completed | 6 Collections created, ER-to-NoSQL mapping implemented with references & embedded documents. **67 sample records** loaded (Min requirement: 50). |
| **CRUD Operations Completed** | **3 Marks** | ✅ Completed | Full Create, Read, Update, Delete across Customer & Admin portals with live state updates. |
| **Advanced NoSQL Features** | **5 Marks** | ✅ Completed | 4 Aggregation Pipelines (`$match`, `$group`, `$lookup`, `$unwind`, `$project`, `$sort`), Text & Compound Indexes, and dynamic metric calculations. |
| **Total** | **10 / 10** | **Ready for Evaluation** | Complete source code, live MongoDB Atlas cluster, and dual-dashboard web application. |

---

## 2. Criterion 1: Database Implementation (2 Marks)

### A. MongoDB Collections & Schema Summary
The database `restaurant_db` is implemented on MongoDB Atlas with **6 collections**:

1. **`users` (5 documents):**
   - Fields: `_id`, `name`, `email`, `password`, `phone`, `role` (`customer` | `admin`), `address`, `createdAt`.
2. **`restaurants` (4 documents):**
   - Fields: `_id`, `name`, `cuisine`, `location`, `phone`, `rating`, `isOpen`, `createdAt`.
3. **`categories` (5 documents):**
   - Fields: `_id`, `name`, `description`, `createdAt`.
4. **`menuItems` (26 documents):**
   - Fields: `_id`, `restaurantId` (ref: Restaurant), `categoryId` (ref: Category), `name`, `description`, `price`, `isAvailable`.
5. **`orders` (15 documents):**
   - Fields: `_id`, `userId` (ref: User), `restaurantId` (ref: Restaurant), `items` (embedded subdocument array), `totalAmount`, `status`, `deliveryAddress`, `orderDate`.
6. **`reviews` (12 documents):**
   - Fields: `_id`, `userId` (ref: User), `restaurantId` (ref: Restaurant), `rating` (1–5), `comment`, `createdAt`.

**Total Documents Seeded:** **67 Documents** *(Comfortably exceeds the minimum 50 sample records requirement)*.

### B. Relationship & Embedding Strategy
- **Referencing (Normalized):**
  - `orders.userId` ➔ references `users._id`
  - `menuItems.restaurantId` ➔ references `restaurants._id`
  - `menuItems.categoryId` ➔ references `categories._id`
  - `reviews.restaurantId` ➔ references `restaurants._id`
- **Embedding (Denormalized - Document-Oriented Advantage):**
  - `orders.items[]` contains embedded objects: `{ menuItemId, name, price, quantity }`.
  - *Justification:* Line items are always accessed together with their parent order; embedding guarantees single-read retrieval without expensive joins.

---

> ### 📷 SCREENSHOT PLACEHOLDER 1: MongoDB Atlas Overview
> ```
> [PASTE SCREENSHOT HERE: MongoDB Atlas Web Interface showing cluster0.r6sjbfy.mongodb.net, database "restaurant_db", and the 6 collections with document count (67 total)]
> ```

---

> ### 📷 SCREENSHOT PLACEHOLDER 2: Embedded Document Structure in MongoDB
> ```
> [PASTE SCREENSHOT HERE: MongoDB Atlas document viewer showing an Order document with the embedded items array: [ { menuItemId, name, price, quantity } ] ]
> ```

---

## 3. Criterion 2: CRUD Operations Completed (3 Marks)

The system implements complete CRUD functionalities split across two dedicated, authenticated dashboards:

| Operation | Entity | User Role | Description |
| :--- | :--- | :--- | :--- |
| **CREATE** | `orders` | Customer | Placed an order with multiple dishes, address, and calculated total. |
| **CREATE** | `reviews` | Customer | Submitted 1–5 star rating and comment; triggers live restaurant rating recalculation. |
| **CREATE** | `restaurants` | Admin | Added new restaurant with cuisine, location, phone, and rating. |
| **CREATE** | `menuItems` | Admin | Added new dish linked to restaurant and category with price and description. |
| **CREATE** | `users` | Customer | Self-registration on signup portal. |
| **READ** | `restaurants` | Customer / Admin | Filter by search query (text search) and category chips. |
| **READ** | `menuItems` | Customer / Admin | Displayed menu items populated with category details. |
| **READ** | `orders` | Customer / Admin | Customer views order history; Admin views all live orders across restaurants. |
| **UPDATE** | `orders.status` | Admin | Inline status transition: `Placed` ➔ `Preparing` ➔ `Out for Delivery` ➔ `Delivered` ➔ `Cancelled`. |
| **UPDATE** | `restaurants` | Admin | Modal to edit name, cuisine, phone, or rating. |
| **UPDATE** | `menuItems` | Admin | Modal to update dish price, availability toggle, and description. |
| **DELETE** | `orders` | Admin | Cancel and delete order record from MongoDB. |
| **DELETE** | `menuItems` | Admin | Delete dish from menu catalog. |
| **DELETE** | `restaurants` | Admin | Delete restaurant and cascade clean up of associated dishes. |

---

> ### 📷 SCREENSHOT PLACEHOLDER 3: Login Portal & Role Authentication
> ```
> [PASTE SCREENSHOT HERE: http://localhost:3000 showing Login Portal with Customer / Admin quick credentials]
> ```

---

> ### 📷 SCREENSHOT PLACEHOLDER 4: Customer Dashboard (Browse & Order)
> ```
> [PASTE SCREENSHOT HERE: Customer Dashboard displaying restaurant cards, category filter chips, and cart basket]
> ```

---

> ### 📷 SCREENSHOT PLACEHOLDER 5: Customer Order History
> ```
> [PASTE SCREENSHOT HERE: Customer Dashboard "My Orders History" tab displaying placed orders and status badges]
> ```

---

> ### 📷 SCREENSHOT PLACEHOLDER 6: Admin Dashboard (Order Management & Status Updater)
> ```
> [PASTE SCREENSHOT HERE: Admin Dashboard showing Live Orders Tracker with the inline status dropdown selector]
> ```

---

> ### 📷 SCREENSHOT PLACEHOLDER 7: Admin CRUD Management (Restaurants & Menus)
> ```
> [PASTE SCREENSHOT HERE: Admin Dashboard showing Restaurants CRUD table or Menu Items CRUD table with Edit/Delete buttons]
> ```

---

## 4. Criterion 3: Advanced NoSQL Features (5 Marks)

### Feature 1: Multi-Stage Aggregation Pipeline — Revenue & Order Performance by Restaurant
- **Stages Used:** `$match` ➔ `$group` ➔ `$lookup` ➔ `$unwind` ➔ `$project` ➔ `$sort`
- **Purpose:** Groups non-cancelled orders by restaurant, computes total revenue, order count, and average order value, joins restaurant details, and formats the output.

```javascript
Order.aggregate([
  // Stage 1: Filter out cancelled orders
  { $match: { status: { $ne: 'Cancelled' } } },

  // Stage 2: Group by restaurantId and calculate metrics
  {
    $group: {
      _id: '$restaurantId',
      totalRevenue: { $sum: '$totalAmount' },
      orderCount: { $sum: 1 },
      avgOrderValue: { $avg: '$totalAmount' }
    }
  },

  // Stage 3: Join with restaurants collection
  {
    $lookup: {
      from: 'restaurants',
      localField: '_id',
      foreignField: '_id',
      as: 'restaurant'
    }
  },

  // Stage 4: Flatten joined restaurant array
  { $unwind: '$restaurant' },

  // Stage 5: Project readable fields and round averages
  {
    $project: {
      restaurantName: '$restaurant.name',
      cuisine: '$restaurant.cuisine',
      totalRevenue: 1,
      orderCount: 1,
      avgOrderValue: { $round: ['$avgOrderValue', 2] }
    }
  },

  // Stage 6: Sort by total revenue descending
  { $sort: { totalRevenue: -1 } }
]);
```

---

> ### 📷 SCREENSHOT PLACEHOLDER 8: Live Aggregation Pipeline 1 Output
> ```
> [PASTE SCREENSHOT HERE: Web App "MongoDB Aggregations (Review 2)" tab showing Pipeline 1 query and the live revenue table]
> ```

---

### Feature 2: Array Unwinding Aggregation — Top 5 Best-Selling Dishes
- **Stages Used:** `$match` ➔ `$unwind` ➔ `$group` ➔ `$project` ➔ `$sort` ➔ `$limit`
- **Purpose:** Deconstructs the embedded `items[]` array in `orders` to aggregate sales volume and total revenue per individual dish.

```javascript
Order.aggregate([
  // Stage 1: Exclude cancelled orders
  { $match: { status: { $ne: 'Cancelled' } } },

  // Stage 2: Deconstruct items array into individual document per item
  { $unwind: '$items' },

  // Stage 3: Group by item name and accumulate units & revenue
  {
    $group: {
      _id: '$items.name',
      totalQuantitySold: { $sum: '$items.quantity' },
      totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
    }
  },

  // Stage 4: Project clean field names
  {
    $project: {
      itemName: '$_id',
      totalQuantitySold: 1,
      totalRevenue: 1
    }
  },

  // Stage 5 & 6: Top ranking by quantity sold
  { $sort: { totalQuantitySold: -1 } },
  { $limit: 5 }
]);
```

---

> ### 📷 SCREENSHOT PLACEHOLDER 9: Live Aggregation Pipeline 2 Output ($unwind)
> ```
> [PASTE SCREENSHOT HERE: Web App "MongoDB Aggregations (Review 2)" tab showing Top 5 Best-Selling Dishes ranking table]
> ```

---

### Feature 3: Order Status & Review Rating Aggregations
1. **Order Status Breakdown:**
   ```javascript
   Order.aggregate([
     { $group: { _id: '$status', count: { $sum: 1 } } },
     { $project: { status: '$_id', count: 1, _id: 0 } },
     { $sort: { count: -1 } }
   ]);
   ```
2. **Average Restaurant Rating from Reviews:**
   ```javascript
   Review.aggregate([
     { $group: { _id: '$restaurantId', averageRating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } },
     { $lookup: { from: 'restaurants', localField: '_id', foreignField: '_id', as: 'restaurant' } },
     { $unwind: '$restaurant' },
     { $project: { restaurantName: '$restaurant.name', averageRating: { $round: ['$averageRating', 2] }, reviewCount: 1 } },
     { $sort: { averageRating: -1 } }
   ]);
   ```

---

> ### 📷 SCREENSHOT PLACEHOLDER 10: Status & Review Rating Aggregations
> ```
> [PASTE SCREENSHOT HERE: Web App "MongoDB Aggregations (Review 2)" tab showing Order Status Breakdown & Restaurant Ratings]
> ```

---

### Feature 4: Database Indexing Strategy
To optimize query performance on large datasets, explicit indexes were created on high-frequency query fields:

| Collection | Index Fields | Index Type | Performance Optimization Justification |
| :--- | :--- | :--- | :--- |
| `restaurants` | `{ name: "text", cuisine: "text", location: "text" }` | **Text Index** | Enables instant text search across restaurant name, cuisine type, and address without table scans. |
| `menuItems` | `{ restaurantId: 1, categoryId: 1, isAvailable: 1 }` | **Compound Index** | Accelerates restaurant menu loading and category filtering (`find({ restaurantId, categoryId })`). |
| `orders` | `{ userId: 1, orderDate: -1 }` | **Compound Index** | Optimizes retrieval and chronological ordering of customer purchase history. |
| `reviews` | `{ restaurantId: 1, createdAt: -1 }` | **Compound Index** | Accelerates review lookups and pipeline calculations for restaurant ratings. |

---

> ### 📷 SCREENSHOT PLACEHOLDER 11: Index Inspector in Web App / MongoDB Atlas
> ```
> [PASTE SCREENSHOT HERE: Web App Database Indexing Strategy table or MongoDB Atlas Indexes tab showing compound and text indexes]
> ```

---

## 5. Review 2 Lab Viva Q&A Guide

**Q1: Why did you choose MongoDB over a traditional Relational Database (SQL)?**  
*Answer:* In restaurant ordering systems, menus and orders have hierarchical, semi-structured characteristics. Storing order items as an **embedded document array** (`orders.items[]`) mirrors the real-world invoice and avoids expensive multi-table JOINs on every single order retrieval. MongoDB also provides powerful native aggregation pipelines for real-time sales reporting.

**Q2: What is the purpose of the `$unwind` stage in your aggregation?**  
*Answer:* In our schema, `orders.items` is an embedded array containing multiple dish items. `$unwind` deconstructs the array so that each element becomes an independent document. This allows us to group by `items.name` and sum quantities across all customer orders to identify the Top 5 Best-Selling Dishes.

**Q3: How do you handle relationships between collections in MongoDB?**  
*Answer:* We use a hybrid approach:
- **Referencing:** For many-to-many or independent entities like `User ➔ Order` (`userId`) and `Restaurant ➔ MenuItem` (`restaurantId`), storing `ObjectId` references.
- **Embedding:** For tightly bound child data that is never queried outside its parent, such as `Order ➔ OrderItems`, embedding provides atomic single-document reads.

**Q4: How does your indexing strategy improve performance?**  
*Answer:* Without indexes, MongoDB performs a collection scan (`COLLSCAN`) examining every document. By adding a compound index `{ restaurantId: 1, categoryId: 1, isAvailable: 1 }`, queries jump directly to matching dishes via an index scan (`IXSCAN`), reducing lookup time from $O(N)$ to $O(\log N)$.
