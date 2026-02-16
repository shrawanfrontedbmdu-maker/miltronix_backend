import mongoose from "mongoose";

/* ================= WISHLIST ITEM SCHEMA ================= */
const WishlistItemSchema = new mongoose.Schema(
  {
    product: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Product", 
      required: true // always reference a product
    },

    title: { type: String, trim: true }, 

    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
        alt: { type: String, trim: true },
      },
    ],

    category: { type: String, trim: true }, 

    variant: {
      sku: { type: String, trim: true },
      color: { type: String, trim: true },
      size: { type: String, trim: true },
    },

    priceSnapshot: { type: Number, required: true }, 

    addedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

/* ================= WISHLIST SCHEMA ================= */
const WishlistSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      index: true // makes it fast to query by user
    },

    items: [WishlistItemSchema], // array of products
  },
  { timestamps: true }
);

/* ================= MODEL ================= */
const Wishlist = mongoose.model("Wishlist", WishlistSchema);

export default Wishlist;
