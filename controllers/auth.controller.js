import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import User from "../models/user.model.js";
import { sendOtpSMS } from "../utils/sendOtp.js";
import mongoose from "mongoose";
import Order from "../models/order.model.js";
import Wishlist from "../models/wishlist.model.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ---------------- HELPER ----------------
const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

// ---------------- SIGNUP (OTP) ----------------
export const signup = async (req, res) => {
  try {
    const { fullName, email, mobile, password } = req.body;
    console.log(req.body)
    if (!fullName || !mobile || !password) {
      return res.status(400).json({ message: "Full name, mobile and password are required" });
    }

    // check mobile duplicate
    const existingMobile = await User.findOne({ mobile });
    if (existingMobile && existingMobile.isVerified) {
          console.log(existingMobile)

      return res.status(400).json({ message: "Mobile already registered" });
    }

    // check email duplicate (if provided)
    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail && existingEmail.isVerified) {
            console.log(email)

        return res.status(400).json({ message: "Email already registered" });
      }
    }

    const otp = generateOTP();
    const hashedPassword = await bcrypt.hash(password, 10);

    let user = existingMobile;

    if (user) {
      user.otp = otp;
      user.otpExpiry = Date.now() + 2 * 60 * 1000;
      await user.save();
    } else {
      const userData = {
        fullName,
        mobile,
        password: hashedPassword,
        otp,
        otpExpiry: Date.now() + 2 * 60 * 1000,
        isVerified: false,
      };

      if (email) userData.email = email;

      user = await User.create(userData);
    }
    console.log("user",user)
    await sendOtpSMS(mobile, otp);
    res.status(201).json({ message: "OTP sent successfully" });

  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ---------------- VERIFY OTP ----------------
export const verifyOtp = async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    const user = await User.findOne({ mobile });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });
    if (user.otpExpiry < Date.now()) return res.status(400).json({ message: "OTP expired" });

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;

    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ message: "OTP verified successfully", token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------- LOGIN ----------------
export const login = async (req, res) => {
  try {
    const { mobile, password } = req.body;
    console.log(req.body)
    if (!mobile || !password) {
      return res.status(400).json({ message: "Mobile and password required" });
    }

    const user = await User.findOne({ mobile }).select("+password");
    if (!user) return res.status(404).json({ message: "User not found" });
    // log non-sensitive info only
    console.log({ userId: user._id, mobile: user.mobile, isVerified: user.isVerified });
    if (!user.isVerified) return res.status(401).json({ message: "Verify OTP first" });
    if (!user.password) return res.status(400).json({ message: "No password set for this account — use social login or reset password" });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------- FORGOT PASSWORD ----------------
export const forgotPassword = async (req, res) => {
  try {
    const { mobile } = req.body;

    const user = await User.findOne({ mobile });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = generateOTP();
    user.resetOtp = otp;
    user.resetOtpExpiry = Date.now() + 2 * 60 * 1000;

    await user.save();
    await sendOtpSMS(mobile, otp);

    res.json({ message: "Reset OTP sent successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------- VERIFY RESET OTP ----------------
export const verifyResetOtp = async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    const user = await User.findOne({ mobile });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.resetOtp !== otp) return res.status(400).json({ message: "Invalid OTP" });
    if (user.resetOtpExpiry < Date.now()) return res.status(400).json({ message: "OTP expired" });

    res.json({ message: "OTP verified" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------- RESET PASSWORD ----------------
export const resetPassword = async (req, res) => {
  try {
    const { mobile, newPassword } = req.body;

    const user = await User.findOne({ mobile });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;

    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------- GOOGLE LOGIN ----------------
export const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: "ID token required" });

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      const userData = {
        fullName: name,
        email,
        googleId,
        isVerified: true,
      };

      user = await User.create(userData);
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const getUserProfile = async (req, res) => {
  try {
    const id= req.user._id;
    console.log(id)

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        status: 400,
        message: "Invalid user id",
      });
    }

    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "User not found",
      });
    }

    res.status(200).json({
      status: 200,
      message: "User profile retrieved successfully",
      user: user
    });

  } catch (err) {
    res.status(500).json({
      status: 500,
      message: err.message,
    });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([_, v]) => v !== undefined)
    );

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
    });

    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "User not found",
      });
    }

    res.status(200).json({
      status: 200,
      message: "User profile updated successfully",
      user,
    });
  } catch (err) {
    res.status(500).json({
      status: 500,
      message: err.message,
    });
  }
};

/* ================= GET WISHLIST BY USER ================= */
export const getMyWishlist = async (req, res) => {
  try {
    const userId  = req.user._id;

    const wishlist = await Wishlist.findOne({ user: userId })
      .populate("items.product");

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: "Wishlist not found"
      });
    }

    return res.status(200).json({
      success: true,
      wishlist
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};