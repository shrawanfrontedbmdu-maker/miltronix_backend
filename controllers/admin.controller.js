import jwt from "jsonwebtoken";
import adminModel from "../models/admin.model.js";
import bcrypt from "bcryptjs";
import storeModel from "../models/store.model.js";
import userModel from "../models/user.model.js";

const generateToken = (id) => {
  console.log(id);
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

export const adminRegister = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const admin = await userModel.findOne({ email, role: "admin" });
    if (admin) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await userModel.create({
      fullName: name,
      email,
      password: hashedPassword,
      isVerified: true,
      role: "admin",
    });

    const newAdmin = await adminModel.create({
      userId: user._id,
      name,
    });

    const token = generateToken(newAdmin._id);
    return res.status(201).json({
      message: "Admin registered successfully",
      success: true,
      token,
      admin: newAdmin,
    });
  } catch (error) {
    console.error("adminRegister error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }

    const user = await userModel.findOne({ email, role: "admin" }).select("+password");
    if (!user) {
      return res.status(400).json({ message: "Admin not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const admin = await adminModel.findOne({ userId: user._id });
    if (!admin) {
      // user exists but admin profile missing
      return res.status(404).json({ message: "Admin profile not found" });
    }

    admin.lastLogin = Date.now();
    await admin.save();

    const token = generateToken(admin._id);
    return res.status(200).json({
      success: true,
      token,
      message: "Admin logged in successfully",
      admin,
    });
  } catch (error) {
    console.error("adminLogin error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getStores = async (req, res) => {
  try {
    const stores = await storeModel.find().populate("userId").sort({ createdAt: -1 });
    res.status(200).json({ success: true, stores });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};