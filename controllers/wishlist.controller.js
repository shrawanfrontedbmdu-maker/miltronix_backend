import Wishlist from "../models/wishlist.model.js";


// ➕ Add item to wishlist
export const addWishlistItem = async (req, res) => {
  try {
    const { userId, item } = req.body;

    let wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      wishlist = new Wishlist({
        user: userId,
        items: [item],
      });
    } else {
      const exists = wishlist.items.find(
        (i) => i.product?.toString() === item.product
      );

      if (exists) {
        return res.status(400).json({ message: "Item already exists" });
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
    res.status(500).json({ success: false, error: error.message });
  }
};


// 📥 Get wishlist by user
export const getWishlistByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const wishlist = await Wishlist.findOne({ user: userId })
      .populate("items.product");

    if (!wishlist) {
      return res.status(404).json({ message: "Wishlist not found" });
    }

    res.status(200).json(wishlist);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ❌ Remove single item
export const removeWishlistItem = async (req, res) => {
  try {
    const { userId, itemId } = req.params;

    const wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      return res.status(404).json({ message: "Wishlist not found" });
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
    res.status(500).json({ error: error.message });
  }
};


// 🧹 Clear wishlist
export const clearWishlist = async (req, res) => {
  try {
    const { userId } = req.params;

    await Wishlist.findOneAndUpdate(
      { user: userId },
      { items: [] }
    );

    res.status(200).json({
      success: true,
      message: "Wishlist cleared"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
