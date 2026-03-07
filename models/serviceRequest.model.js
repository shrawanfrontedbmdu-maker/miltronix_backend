import mongoose from "mongoose";

// ─── Sub-schemas ─────────────────────────────────────────────────────────────

const paymentDetailsSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      enum: ["cash", "online", "card", "upi"],
      required: true,
    },
    amount: {
      type: Number,
      min: [0, "Amount cannot be negative"],
    },
    transactionId: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    street: { type: String, required: true },
    city:   { type: String, required: true },
    state:  { type: String, required: true },
    pincode: {
      type: String,
      required: true,
      match: [/^\d{6}$/, "Pincode must be 6 digits"],
    },
  },
  { _id: false }
);

// ─── Main Schema ──────────────────────────────────────────────────────────────

const serviceRequestSchema = new mongoose.Schema(
  {
    productname: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    type: {
      type: String,
      enum: ["demo", "repair", "relocation", "installation", "warranty"],
      required: [true, "Service type is required"],
    },

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },

    status: {
      type: String,
      enum: ["open", "in progress", "completed", "cancelled"],
      default: "open",
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
    },

    // Structured payment details instead of plain string
    paymentdetails: {
      type: paymentDetailsSchema,
      required: [true, "Payment details are required"],
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      match: [/^\+?[0-9]{10,15}$/, "Invalid phone number format"],
    },

    // Structured address instead of plain string
    address: {
      type: addressSchema,
      required: [true, "Address is required"],
    },

    preferredDate: {
      type: Date,
      validate: {
        validator: function (v) {
          // Allow null/undefined, but if set it must be today or future
          if (!v) return true;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return v >= today;
        },
        message: "Preferred date must be today or in the future",
      },
    },

    issueImages: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 5,
        message: "Maximum 5 issue images allowed",
      },
    },

    // Now an ObjectId ref instead of plain string
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Track when request was resolved (for SLA/reporting)
    resolvedAt: {
      type: Date,
      default: null,
    },

    // Admin/technician remarks
    adminRemarks: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt + updatedAt handled automatically
  }
);

// ─── Middleware ───────────────────────────────────────────────────────────────

// Auto-set resolvedAt when status changes to "completed"
serviceRequestSchema.pre("save", function (next) {
  if (this.isModified("status") && this.status === "completed") {
    this.resolvedAt = new Date();
  }
  // Clear resolvedAt if re-opened
  if (this.isModified("status") && this.status !== "completed") {
    this.resolvedAt = null;
  }
  next();
});

// ─── Indexes ──────────────────────────────────────────────────────────────────

serviceRequestSchema.index({ user: 1 });
serviceRequestSchema.index({ status: 1 });
serviceRequestSchema.index({ priority: 1 });
serviceRequestSchema.index({ type: 1 });
serviceRequestSchema.index({ assignedTo: 1 });

export default mongoose.model("ServiceRequest", serviceRequestSchema);