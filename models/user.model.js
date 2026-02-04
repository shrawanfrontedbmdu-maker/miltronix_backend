import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },

    email: { type: String, unique: true, sparse: true },

    mobile: { type: String, unique: true, required: true },

    password: { type: String, required: true },

    otp: String,
    otpExpiry: Date,

    resetOtp: String,
    resetOtpExpiry: Date,

    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
