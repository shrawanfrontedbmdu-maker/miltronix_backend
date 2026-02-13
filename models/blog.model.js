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

    author: {
        name: { type: String, trim: true },
        email: { type: String, trim: true },
        image: { type: String }
    },

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

    readTime: {
        type: Number,
        default: 1
    },
    slug:
    {
        type: String,
        unique: true,
        index: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model("Blog", blogSchema);
