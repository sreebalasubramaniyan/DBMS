const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');

// GET /api/menu - Read menu items with optional filtering by restaurant or category
router.get('/', async (req, res) => {
  try {
    const { restaurantId, categoryId, search } = req.query;
    let filter = {};

    if (restaurantId) filter.restaurantId = restaurantId;
    if (categoryId) filter.categoryId = categoryId;
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    const items = await MenuItem.find(filter)
      .populate('restaurantId', 'name')
      .populate('categoryId', 'name')
      .sort({ name: 1 });

    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/menu/:id
router.get('/:id', async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id)
      .populate('restaurantId', 'name')
      .populate('categoryId', 'name');
    if (!item) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/menu - Create menu item (Admin CRUD)
router.post('/', async (req, res) => {
  try {
    const { restaurantId, categoryId, name, description, price, isAvailable, imageUrl } = req.body;
    if (!restaurantId || !categoryId || !name || price === undefined) {
      return res.status(400).json({ error: 'Please provide restaurantId, categoryId, name, and price.' });
    }

    const newItem = new MenuItem({
      restaurantId,
      categoryId,
      name,
      description: description || '',
      price: Number(price),
      isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
      imageUrl: imageUrl || ''
    });

    await newItem.save();
    const populated = await MenuItem.findById(newItem._id)
      .populate('restaurantId', 'name')
      .populate('categoryId', 'name');

    res.status(201).json({ message: 'Menu item created successfully', item: populated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/menu/:id - Update menu item (Admin CRUD)
router.put('/:id', async (req, res) => {
  try {
    const updatedItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    )
      .populate('restaurantId', 'name')
      .populate('categoryId', 'name');

    if (!updatedItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    res.json({ message: 'Menu item updated successfully', item: updatedItem });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/menu/:id - Delete menu item (Admin CRUD)
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await MenuItem.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
