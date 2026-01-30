import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js"; // Ensure filename matches

// 🔹 OTP generator
const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

// ================= SIGNUP =================
export const signup = async (req, res) => {
  try {
    const { fullName, email, mobile, password } = req.body;

    // Validate required fields
    if (!fullName || !mobile || !password) {
      return res.status(400).json({ message: "FullName, Mobile & Password are required" });
    }

    // Check if mobile already exists
    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      return res.status(400).json({ message: "Mobile already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = generateOTP();

    // Create user
    const user = await User.create({
      fullName,
      email: email || null, // optional
      mobile,
      password: hashedPassword,
      otp,
      otpExpiry: Date.now() + 2 * 60 * 1000 // 2 minutes
    });

    console.log(`OTP for ${mobile} : ${otp}`); // Replace with SMS integration

    res.status(201).json({ message: "OTP sent to mobile", userId: user._id });
  } catch (err) {
    // Handle duplicate key error (just in case)
    if (err.code === 11000) {
      return res.status(400).json({ message: "Mobile or Email already exists" });
    }
    res.status(500).json({ message: err.message });
  }
};

// ================= VERIFY OTP =================
export const verifyOtp = async (req, res) => {
  try {
    const { mobile, otp } = req.body;
    if (!mobile || !otp) return res.status(400).json({ message: "Mobile & OTP required" });

    const user = await User.findOne({ mobile });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });
    if (user.otpExpiry < Date.now()) return res.status(400).json({ message: "OTP expired" });

    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    res.json({ message: "OTP verified successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= LOGIN =================
export const login = async (req, res) => {
  try {
    const { mobile, password } = req.body;
    if (!mobile || !password)
      return res.status(400).json({ message: "Mobile & Password required" });

    const user = await User.findOne({ mobile });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.isVerified) return res.status(401).json({ message: "Please verify OTP first" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "SECRET_KEY",
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        mobile: user.mobile,
        email: user.email || null
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= RESEND OTP =================
export const resendOtp = async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!mobile) return res.status(400).json({ message: "Mobile required" });

    const user = await User.findOne({ mobile });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = Date.now() + 2 * 60 * 1000; // 2 minutes
    await user.save();

    console.log(`Resent OTP for ${mobile} : ${otp}`);

    res.json({ message: "OTP resent successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
