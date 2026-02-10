import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },

    email: { type: String, unique: true, sparse: true },

    mobile: { type: String, unique: true, sparse: true }, 

    password: { type: String }, 

    otp: String,
    otpExpiry: Date,

    resetOtp: String,
    resetOtpExpiry: Date,

    isVerified: { type: Boolean, default: false },

    googleId: { type: String, unique: true, sparse: true }, 
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
