const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const MenuItem = require('../models/MenuItem');
const Review = require('../models/Review');

// 1. System Overview Metrics
router.get('/overview', async (req, res) => {
  try {
    const [totalUsers, totalRestaurants, totalMenuItems, orderSummary] = await Promise.all([
      User.countDocuments(),
      Restaurant.countDocuments(),
      MenuItem.countDocuments(),
      Order.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: {
                $cond: [{ $ne: ['$status', 'Cancelled'] }, '$totalAmount', 0]
              }
            },
            totalOrders: { $sum: 1 },
            deliveredOrders: {
              $sum: { $cond: [{ $eq: ['$status', 'Delivered'] }, 1, 0] }
            }
          }
        }
      ])
    ]);

    const stats = orderSummary[0] || { totalRevenue: 0, totalOrders: 0, deliveredOrders: 0 };

    res.json({
      totalUsers,
      totalRestaurants,
      totalMenuItems,
      totalOrders: stats.totalOrders,
      totalRevenue: stats.totalRevenue,
      deliveredOrders: stats.deliveredOrders
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Advanced Aggregation: Revenue and order volume by restaurant
router.get('/revenue-by-restaurant', async (req, res) => {
  try {
    const pipeline = [
      {
        $match: { status: { $ne: 'Cancelled' } }
      },
      {
        $group: {
          _id: '$restaurantId',
          totalRevenue: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
          avgOrderValue: { $avg: '$totalAmount' }
        }
      },
      {
        $lookup: {
          from: 'restaurants',
          localField: '_id',
          foreignField: '_id',
          as: 'restaurant'
        }
      },
      {
        $unwind: '$restaurant'
      },
      {
        $project: {
          restaurantId: '$_id',
          restaurantName: '$restaurant.name',
          cuisine: '$restaurant.cuisine',
          totalRevenue: 1,
          orderCount: 1,
          avgOrderValue: { $round: ['$avgOrderValue', 2] }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      }
    ];

    const results = await Order.aggregate(pipeline);
    res.json({ pipeline, results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Advanced Aggregation: Top 5 Best Selling Menu Items ($unwind items array)
router.get('/top-selling-items', async (req, res) => {
  try {
    const pipeline = [
      {
        $match: { status: { $ne: 'Cancelled' } }
      },
      {
        $unwind: '$items'
      },
      {
        $group: {
          _id: '$items.name',
          totalQuantitySold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      {
        $project: {
          itemName: '$_id',
          totalQuantitySold: 1,
          totalRevenue: 1
        }
      },
      {
        $sort: { totalQuantitySold: -1 }
      },
      {
        $limit: 5
      }
    ];

    const results = await Order.aggregate(pipeline);
    res.json({ pipeline, results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Advanced Aggregation: Order Status Distribution
router.get('/order-status-breakdown', async (req, res) => {
  try {
    const pipeline = [
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          status: '$_id',
          count: 1,
          _id: 0
        }
      },
      {
        $sort: { count: -1 }
      }
    ];

    const results = await Order.aggregate(pipeline);
    res.json({ pipeline, results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Advanced Aggregation: Rating Analysis by Restaurant
router.get('/restaurant-ratings', async (req, res) => {
  try {
    const pipeline = [
      {
        $group: {
          _id: '$restaurantId',
          averageRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'restaurants',
          localField: '_id',
          foreignField: '_id',
          as: 'restaurant'
        }
      },
      {
        $unwind: '$restaurant'
      },
      {
        $project: {
          restaurantName: '$restaurant.name',
          cuisine: '$restaurant.cuisine',
          averageRating: { $round: ['$averageRating', 2] },
          reviewCount: 1
        }
      },
      {
        $sort: { averageRating: -1 }
      }
    ];

    const results = await Review.aggregate(pipeline);
    res.json({ pipeline, results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
