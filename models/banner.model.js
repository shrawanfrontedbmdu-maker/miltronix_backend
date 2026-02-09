import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        imageUrl: {
            type: String,
            required: true
        },

        imageAlt: {
            type: String
        },

        link: {
            type: String
        },

        linkTarget: {
            type: String,
            enum: ["_self", "_blank"],
            default: "_self"
        },

        placement: {
            type: String,
            default: "homepage-hero"
        },

        targetAudience: {
            type: String,
            default: "All Users"
        },

        status: {
            type: String,
            enum: ["Active", "InActive", "Scheduled", "Expired"],
            default: "InActive"
        },

        priority: {
            type: String,
            enum: ["High", "Medium", "Low"],
            default: "Medium"
        },

        isClickable: {
            type: Boolean,
            default: true
        },

        trackingEnabled: {
            type: Boolean,
            default: false
        },

        notes: {
            type: String
        },

        startDate: {
            type: Date
        },

        endDate: {
            type: Date
        }
    },
    { timestamps: true }
);

export default mongoose.model("Banner", bannerSchema);
