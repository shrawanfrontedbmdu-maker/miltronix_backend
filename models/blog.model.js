import mongoose from "mongoose";

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },

    excerpt: {
        type: String,
        trim: true
    },

    category: {
        type: String,
        trim: true
    },

    tags: [{
        type: String,
        trim: true
    }],

    // ✅ Content Blocks
    contentBlocks: [{
        type: { type: String, required: true }, // text, image, heading, quote, code, list
        content: String,
        url: String,
        alt: String,
        caption: String,
        order: Number
    }],

    featuredImage: {
        url: String,
        alt: String
    },

    status: {
        type: String,
        enum: ["draft", "published"],
        default: "draft"
    },

    // ✅ NEW: Author Object
    author: {
        name: { type: String, trim: true },
        email: { type: String, trim: true },
        image: { type: String } // profile picture URL
    },

    // ✅ NEW: Blog Stats
    views: {
        type: Number,
        default: 0
    },

    likes: {
        type: Number,
        default: 0
    },

    commentsCount: {
        type: Number,
        default: 0
    },

    // ✅ NEW: Estimated Read Time (in minutes)
    readTime: {
        type: Number,
        default: 1
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model("Blog", blogSchema);
