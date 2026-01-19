import mongoose, { mongo } from "mongoose";

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    contentBlocks: [{
        text: {
            type: String,
        },
        image: {
            type: String,
        }
    }],
    tags: [{
        type: String,
    }],
    excerpt: {
        type: String
    },
    category: {
        type: String
    },
    author: {
        type: String,
        // required: true,
        trim: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
})

export default mongoose.model("Blogs", blogSchema)