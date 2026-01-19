import Cart from "../models/cart.model.js";
import Product from "../models/product.model.js";

export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id })
      .populate("items.product", "name images price");

    if (!cart) return res.json({ user: req.user._id, items: [], subtotal: 0 });

    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const addItem = async (req, res) => {
  try {
    const { productId, variant = {}, quantity = 1 } = req.body;
    if (!productId || quantity < 1) return res.status(400).json({ message: "Invalid payload" });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const priceNow = product.price;

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) cart = new Cart({ user: req.user._id, items: [] });

    const key = JSON.stringify(variant);
    const idx = cart.items.findIndex(i =>
      i.product.toString() === productId && JSON.stringify(i.variant) === key
    );

    if (idx > -1) {
      cart.items[idx].quantity += quantity;
    } else {
      cart.items.push({ product: product._id, variant, quantity, priceSnapshot: priceNow });
    }

    cart.subtotal = cart.items.reduce((sum, i) => sum + i.quantity * i.priceSnapshot, 0);
    await cart.save();

    const populated = await cart.populate("items.product", "name images price");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const updateItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    if (quantity < 1) return res.status(400).json({ message: "Quantity must be >= 1" });

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });

    item.quantity = quantity;

    cart.subtotal = cart.items.reduce((sum, i) => sum + i.quantity * i.priceSnapshot, 0);
    await cart.save();

    const populated = await cart.populate("items.product", "name images price");
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const removeItem = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });

    item.deleteOne();

    cart.subtotal = cart.items.reduce((sum, i) => sum + i.quantity * i.priceSnapshot, 0);
    await cart.save();

    const populated = await cart.populate("items.product", "name images price");
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const mergeGuestCart = async (req, res) => {
  try {
    const { items = [] } = req.body;

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) cart = new Cart({ user: req.user._id, items: [] });

    for (const incoming of items) {
      const product = await Product.findById(incoming.productId);
      if (!product) continue;

      const priceNow = product.price;
      const key = JSON.stringify(incoming.variant || {});
      const idx = cart.items.findIndex(i =>
        i.product.toString() === incoming.productId && JSON.stringify(i.variant) === key
      );

      if (idx > -1) {
        cart.items[idx].quantity += incoming.quantity || 1;
      } else {
        cart.items.push({
          product: incoming.productId,
          variant: incoming.variant || {},
          quantity: incoming.quantity || 1,
          priceSnapshot: priceNow
        });
      }
    }

    cart.subtotal = cart.items.reduce((sum, i) => sum + i.quantity * i.priceSnapshot, 0);
    await cart.save();

    const populated = await cart.populate("items.product", "name images price");
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
