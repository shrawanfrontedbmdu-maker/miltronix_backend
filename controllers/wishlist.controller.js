import Wishlishmodel from "../models/wishlist.model.js"
import Product from "../models/product.model.js";

export const getwishlish = async (req, res) => {
  try {
    let wishlist;

    if (req.user) {
      wishlist = await Wishlishmodel.findOne({ user: req.user._id })
        .populate("items.product", "name images price");
    } else {
      // Guest wishlist
      wishlist = await Wishlishmodel.findOne({ user: null })
        .populate("items.product", "name images price");
    }

    if (!wishlist) {
      return res.json({
        user: req.user ? req.user._id : null,
        items: [],
        subtotal: 0
      });
    }

    res.json(wishlist);
  } catch (err) {
    res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
};

export const addwishlistItem = async (req, res) => {
  try {
    const { productId, variant = {}, quantity = 1 } = req.body;

    if (!productId || quantity < 1) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let wishlist;

    if (req.user) {
      wishlist = await Wishlishmodel.findOne({ user: req.user._id });
      if (!wishlist) {
        wishlist = new Wishlishmodel({ user: req.user._id, items: [] });
      }
    } else {
      wishlist = await Wishlishmodel.findOne({ user: null });
      if (!wishlist) {
        wishlist = new Wishlishmodel({ user: null, items: [] });
      }
    }

    const key = JSON.stringify(variant);
    const idx = wishlist.items.findIndex(
      i =>
        i.product.toString() === productId &&
        JSON.stringify(i.variant) === key
    );

    if (idx > -1) {
      wishlist.items[idx].quantity += quantity;
    } else {
      wishlist.items.push({
        product: product._id,
        variant,
        quantity,
        priceSnapshot: product.price
      });
    }

    wishlist.subtotal = wishlist.items.reduce(
      (sum, i) => sum + i.quantity * i.priceSnapshot,
      0
    );

    await wishlist.save();

    const populated = await wishlist.populate(
      "items.product",
      "name images price"
    );

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
};

export const updateWishlistItem = async (req, res) => {
  try {
    const { quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({ message: "Quantity must be >= 1" });
    }

    let wishlist;

    if (req.user) {
      wishlist = await Wishlishmodel.findOne({ user: req.user._id });
    } else {
      wishlist = await Wishlishmodel.findOne({ user: null });
    }

    if (!wishlist) {
      return res.status(404).json({ message: "Wishlist not found" });
    }

    const item = wishlist.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    item.quantity = quantity;

    wishlist.subtotal = wishlist.items.reduce(
      (sum, i) => sum + i.quantity * i.priceSnapshot,
      0
    );

    await wishlist.save();

    const populated = await wishlist.populate(
      "items.product",
      "name images price"
    );

    res.json(populated);
  } catch (err) {
    res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
};

export const removeWishlistItem = async (req, res) => {
  try {
    let wishlist;

    if (req.user) {
      wishlist = await Wishlishmodel.findOne({ user: req.user._id });
    } else {
      wishlist = await Wishlishmodel.findOne({ user: null });
    }

    if (!wishlist) {
      return res.status(404).json({ message: "Wishlist not found" });
    }

    const item = wishlist.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    item.deleteOne();

    wishlist.subtotal = wishlist.items.reduce(
      (sum, i) => sum + i.quantity * i.priceSnapshot,
      0
    );

    await wishlist.save();

    const populated = await wishlist.populate(
      "items.product",
      "name images price"
    );

    res.json(populated);
  } catch (err) {
    res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
};

export const mergeGuestWishlist = async (req, res) => {
  try {
    const { items = [] } = req.body;

    let wishlist;

    if (req.user) {
      wishlist = await Wishlishmodel.findOne({ user: req.user._id });
      if (!wishlist) {
        wishlist = new Wishlishmodel({
          user: req.user._id,
          items: []
        });
      }
    } else {
      wishlist = await Wishlishmodel.findOne({ user: null });
      if (!wishlist) {
        wishlist = new Wishlishmodel({
          user: null,
          items: []
        });
      }
    }

    for (const incoming of items) {
      const product = await Product.findById(incoming.productId);
      if (!product) continue;

      const key = JSON.stringify(incoming.variant || {});
      const idx = wishlist.items.findIndex(
        i =>
          i.product.toString() === incoming.productId &&
          JSON.stringify(i.variant) === key
      );

      if (idx > -1) {
        wishlist.items[idx].quantity += incoming.quantity || 1;
      } else {
        wishlist.items.push({
          product: incoming.productId,
          variant: incoming.variant || {},
          quantity: incoming.quantity || 1,
          priceSnapshot: product.price
        });
      }
    }

    wishlist.subtotal = wishlist.items.reduce(
      (sum, i) => sum + i.quantity * i.priceSnapshot,
      0
    );

    await wishlist.save();

    const populated = await wishlist.populate(
      "items.product",
      "name images price"
    );

    res.json(populated);
  } catch (err) {
    res.status(500).json({
      message: "Server error",
      error: err.message
    });
  }
};