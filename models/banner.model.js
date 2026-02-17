import mongoose from "mongoose";

const { Schema } = mongoose;

const bannerSchema = new Schema(
  {
    bannertype: {
      type: String,
      required: [true, "Banner type is required"],
      trim: true,
    },

    theme: {
      type: String,
      required: [true, "Theme is required"],
      trim: true,
    },

    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },

    bennerimg: {   // field name same rakha as you requested
      type: String,
      required: [true, "Banner image URL is required"],
      trim: true,
    },

    startDate: {
      type: Date,
      default: Date.now(),
    },


    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
      lowercase: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Optional: Index for faster filtering
bannerSchema.index({ status: 1 });
bannerSchema.index({ startDate: 1, endDate: 1 });

export default mongoose.model("Banner", bannerSchema);
