const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  cuisine: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    default: 4.0,
    min: 0,
    max: 5
  },
  isOpen: {
    type: Boolean,
    default: true
  },
  image: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// Text index for search functionality (Advanced NoSQL feature)
restaurantSchema.index({ name: 'text', cuisine: 'text', location: 'text' });

module.exports = mongoose.model('Restaurant', restaurantSchema);
