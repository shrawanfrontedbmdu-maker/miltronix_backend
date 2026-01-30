import Cart from "../models/cart.model.js";
import Product from "../models/product.model.js";
import mongoose from "mongoose";

// ---------------- ADD ITEM TO CART ----------------
export const addItemToCart = async (req, res) => {
  try {
    const { productId, categoryKey, quantity = 1, variant = {}, categoryProduct } = req.body;

    if (!productId && !categoryProduct) {
      return res.status(400).json({ message: "Product information is required" });
    }

    let productData;

    // ===== Normal Product from Product Collection =====
    if (productId) {
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ message: "Invalid Product ID" });
      }

      const product = await Product.findById(productId);
      if (!product) return res.status(404).json({ message: "Product not found" });

      productData = {
        product: product._id,
        title: product.name || product.title,
        priceSnapshot: product.price || product.sellingprice || 0,
        category: product.category || "",
        images: Array.isArray(product.images) && product.images.length > 0
          ? product.images.map(img => typeof img === "string" ? { url: img, public_id: "" } : img)
          : [{ url: "/images/placeholder.png", public_id: "" }],
        variant: variant || {},
      };

    // ===== Product from Category Products =====
    } else if (categoryProduct) {
      let imagesArray = [];
      if (categoryProduct.images && Array.isArray(categoryProduct.images)) {
        imagesArray = categoryProduct.images.map(img =>
          typeof img === "string" ? { url: img, public_id: "" } : img
        );
      } else if (categoryProduct.image) {
        imagesArray = [{ url: categoryProduct.image, public_id: "" }];
      } else {
        imagesArray = [{ url: "/images/placeholder.png", public_id: "" }];
      }

      productData = {
        product: null, // no actual Product ID
        title: categoryProduct.title || "No title",
        priceSnapshot: categoryProduct.price || 0,
        category: categoryKey || categoryProduct.categoryKey || "",
        images: imagesArray,
        variant: variant || {},
      };
    }

    // ===== Guest or Logged-in User =====
    const userId = req.user?._id || null;

    // ===== Find or Create Cart =====
    let cart = await Cart.findOne({ user: userId });
    if (!cart) cart = new Cart({ user: userId, items: [] });

    // ===== Check Existing Item =====
    const existingItemIndex = cart.items.findIndex(item => {
      const sameProduct = item.product?.toString() === productData.product?.toString();
      const sameVariant = JSON.stringify(item.variant || {}) === JSON.stringify(productData.variant || {});
      const sameCategoryProduct = item.product === null && productData.product === null && item.title === productData.title;
      return (sameProduct && sameVariant) || sameCategoryProduct;
    });

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += quantity;
      cart.items[existingItemIndex].priceSnapshot = productData.priceSnapshot;
    } else {
      cart.items.push({ ...productData, quantity });
    }

    // ===== Calculate Subtotal =====
    cart.subtotal = cart.items.reduce(
      (sum, item) => sum + item.quantity * item.priceSnapshot,
      0
    );

    await cart.save();

    // ===== Populate Product References =====
    const populatedCart = await cart.populate({
      path: "items.product",
      select: "title price sellingprice images category",
    });

    res.status(200).json({ message: "Item added to cart", cart: populatedCart });

  } catch (err) {
    console.error("Error adding to cart:", err);
    res.status(500).json({ message: "Failed to add item to cart", error: err.message });
  }
};

// ---------------- GET CART ----------------
export const getCart = async (req, res) => {
  try {
    const userId = req.user?._id || null;

    let cart = await Cart.findOne({ user: userId }).populate({
      path: "items.product",
      select: "title price sellingprice images category",
    });

    if (!cart) return res.status(200).json({ user: userId, items: [], subtotal: 0 });

    // Keep all items (normal + category products)
    const filteredItems = cart.items.filter(i => i.product !== undefined);

    const subtotal = filteredItems.reduce(
      (sum, i) => sum + i.quantity * i.priceSnapshot,
      0
    );

    res.status(200).json({ user: userId, items: filteredItems, subtotal });

  } catch (err) {
    console.error("Error fetching cart:", err);
    res.status(500).json({ message: "Failed to fetch cart", error: err.message });
  }
};
