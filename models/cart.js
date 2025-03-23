const mongoose = require("mongoose");

// Schema for items inside the cart
const cartItemSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ad', required: true },
  quantity: { type: Number, default: 1 }
});

// Cart schema
const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }, // Will add multi-user later
  items: [cartItemSchema]
});

// Exporting the model
const Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;
