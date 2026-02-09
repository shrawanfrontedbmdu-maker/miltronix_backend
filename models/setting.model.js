import mongoose from "mongoose";

const slugValidator = function (value) {
    if (!/^[a-z0-9-]+$/.test(value)) {
        return false;
    }
    if (RESERVED_SLUGS.includes(value)) {
        return false;
    }
    return true;
};

const RESERVED_SLUGS = ["login", "signup", "admin", "api", "settings", "dashboard"];

const isValidSlug = (slug) => /^[a-z0-9-]+$/.test(slug);

const settingsSchema = new mongoose.Schema({
    general: {
        metaTitle: String,
        metaKeyword: String,
        storeTheme: String,
        layout: String,
        description: String
    },

    store: {
        storeName: String,
        storeOwnerName: String,
        storePhone: String,
        storeEmail: String,
        storeAddress: String,
        storeCity: String,
        storeState: String,
        storeCountry: String,
        storeZip: String
    },

    security: {
        twoFactorAuth: Boolean,
        loginNotifications: Boolean,
        sessionTimeout: String,
        passwordExpiry: String
    },

    notifications: {
        emailNotifications: Boolean,
        orderNotifications: Boolean,
        marketingEmails: Boolean,
        systemUpdates: Boolean
    },

    payment: {
        currency: String,
        taxRate: String,
        enablePaypal: Boolean,
        enableStripe: Boolean,
        enableCod: Boolean
    },

    routes: {
        product: {
            type: String,
            default: "products",
            lowercase: true,
            trim: true,
            validate: slugValidator
        },
        category: {
            type: String,
            default: "categories",
            lowercase: true,
            trim: true,
            validate: slugValidator
        },
        brand: {
            type: String,
            default: "brands",
            lowercase: true,
            trim: true,
            validate: slugValidator
        },
        order: {
            type: String,
            default: "orders",
            lowercase: true,
            trim: true,
            validate: slugValidator
        },
        invoice: {
            type: String,
            default: "invoices",
            lowercase: true,
            trim: true,
            validate: slugValidator
        },
        notification: {
            type: String,
            default: "notifications",
            lowercase: true,
            trim: true,
            validate: slugValidator
        },
        profile: {
            type: String,
            default: "profile",
            lowercase: true,
            trim: true,
            validate: slugValidator
        },
        serviceRequest: {
            type: String,
            default: "service-requests",
            lowercase: true,
            trim: true,
            validate: slugValidator
        },
        blog: {
            type: String,
            default: "blogs",
            lowercase: true,
            trim: true,
            validate: slugValidator
        },
        banner: {
            type: String,
            default: "banners",
            lowercase: true,
            trim: true,
            validate: slugValidator
        },
        role: {
            type: String,
            default: "roles",
            lowercase: true,
            trim: true,
            validate: slugValidator
        }
    }

}, { timestamps: true });

export default mongoose.model("Settings", settingsSchema);
