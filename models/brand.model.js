import mongoose from "mongoose";

const brandSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    }
});
const brandmodel = mongoose.model("brandmodel", brandSchema);
export default brandmodel