require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../config/db');

const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Category = require('../models/Category');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const Review = require('../models/Review');

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('[Seed] Clearing existing collections...');

    await Promise.all([
      User.deleteMany({}),
      Restaurant.deleteMany({}),
      Category.deleteMany({}),
      MenuItem.deleteMany({}),
      Order.deleteMany({}),
      Review.deleteMany({})
    ]);

    console.log('[Seed] Inserting Users...');
    const users = await User.insertMany([
      { name: 'Sree Balasubramaniyan', email: 'sree@vit.ac.in', password: 'password123', phone: '9876543210', role: 'customer', address: 'Block D, VIT Vellore' },
      { name: 'Arun Kumar', email: 'arun@example.com', password: 'password123', phone: '9876543211', role: 'customer', address: 'Green Avenue, Katpadi' },
      { name: 'Priya Sharma', email: 'priya@example.com', password: 'password123', phone: '9876543212', role: 'customer', address: 'Hostel Block A, VIT' },
      { name: 'Rahul Varma', email: 'rahul@example.com', password: 'password123', phone: '9876543213', role: 'customer', address: 'Main Street, Vellore' },
      { name: 'Admin Manager', email: 'admin@restaurant.com', password: 'adminpassword', phone: '9876543299', role: 'admin', address: 'Management Office, Vellore' }
    ]);

    console.log('[Seed] Inserting Categories...');
    const categories = await Category.insertMany([
      { name: 'Biryani', description: 'Aromatic traditional basmati rice dishes cooked with authentic spices' },
      { name: 'Beverages', description: 'Chilled soft drinks, fresh fruit juices, and mocktails' },
      { name: 'Desserts', description: 'Sweet delicacies, pastries, and ice creams' },
      { name: 'Burgers & Wraps', description: 'Gourmet burgers with loaded patties and freshly rolled wraps' },
      { name: 'Pizzas & Pasta', description: 'Handcrafted wood-fired pizzas and creamy authentic pasta' }
    ]);

    const catMap = {};
    categories.forEach(c => { catMap[c.name] = c._id; });

    console.log('[Seed] Inserting Restaurants...');
    const restaurants = await Restaurant.insertMany([
      { name: 'Spice Hub', cuisine: 'Indian & Mughlai', location: 'Gandhi Nagar, Vellore', phone: '0416-2244111', rating: 4.8, isOpen: true },
      { name: 'Burger House', cuisine: 'Fast Food & Grills', location: 'Katpadi Main Road, Vellore', phone: '0416-2244222', rating: 4.5, isOpen: true },
      { name: 'Bella Italia', cuisine: 'Italian', location: 'VIT Circle, Vellore', phone: '0416-2244333', rating: 4.7, isOpen: true },
      { name: 'Sweet Treats & Cafe', cuisine: 'Desserts & Beverages', location: 'Phase 2, Sathuvachari, Vellore', phone: '0416-2244444', rating: 4.4, isOpen: true }
    ]);

    const restMap = {};
    restaurants.forEach(r => { restMap[r.name] = r._id; });

    console.log('[Seed] Inserting Menu Items (25+ items)...');
    const menuItems = await MenuItem.insertMany([
      // Spice Hub (Biryani & Beverages)
      { restaurantId: restMap['Spice Hub'], categoryId: catMap['Biryani'], name: 'Hyderabadi Chicken Biryani', description: 'Rich, spicy dum biryani served with mirchi ka salan and raita', price: 220, isAvailable: true },
      { restaurantId: restMap['Spice Hub'], categoryId: catMap['Biryani'], name: 'Mutton Dum Biryani', description: 'Tender mutton cooked with saffron rice and secret royal spices', price: 340, isAvailable: true },
      { restaurantId: restMap['Spice Hub'], categoryId: catMap['Biryani'], name: 'Paneer Tikka Biryani', description: 'Marinated cottage cheese layered with fragrant basmati rice', price: 190, isAvailable: true },
      { restaurantId: restMap['Spice Hub'], categoryId: catMap['Biryani'], name: 'Egg Biryani', description: 'Classic spiced rice served with two seasoned hard boiled eggs', price: 160, isAvailable: true },
      { restaurantId: restMap['Spice Hub'], categoryId: catMap['Beverages'], name: 'Fresh Mint Lime Juice', description: 'Zesty fresh lime blended with cooling garden mint', price: 60, isAvailable: true },
      { restaurantId: restMap['Spice Hub'], categoryId: catMap['Beverages'], name: 'Sweet Punjabi Lassi', description: 'Thick creamy churned yogurt topped with dry fruits', price: 80, isAvailable: true },
      { restaurantId: restMap['Spice Hub'], categoryId: catMap['Desserts'], name: 'Gulab Jamun (2 pcs)', description: 'Golden fried milk dumplings soaked in saffron sugar syrup', price: 70, isAvailable: true },

      // Burger House (Burgers & Wraps, Beverages, Desserts)
      { restaurantId: restMap['Burger House'], categoryId: catMap['Burgers & Wraps'], name: 'Crispy Chicken Zinger Burger', description: 'Extra crispy chicken patty with spicy mayo and shredded lettuce', price: 180, isAvailable: true },
      { restaurantId: restMap['Burger House'], categoryId: catMap['Burgers & Wraps'], name: 'Double Cheese Smash Burger', description: 'Twin grilled beef/chicken patties with melted cheddar cheese', price: 240, isAvailable: true },
      { restaurantId: restMap['Burger House'], categoryId: catMap['Burgers & Wraps'], name: 'Aloo Tikki Crunchy Burger', description: 'Spiced potato patty with tangy mint chutney and tomatoes', price: 110, isAvailable: true },
      { restaurantId: restMap['Burger House'], categoryId: catMap['Burgers & Wraps'], name: 'Grilled Paneer Wrap', description: 'Soft tortilla rolled with grilled paneer and smoky southwest sauce', price: 150, isAvailable: true },
      { restaurantId: restMap['Burger House'], categoryId: catMap['Burgers & Wraps'], name: 'Spicy Chicken Wrap', description: 'Tender chicken strips with chipotle dressing and crispy veggies', price: 170, isAvailable: true },
      { restaurantId: restMap['Burger House'], categoryId: catMap['Beverages'], name: 'Belgian Chocolate Milkshake', description: 'Rich chocolate shake topped with whipped cream and cocoa drizzle', price: 130, isAvailable: true },
      { restaurantId: restMap['Burger House'], categoryId: catMap['Beverages'], name: 'Iced Lemon Tea', description: 'Refreshing brewed black tea infused with lemon zest', price: 70, isAvailable: true },

      // Bella Italia (Pizzas & Pasta, Desserts)
      { restaurantId: restMap['Bella Italia'], categoryId: catMap['Pizzas & Pasta'], name: 'Margherita Woodfire Pizza', description: 'Classic mozzarella, San Marzano tomatoes, and fresh basil', price: 280, isAvailable: true },
      { restaurantId: restMap['Bella Italia'], categoryId: catMap['Pizzas & Pasta'], name: 'Spicy Pepperoni & Jalapeno Pizza', description: 'Loaded spicy pepperoni slices with fiery jalapenos and mozzarella', price: 390, isAvailable: true },
      { restaurantId: restMap['Bella Italia'], categoryId: catMap['Pizzas & Pasta'], name: 'Creamy Alfredo Penne', description: 'Penne pasta tossed in rich parmesan garlic cream sauce with mushrooms', price: 260, isAvailable: true },
      { restaurantId: restMap['Bella Italia'], categoryId: catMap['Pizzas & Pasta'], name: 'Spicy Arrabbiata Fusilli', description: 'Fiery tomato sauce with garlic, red chili flakes, and black olives', price: 240, isAvailable: true },
      { restaurantId: restMap['Bella Italia'], categoryId: catMap['Pizzas & Pasta'], name: 'Garlic Bread with Melted Cheese', description: 'Toasted baguette with herbs, roasted garlic butter, and mozzarella', price: 140, isAvailable: true },
      { restaurantId: restMap['Bella Italia'], categoryId: catMap['Desserts'], name: 'Classic Italian Tiramisu', description: 'Espresso-soaked ladyfingers with mascarpone cheese and cocoa', price: 190, isAvailable: true },

      // Sweet Treats & Cafe (Desserts & Beverages)
      { restaurantId: restMap['Sweet Treats & Cafe'], categoryId: catMap['Desserts'], name: 'Death by Chocolate Cake Slice', description: 'Decadent multi-layered dark chocolate sponge with fudge icing', price: 160, isAvailable: true },
      { restaurantId: restMap['Sweet Treats & Cafe'], categoryId: catMap['Desserts'], name: 'New York Cheesecake', description: 'Silky smooth baked cream cheese over a graham cracker crust', price: 210, isAvailable: true },
      { restaurantId: restMap['Sweet Treats & Cafe'], categoryId: catMap['Desserts'], name: 'Warm Brownie with Vanilla Ice Cream', description: 'Fudgy walnut brownie served warm with a scoop of vanilla bean gelato', price: 140, isAvailable: true },
      { restaurantId: restMap['Sweet Treats & Cafe'], categoryId: catMap['Beverages'], name: 'Caramel Macchiato (Hot)', description: 'Steamed milk with vanilla syrup, marked with espresso and caramel', price: 150, isAvailable: true },
      { restaurantId: restMap['Sweet Treats & Cafe'], categoryId: catMap['Beverages'], name: 'Cold Brew Coffee', description: 'Slow-steeped smooth artisan coffee served over ice', price: 120, isAvailable: true },
      { restaurantId: restMap['Sweet Treats & Cafe'], categoryId: catMap['Beverages'], name: 'Strawberry Basil Mojito (Mocktail)', description: 'Crushed strawberries, fresh basil, and sparkling soda', price: 110, isAvailable: true }
    ]);

    const itemMap = {};
    menuItems.forEach(m => { itemMap[m.name] = m; });

    console.log('[Seed] Inserting Orders (15+ sample orders with embedded items)...');
    const orders = await Order.insertMany([
      {
        userId: users[0]._id, // Sree
        restaurantId: restMap['Spice Hub'],
        items: [
          { menuItemId: itemMap['Hyderabadi Chicken Biryani']._id, name: 'Hyderabadi Chicken Biryani', price: 220, quantity: 2 },
          { menuItemId: itemMap['Fresh Mint Lime Juice']._id, name: 'Fresh Mint Lime Juice', price: 60, quantity: 1 }
        ],
        totalAmount: 500,
        status: 'Delivered',
        deliveryAddress: 'Block D, Room 302, VIT Vellore',
        orderDate: new Date(Date.now() - 1000 * 60 * 60 * 48)
      },
      {
        userId: users[1]._id, // Arun
        restaurantId: restMap['Burger House'],
        items: [
          { menuItemId: itemMap['Crispy Chicken Zinger Burger']._id, name: 'Crispy Chicken Zinger Burger', price: 180, quantity: 1 },
          { menuItemId: itemMap['Belgian Chocolate Milkshake']._id, name: 'Belgian Chocolate Milkshake', price: 130, quantity: 1 }
        ],
        totalAmount: 310,
        status: 'Delivered',
        deliveryAddress: 'Green Avenue, Katpadi',
        orderDate: new Date(Date.now() - 1000 * 60 * 60 * 36)
      },
      {
        userId: users[2]._id, // Priya
        restaurantId: restMap['Bella Italia'],
        items: [
          { menuItemId: itemMap['Margherita Woodfire Pizza']._id, name: 'Margherita Woodfire Pizza', price: 280, quantity: 1 },
          { menuItemId: itemMap['Classic Italian Tiramisu']._id, name: 'Classic Italian Tiramisu', price: 190, quantity: 1 }
        ],
        totalAmount: 470,
        status: 'Delivered',
        deliveryAddress: 'Hostel Block A, VIT',
        orderDate: new Date(Date.now() - 1000 * 60 * 60 * 24)
      },
      {
        userId: users[3]._id, // Rahul
        restaurantId: restMap['Spice Hub'],
        items: [
          { menuItemId: itemMap['Mutton Dum Biryani']._id, name: 'Mutton Dum Biryani', price: 340, quantity: 1 },
          { menuItemId: itemMap['Sweet Punjabi Lassi']._id, name: 'Sweet Punjabi Lassi', price: 80, quantity: 1 }
        ],
        totalAmount: 420,
        status: 'Preparing',
        deliveryAddress: 'Main Street, Vellore',
        orderDate: new Date(Date.now() - 1000 * 60 * 45)
      },
      {
        userId: users[0]._id, // Sree
        restaurantId: restMap['Burger House'],
        items: [
          { menuItemId: itemMap['Double Cheese Smash Burger']._id, name: 'Double Cheese Smash Burger', price: 240, quantity: 2 },
          { menuItemId: itemMap['Iced Lemon Tea']._id, name: 'Iced Lemon Tea', price: 70, quantity: 2 }
        ],
        totalAmount: 620,
        status: 'Placed',
        deliveryAddress: 'Block D, Room 302, VIT Vellore',
        orderDate: new Date(Date.now() - 1000 * 60 * 15)
      },
      {
        userId: users[1]._id, // Arun
        restaurantId: restMap['Sweet Treats & Cafe'],
        items: [
          { menuItemId: itemMap['Death by Chocolate Cake Slice']._id, name: 'Death by Chocolate Cake Slice', price: 160, quantity: 1 },
          { menuItemId: itemMap['Cold Brew Coffee']._id, name: 'Cold Brew Coffee', price: 120, quantity: 1 }
        ],
        totalAmount: 280,
        status: 'Delivered',
        deliveryAddress: 'Green Avenue, Katpadi',
        orderDate: new Date(Date.now() - 1000 * 60 * 60 * 12)
      },
      {
        userId: users[2]._id, // Priya
        restaurantId: restMap['Spice Hub'],
        items: [
          { menuItemId: itemMap['Paneer Tikka Biryani']._id, name: 'Paneer Tikka Biryani', price: 190, quantity: 1 },
          { menuItemId: itemMap['Gulab Jamun (2 pcs)']._id, name: 'Gulab Jamun (2 pcs)', price: 70, quantity: 2 }
        ],
        totalAmount: 330,
        status: 'Delivered',
        deliveryAddress: 'Hostel Block A, VIT',
        orderDate: new Date(Date.now() - 1000 * 60 * 60 * 70)
      },
      {
        userId: users[3]._id, // Rahul
        restaurantId: restMap['Bella Italia'],
        items: [
          { menuItemId: itemMap['Spicy Pepperoni & Jalapeno Pizza']._id, name: 'Spicy Pepperoni & Jalapeno Pizza', price: 390, quantity: 1 },
          { menuItemId: itemMap['Garlic Bread with Melted Cheese']._id, name: 'Garlic Bread with Melted Cheese', price: 140, quantity: 1 }
        ],
        totalAmount: 530,
        status: 'Delivered',
        deliveryAddress: 'Main Street, Vellore',
        orderDate: new Date(Date.now() - 1000 * 60 * 60 * 55)
      },
      {
        userId: users[0]._id, // Sree
        restaurantId: restMap['Sweet Treats & Cafe'],
        items: [
          { menuItemId: itemMap['New York Cheesecake']._id, name: 'New York Cheesecake', price: 210, quantity: 1 },
          { menuItemId: itemMap['Caramel Macchiato (Hot)']._id, name: 'Caramel Macchiato (Hot)', price: 150, quantity: 1 }
        ],
        totalAmount: 360,
        status: 'Delivered',
        deliveryAddress: 'Block D, Room 302, VIT Vellore',
        orderDate: new Date(Date.now() - 1000 * 60 * 60 * 80)
      },
      {
        userId: users[1]._id,
        restaurantId: restMap['Spice Hub'],
        items: [
          { menuItemId: itemMap['Hyderabadi Chicken Biryani']._id, name: 'Hyderabadi Chicken Biryani', price: 220, quantity: 3 }
        ],
        totalAmount: 660,
        status: 'Delivered',
        deliveryAddress: 'Green Avenue, Katpadi',
        orderDate: new Date(Date.now() - 1000 * 60 * 60 * 95)
      },
      {
        userId: users[2]._id,
        restaurantId: restMap['Burger House'],
        items: [
          { menuItemId: itemMap['Grilled Paneer Wrap']._id, name: 'Grilled Paneer Wrap', price: 150, quantity: 2 },
          { menuItemId: itemMap['Iced Lemon Tea']._id, name: 'Iced Lemon Tea', price: 70, quantity: 1 }
        ],
        totalAmount: 370,
        status: 'Out for Delivery',
        deliveryAddress: 'Hostel Block A, VIT',
        orderDate: new Date(Date.now() - 1000 * 60 * 25)
      },
      {
        userId: users[3]._id,
        restaurantId: restMap['Bella Italia'],
        items: [
          { menuItemId: itemMap['Creamy Alfredo Penne']._id, name: 'Creamy Alfredo Penne', price: 260, quantity: 1 }
        ],
        totalAmount: 260,
        status: 'Delivered',
        deliveryAddress: 'Main Street, Vellore',
        orderDate: new Date(Date.now() - 1000 * 60 * 60 * 110)
      },
      {
        userId: users[0]._id,
        restaurantId: restMap['Spice Hub'],
        items: [
          { menuItemId: itemMap['Egg Biryani']._id, name: 'Egg Biryani', price: 160, quantity: 2 },
          { menuItemId: itemMap['Fresh Mint Lime Juice']._id, name: 'Fresh Mint Lime Juice', price: 60, quantity: 2 }
        ],
        totalAmount: 440,
        status: 'Cancelled',
        deliveryAddress: 'Block D, Room 302, VIT Vellore',
        orderDate: new Date(Date.now() - 1000 * 60 * 60 * 120)
      },
      {
        userId: users[1]._id,
        restaurantId: restMap['Sweet Treats & Cafe'],
        items: [
          { menuItemId: itemMap['Warm Brownie with Vanilla Ice Cream']._id, name: 'Warm Brownie with Vanilla Ice Cream', price: 140, quantity: 2 },
          { menuItemId: itemMap['Strawberry Basil Mojito (Mocktail)']._id, name: 'Strawberry Basil Mojito (Mocktail)', price: 110, quantity: 2 }
        ],
        totalAmount: 500,
        status: 'Delivered',
        deliveryAddress: 'Green Avenue, Katpadi',
        orderDate: new Date(Date.now() - 1000 * 60 * 60 * 130)
      },
      {
        userId: users[2]._id,
        restaurantId: restMap['Burger House'],
        items: [
          { menuItemId: itemMap['Aloo Tikki Crunchy Burger']._id, name: 'Aloo Tikki Crunchy Burger', price: 110, quantity: 2 }
        ],
        totalAmount: 220,
        status: 'Delivered',
        deliveryAddress: 'Hostel Block A, VIT',
        orderDate: new Date(Date.now() - 1000 * 60 * 60 * 140)
      }
    ]);

    console.log('[Seed] Inserting Reviews (12+ reviews)...');
    const reviews = await Review.insertMany([
      { userId: users[0]._id, restaurantId: restMap['Spice Hub'], rating: 5, comment: 'The Hyderabadi Chicken Biryani was flavorful and authentic. Fresh mint lime was great!' },
      { userId: users[1]._id, restaurantId: restMap['Spice Hub'], rating: 5, comment: 'Best dum biryani in Vellore. Rice is long grain and well-seasoned.' },
      { userId: users[2]._id, restaurantId: restMap['Spice Hub'], rating: 4, comment: 'Paneer tikka biryani was great, loved the gulab jamun.' },
      { userId: users[3]._id, restaurantId: restMap['Spice Hub'], rating: 5, comment: 'Mutton was very tender. Highly recommend their biryanis.' },

      { userId: users[1]._id, restaurantId: restMap['Burger House'], rating: 4, comment: 'Zinger burger was super crispy, loved the chocolate shake.' },
      { userId: users[0]._id, restaurantId: restMap['Burger House'], rating: 5, comment: 'Smash burger is juicy and well layered with cheddar.' },
      { userId: users[2]._id, restaurantId: restMap['Burger House'], rating: 4, comment: 'Fast delivery to VIT campus, burgers were piping hot.' },

      { userId: users[2]._id, restaurantId: restMap['Bella Italia'], rating: 5, comment: 'Authentic thin crust Margherita! The tiramisu was dreamy.' },
      { userId: users[3]._id, restaurantId: restMap['Bella Italia'], rating: 4, comment: 'Great garlic bread and spicy pepperoni pizza.' },
      { userId: users[0]._id, restaurantId: restMap['Bella Italia'], rating: 5, comment: 'Creamy alfredo penne is one of the best in town.' },

      { userId: users[1]._id, restaurantId: restMap['Sweet Treats & Cafe'], rating: 4, comment: 'Dark chocolate cake is heavenly for chocolate lovers.' },
      { userId: users[0]._id, restaurantId: restMap['Sweet Treats & Cafe'], rating: 5, comment: 'New York cheesecake is rich, paired perfectly with coffee.' }
    ]);

    const totalRecords = users.length + categories.length + restaurants.length + menuItems.length + orders.length + reviews.length;
    console.log('====================================================');
    console.log(' DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    console.log(` Users:       ${users.length}`);
    console.log(` Categories:  ${categories.length}`);
    console.log(` Restaurants: ${restaurants.length}`);
    console.log(` Menu Items:  ${menuItems.length}`);
    console.log(` Orders:      ${orders.length}`);
    console.log(` Reviews:     ${reviews.length}`);
    console.log(` TOTAL DOCUMENTS: ${totalRecords} (Requirement: Minimum 50)`);
    console.log('====================================================');

    await disconnectDB();
    console.log('[Seed] Disconnected cleanly.');
  } catch (error) {
    console.error('[Seed] Error during seeding:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;
