import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // link to store owner account

    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
    strict: true, // ✅ prevents extra fields from being saved
  },
);

export default mongoose.model("Admin", adminSchema);
