import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import User from "../models/user.model.js";
import { sendOtpSMS } from "../utils/sendOtp.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ---------------- HELPER ----------------
const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

// ---------------- SIGNUP (OTP) ----------------
export const signup = async (req, res) => {
  try {
    const { fullName, email, mobile, password } = req.body;
    if (!fullName || !mobile || !password)
      return res.status(400).json({ message: "All fields required" });

    let user = await User.findOne({ mobile });
    const otp = generateOTP();
    const hashedPassword = await bcrypt.hash(password, 10);

    if (user) {
      if (user.isVerified)
        return res.status(400).json({ message: "Mobile already registered" });

      user.otp = otp;
      user.otpExpiry = Date.now() + 2 * 60 * 1000;
      await user.save();
      await sendOtpSMS(mobile, otp);
      return res.json({ message: "OTP resent successfully" });
    }

    user = await User.create({
      fullName,
      email,
      mobile,
      password: hashedPassword,
      otp,
      otpExpiry: Date.now() + 2 * 60 * 1000,
      isVerified: false,
    });

    await sendOtpSMS(mobile, otp);
    res.status(201).json({ message: "OTP sent successfully" });
  } catch (err) {
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
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ message: "OTP verified successfully", token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------- LOGIN (Password) ----------------
export const login = async (req, res) => {
  try {
    const { mobile, password } = req.body;
    const user = await User.findOne({ mobile });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.isVerified) return res.status(401).json({ message: "Verify OTP first" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token });
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
    user.resetOtp = null;
    user.resetOtpExpiry = null;
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
      user = await User.create({
        fullName: name,
        email,
        googleId,
        isVerified: true,
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
