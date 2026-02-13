import mongoose from "mongoose";

const dropdownProductSchema = new mongoose.Schema(
    {
        productId: { type: String, required: true, unique: true },
        title: { type: String, required: true, trim: true },
        image: { type: String, required: true, trim: true },
        price: { type: String, required: true, trim: true },
        oldPrice: { type: String, trim: true },
        saveAmount: { type: String, trim: true },
    },
    { timestamps: true, versionKey: false }
);

export default mongoose.model("DropdownProduct", dropdownProductSchema);
