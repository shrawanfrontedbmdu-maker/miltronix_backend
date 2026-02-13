// models/Otp.model.js
import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
    {
        contactNumber: {
            type: String,
            required: true,
            unique: true,
            index: true
        },

        otp: {
            type: Number,
            required: true
        },

        expiresAt: {
            type: Date,
            required: true
        }
    },
    {
        timestamps: true
    }
);

// 🔥 TTL Index → OTP khud delete ho jayega expire hone ke baad
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Otp", otpSchema);
