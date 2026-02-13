import mongoose from "mongoose";

const WishlistItemSchema = new mongoose.Schema({
  product: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Product", 
    required: false 
  },

  title: String,

  images: [
    {
      url: String,
      public_id: String,
    },
  ],

  category: String,

  variant: {
    sku: String,
    color: String,
    size: String,
  },

  priceSnapshot: Number,

  addedAt: { type: Date, default: Date.now },
}, { _id: true });


const WishlistSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true,
    index: true 
  },

  items: [WishlistItemSchema],

}, { timestamps: true });

const Wishlist = mongoose.model("Wishlist", WishlistSchema);
export default Wishlist;
