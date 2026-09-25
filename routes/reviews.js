const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Restaurant = require('../models/Restaurant');

// GET /api/reviews
router.get('/', async (req, res) => {
  try {
    const { restaurantId, userId } = req.query;
    let filter = {};
    if (restaurantId) filter.restaurantId = restaurantId;
    if (userId) filter.userId = userId;

    const reviews = await Review.find(filter)
      .populate('userId', 'name email')
      .populate('restaurantId', 'name')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/reviews - Add customer review
router.post('/', async (req, res) => {
  try {
    const { userId, restaurantId, rating, comment } = req.body;
    if (!userId || !restaurantId || !rating || !comment) {
      return res.status(400).json({ error: 'User, restaurant, rating (1-5), and comment are required.' });
    }

    const review = new Review({
      userId,
      restaurantId,
      rating: Number(rating),
      comment: comment.trim()
    });

    await review.save();

    // Recalculate average rating for restaurant using MongoDB Aggregation
    const stats = await Review.aggregate([
      { $match: { restaurantId: review.restaurantId } },
      { $group: { _id: '$restaurantId', avgRating: { $avg: '$rating' } } }
    ]);

    if (stats.length > 0) {
      await Restaurant.findByIdAndUpdate(restaurantId, {
        rating: Math.round(stats[0].avgRating * 10) / 10
      });
    }

    const populated = await Review.findById(review._id)
      .populate('userId', 'name')
      .populate('restaurantId', 'name');

    res.status(201).json({ message: 'Review added successfully', review: populated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/reviews/:id - Delete review (Admin CRUD)
router.delete('/:id', async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
