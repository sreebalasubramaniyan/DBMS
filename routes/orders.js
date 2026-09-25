const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// GET /api/orders - Read orders (supports optional ?userId=... or ?restaurantId=...)
router.get('/', async (req, res) => {
  try {
    const { userId, restaurantId, status } = req.query;
    let filter = {};

    if (userId) filter.userId = userId;
    if (restaurantId) filter.restaurantId = restaurantId;
    if (status) filter.status = status;

    const orders = await Order.find(filter)
      .populate('userId', 'name email phone')
      .populate('restaurantId', 'name location')
      .sort({ orderDate: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/orders/:id
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('userId', 'name email phone')
      .populate('restaurantId', 'name location');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/orders - Create new order (Customer CRUD)
router.post('/', async (req, res) => {
  try {
    const { userId, restaurantId, items, deliveryAddress } = req.body;

    if (!userId || !restaurantId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'User, restaurant, and at least one item are required.' });
    }

    // Calculate total amount from embedded items
    const totalAmount = items.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);

    const order = new Order({
      userId,
      restaurantId,
      items: items.map(i => ({
        menuItemId: i.menuItemId,
        name: i.name,
        price: Number(i.price),
        quantity: Number(i.quantity)
      })),
      totalAmount,
      deliveryAddress: deliveryAddress || '',
      status: 'Placed'
    });

    await order.save();
    const populated = await Order.findById(order._id)
      .populate('userId', 'name email')
      .populate('restaurantId', 'name');

    res.status(201).json({ message: 'Order placed successfully!', order: populated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/orders/:id/status - Update order status (Admin CRUD)
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Placed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
      .populate('userId', 'name email')
      .populate('restaurantId', 'name');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ message: 'Order status updated', order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/orders/:id - Cancel/Delete order (Admin/Customer CRUD)
router.delete('/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
