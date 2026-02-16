import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email address",
      ],
    },

    mobile: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: [8, "Password must be at least 8 characters long"],
      select: false,
    },

    role:{
      type: String,
      enum: ["user", "storeManager", "admin"],
      default: "user",
    },

    role:{
      type: String,
      enum: ["user", "storeManager", "admin"],
      default: "user",
    },

    otp: String,
    otpExpiry: Date,

    resetOtp: String,
    resetOtpExpiry: Date,

    isVerified: {
      type: Boolean,
      default: false,
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
