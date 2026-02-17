import mongoose from "mongoose";

/* ================= CART ITEM ================= */

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    variant: {
      sku: { type: String, required: true },
      attributes: {
        color: String,
        size: String,
        model: String,
      },
    },

    title: { type: String, required: true },
    category: String,

    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String },
      },
    ],

    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },

    priceSnapshot: {
      type: Number,
      required: true,
      min: 0,
    },

    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

/* ================= CART ================= */

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,   // one cart per user
      index: true,
    },

    items: [cartItemSchema],

    subtotal: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

/* ================= AUTO SUBTOTAL ================= */

cartSchema.pre("save", function (next) {
  this.subtotal = this.items.reduce(
    (total, item) => total + item.priceSnapshot * item.quantity,
    0
  );
  next();
});

export default mongoose.model("Cart", cartSchema);
