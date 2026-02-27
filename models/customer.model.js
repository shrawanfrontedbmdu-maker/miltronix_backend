import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const addressSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    phone: { type: String, required: true, match: /^[6-9]\d{9}$/ },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, default: "India" },
    pincode: { type: String, required: true },
    landmark: { type: String },
    isDefault: { type: Boolean, default: false },
});

const cartItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, default: 1, min: 1 },
    addedAt: { type: Date, default: Date.now },
});

const orderSchema = new mongoose.Schema({
    orderId: { type: String, required: true },
    products: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true },
        },
    ],
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["COD", "Card", "UPI", "NetBanking"], required: true },
    paymentStatus: { type: String, enum: ["Pending", "Paid", "Failed"], default: "Pending" },
    orderStatus: {
        type: String,
        enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Returned"],
        default: "Pending",
    },
    shippingAddress: addressSchema,
    placedAt: { type: Date, default: Date.now },
});

const reviewSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String },
    reviewedAt: { type: Date, default: Date.now },
});

const customerSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true, unique: true, match: /^[6-9]\d{9}$/ },
    password: { type: String, required: true },

    // ✅ FIXED: profileImageId added
    profileImage: { type: String, default: "" },
    profileImageId: { type: String, default: "" },

    addresses: [addressSchema],
    cart: [cartItemSchema],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    orders: [orderSchema],
    reviews: [reviewSchema],

    walletBalance: { type: Number, default: 0 },
    rewardPoints: { type: Number, default: 0 },

    rewardHistory: [
        {
            points: { type: Number, required: true },
            // ✅ FIXED: type field added for credit/debit tracking
            type: { type: String, enum: ["credit", "debit"], required: true },
            remark: { type: String },
            expiryDate: { type: Date },
            createdAt: { type: Date, default: Date.now },
        },
    ],

    referralCode: { type: String },

    role: { type: String, enum: ["customer", "admin"], default: "customer" },
    status: { type: String, enum: ["active", "blocked", "deleted"], default: "active" },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// 🔐 Hash password before save
customerSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// ✅ Compare password method
customerSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// 🕒 Auto-update updatedAt
customerSchema.pre("save", function (next) {
    this.updatedAt = Date.now();
    next();
});

export const Customer = mongoose.model("Customer", customerSchema);