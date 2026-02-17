import Cart from "../models/cart.model.js";
import Product from "../models/product.model.js";

// ---------------- ADD ITEM TO CART ----------------
export const addItemToCart = async (req, res) => {
  try {
    const { productId, sku, quantity = 1 } = req.body;
    const userId = req.user._id;

    if (!productId || !sku) {
      return res.status(400).json({ message: "productId and sku are required" });
    }

    // ===== Find Product =====
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // ===== Find Variant =====
    const variant = product.variants.find(v => v.sku === sku);
    if (!variant) return res.status(404).json({ message: "Variant not found" });

    // ===== Stock Check =====
    if (variant.stockQuantity < quantity) {
      return res.status(400).json({ message: "Not enough stock available" });
    }

    // ===== Find or Create Cart =====
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    // ===== Check Existing Item =====
    const existingItemIndex = cart.items.findIndex(
      item =>
        item.product.toString() === productId &&
        item.variant.sku === sku
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({
        product: product._id,
        variant: {
          sku: variant.sku,
          attributes: variant.attributes || {},
        },
        title: product.name,
        category: product.category,
        images: variant.images?.length ? variant.images : product.images,
        quantity,
        priceSnapshot: variant.price,
      });
    }

    // ===== Calculate Subtotal =====
    cart.subtotal = cart.items.reduce(
      (sum, item) => sum + item.quantity * item.priceSnapshot,
      0
    );

    await cart.save();

    const populatedCart = await Cart.findOne({ user: userId }).populate(
      "items.product",
      "name images category"
    );

    res.status(200).json({
      message: "Item added to cart",
      cart: populatedCart,
    });

  } catch (err) {
    console.error("Add to cart error:", err);
    res.status(500).json({ message: "Failed to add item to cart", error: err.message });
  }
};


// ---------------- GET CART ----------------
export const getCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const cart = await Cart.findOne({ user: userId }).populate(
      "items.product",
      "name images category"
    );

    if (!cart) {
      return res.status(200).json({ user: userId, items: [], subtotal: 0 });
    }

    res.status(200).json(cart);

  } catch (err) {
    console.error("Get cart error:", err);
    res.status(500).json({ message: "Failed to fetch cart", error: err.message });
  }
};


export const removeFromCart = async (req, res) => {
  try {
    const userId = req.user?._id || null;
    const { productId, sku } = req.body;

    if (!userId) return res.status(400).json({ message: "userId required" });

    // If no productId provided -> remove entire cart document for user
    if (!productId) {
      const deleted = await Cart.deleteOne({ user: userId });
      if (!deleted || deleted.deletedCount === 0) {
        return res.status(404).json({ message: "No cart found for this user" });
      }
      return res.status(200).json({ message: "All cart items removed successfully" });
    }

    // validate productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid productId" });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    // find item by productId + (sku | variant) or fallback to first matching product
    const idx = cart.items.findIndex((item) => {
      const sameProduct = item.product && item.product.toString() === productId;
      if (!sameProduct) return false;

      if (sku && item.variant && item.variant.sku) {
        return item.variant.sku === sku;
      }

      // fallback: product match only
      return true;
    });

    if (idx === -1) {
      return res.status(404).json({ message: "Cart item not found" });
    }

    // remove item and recalc subtotal
    cart.items.splice(idx, 1);
    cart.subtotal = cart.items.reduce((sum, i) => sum + i.quantity * i.priceSnapshot, 0);

    if (cart.items.length === 0) {
      await cart.deleteOne();
      return res.status(200).json({ message: "Item removed — cart is now empty" });
    }

    await cart.save();

    const populatedCart = await cart.populate({ path: "items.product", select: "name images price sellingprice category" });
    res.status(200).json({ message: "Item removed from cart successfully", cart: populatedCart });
  } catch (error) {
    console.error("Error removing from cart:", error);
    res.status(500).json({ message: error.message });
  }
};