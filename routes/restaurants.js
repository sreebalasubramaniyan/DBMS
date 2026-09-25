const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const Review = require('../models/Review');

// GET /api/restaurants - Read all restaurants (supports search query)
router.get('/', async (req, res) => {
  try {
    const { search, cuisine } = req.query;
    let query = {};

    if (search) {
      // Regex or text search across name, cuisine, location
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { cuisine: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    if (cuisine) {
      query.cuisine = { $regex: cuisine, $options: 'i' };
    }

    const restaurants = await Restaurant.find(query).sort({ rating: -1 });
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/restaurants/:id - Read single restaurant with menu and reviews
router.get('/:id', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    const menu = await MenuItem.find({ restaurantId: restaurant._id, isAvailable: true }).populate('categoryId');
    const reviews = await Review.find({ restaurantId: restaurant._id }).populate('userId', 'name email').sort({ createdAt: -1 });

    res.json({ restaurant, menu, reviews });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/restaurants - Create new restaurant (Admin CRUD)
router.post('/', async (req, res) => {
  try {
    const { name, cuisine, location, phone, rating, isOpen, image } = req.body;
    if (!name || !cuisine || !location || !phone) {
      return res.status(400).json({ error: 'Please provide name, cuisine, location, and phone.' });
    }

    const newRestaurant = new Restaurant({
      name,
      cuisine,
      location,
      phone,
      rating: rating !== undefined ? Number(rating) : 4.0,
      isOpen: isOpen !== undefined ? Boolean(isOpen) : true,
      image: image || ''
    });

    await newRestaurant.save();
    res.status(201).json({ message: 'Restaurant created successfully', restaurant: newRestaurant });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/restaurants/:id - Update restaurant (Admin CRUD)
router.put('/:id', async (req, res) => {
  try {
    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!updatedRestaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    res.json({ message: 'Restaurant updated successfully', restaurant: updatedRestaurant });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/restaurants/:id - Delete restaurant and associated menu items (Admin CRUD)
router.delete('/:id', async (req, res) => {
  try {
    const deletedRestaurant = await Restaurant.findByIdAndDelete(req.params.id);
    if (!deletedRestaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    // Clean up dependent menu items
    await MenuItem.deleteMany({ restaurantId: req.params.id });
    res.json({ message: 'Restaurant and related menu items deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
