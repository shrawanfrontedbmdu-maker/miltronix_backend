import Wishlist from "../models/wishlist.model.js";

/* ================= ADD ITEM TO WISHLIST ================= */
export const addWishlistItem = async (req, res) => {
  try {
    const { userId, productId, variant, title, images, category, priceSnapshot } = req.body;

    if (!userId || !productId || !priceSnapshot) {
      return res.status(400).json({
        success: false,
        message: "userId, productId, and priceSnapshot are required"
      });
    }

    // Build wishlist item object
    const item = {
      product: productId,
      title,
      images,
      category,
      variant,
      priceSnapshot
    };

    // Find user's wishlist
    let wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      // Create new wishlist if doesn't exist
      wishlist = new Wishlist({
        user: userId,
        items: [item]
      });
    } else {
      // Check if product already exists in wishlist
      const exists = wishlist.items.find(
        (i) => i.product.toString() === productId.toString()
      );

      if (exists) {
        return res.status(400).json({
          success: false,
          message: "Item already exists in wishlist"
        });
      }

      wishlist.items.push(item);
    }

    await wishlist.save();

    return res.status(200).json({
      success: true,
      message: "Item added to wishlist",
      wishlist
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/* ================= GET WISHLIST BY USER ================= */
export const getWishlistByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const wishlist = await Wishlist.findOne({ user: userId })
      .populate("items.product");

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: "Wishlist not found"
      });
    }

    return res.status(200).json({
      success: true,
      wishlist
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/* ================= REMOVE SINGLE ITEM ================= */
export const removeWishlistItem = async (req, res) => {
  try {
    const { userId, itemId } = req.params;

    const wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: "Wishlist not found"
      });
    }

    const originalLength = wishlist.items.length;
    wishlist.items = wishlist.items.filter(
      (item) => item._id.toString() !== itemId
    );

    if (wishlist.items.length === originalLength) {
      return res.status(404).json({
        success: false,
        message: "Item not found in wishlist"
      });
    }

    await wishlist.save();

    return res.status(200).json({
      success: true,
      message: "Item removed from wishlist",
      wishlist
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/* ================= CLEAR WISHLIST ================= */
export const clearWishlist = async (req, res) => {
  try {
    const { userId } = req.params;

    const wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: "Wishlist not found"
      });
    }

    wishlist.items = [];
    await wishlist.save();

    return res.status(200).json({
      success: true,
      message: "Wishlist cleared successfully"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
