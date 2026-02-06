import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },

        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
            minlength: 5,
            maxlength: 16,
        },

        description: {
            type: String,
        },

        discountType: {
            type: String,
            enum: ["percentage", "flat"],
            required: true,
        },

        discountValue: {
            type: Number,
            required: true,
        },

        minOrderValue: {
            type: Number,
            default: 0,
        },

        maxDiscount: {
            type: Number,
        },

        startDate: {
            type: Date,
            required: true,
        },

        expiryDate: {
            type: Date,
            required: true,
        },

        totalUsage: {
            type: Number,
            default: null,
        },

        perCustomerLimit: {
            type: Number,
            default: 1,
        },

        visibility: {
            type: String,
            enum: ["public", "private"],
            default: "public",
        },

        platform: {
            type: String,
            enum: ["web", "app", "both"],
            default: "both",
        },

        firstPurchaseOnly: {
            type: Boolean,
            default: false,
        },

        status: {
            type: String,
            enum: ["active", "inactive", "expired"],
            default: "active",
        },

        usedCount: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

export default mongoose.model("Coupon", couponSchema);
