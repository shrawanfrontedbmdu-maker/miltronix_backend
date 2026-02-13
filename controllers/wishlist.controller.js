import Wishlist from "../models/wishlist.model.js";


// ➕ Add item to wishlist
export const addWishlistItem = async (req, res) => {
  try {
    const { userId, item } = req.body;

    if (!userId || !item) {
      return res.status(400).json({
        success: false,
        message: "userId and item are required"
      });
    }

    let wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      wishlist = new Wishlist({
        user: userId,
        items: [item],
      });
    } else {
      const exists = wishlist.items.find(
        (i) =>
          i.product &&
          item.product &&
          i.product.toString() === item.product.toString()
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

    res.status(200).json({
      success: true,
      message: "Item added to wishlist",
      wishlist
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};


// 📥 Get wishlist by user
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

    res.status(200).json({
      success: true,
      wishlist
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};


// ❌ Remove single item
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

    wishlist.items = wishlist.items.filter(
      (item) => item._id.toString() !== itemId
    );

    await wishlist.save();

    res.status(200).json({
      success: true,
      message: "Item removed",
      wishlist
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};


// 🧹 Clear wishlist
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

    res.status(200).json({
      success: true,
      message: "Wishlist cleared successfully"
    });

  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};
