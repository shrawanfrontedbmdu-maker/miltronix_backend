import { Customer } from "../models/customer.model.js";

import { cloudinary, uploadCustomerProfileImage, deleteImage } from "../utils/cloudinary.js";
import mongoose from "mongoose";

// ─────────────────────────────────────────────
// @desc    Create / Register new customer
// @route   POST /api/customers
// ─────────────────────────────────────────────
export const createCustomer = async (req, res) => {
    try {
        let { name, email, phone, password } = req.body;

        if (!name || !email || !phone || !password) {
            return res.status(400).json({
                success: false,
                message: "All required fields must be filled",
            });
        }

        name = name.trim();
        email = email.toLowerCase().trim();
        phone = phone.trim();

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters",
            });
        }

        const existingUser = await Customer.findOne({
            $or: [{ email }, { phone }],
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email or phone already registered",
            });
        }

        let imageUrl = "";
        let imageId = "";

        if (req.file) {
            const result = await uploadCustomerProfileImage(req.file.buffer);
            imageUrl = result.secure_url;
            imageId = result.public_id;
        }

        const customer = new Customer({
            name,
            email,
            phone,
            password,
            profileImage: imageUrl,
            profileImageId: imageId, // ✅ FIXED: now saved in schema too
        });

        await customer.save();

        res.status(201).json({
            success: true,
            message: "Customer registered successfully",
            data: {
                _id: customer._id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                profileImage: customer.profileImage,
                status: customer.status,
                createdAt: customer.createdAt,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// @desc    Login customer
// @route   POST /api/customers/login
// ─────────────────────────────────────────────
export const loginCustomer = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }

        const customer = await Customer.findOne({ email, status: "active" });
        if (!customer) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const isMatch = await customer.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        // ✅ FIXED: password removed from response
        const { password: _, ...safeData } = customer.toObject();

        res.json({ success: true, message: "Login successful", data: safeData });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// @desc    Get all customers (with pagination)
// @route   GET /api/customers
// ─────────────────────────────────────────────
export const getAllCustomers = async (req, res) => {
    try {
        // ✅ FIXED: pagination added to prevent crash on large data
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, parseInt(req.query.limit) || 20);
        const skip = (page - 1) * limit;

        const [customers, total] = await Promise.all([
            Customer.find({ status: { $ne: "deleted" } })
                .select("-password")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Customer.countDocuments({ status: { $ne: "deleted" } }),
        ]);

        res.json({
            success: true,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            count: customers.length,
            data: customers,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// @desc    Get single customer by ID
// @route   GET /api/customers/:id
// ─────────────────────────────────────────────
export const getCustomerById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid customer ID" });
        }

        const customer = await Customer.findById(id).select("-password");

        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found" });
        }

        res.json({ success: true, data: customer });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// @desc    Update customer
// @route   PUT /api/customers/:id
// ─────────────────────────────────────────────
export const updateCustomer = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found" });
        }

        const {
            name, email, phone, password,
            status, role,
            walletBalance, rewardPoints,
            emailVerified, phoneVerified,
        } = req.body;

        // 👤 Basic Info
        if (name?.trim()) customer.name = name.trim();
        if (email?.trim()) customer.email = email.toLowerCase().trim();
        if (phone?.trim()) customer.phone = phone.trim();

        // 🔐 Password (optional)
        if (password) {
            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: "Password must be at least 6 characters",
                });
            }
            customer.password = password; // hashed by pre-save middleware
        }

        // 🚦 Account Control
        if (status) customer.status = status;
        if (role) customer.role = role;

        // 💰 Financials
        if (walletBalance !== undefined) customer.walletBalance = Number(walletBalance);
        if (rewardPoints !== undefined) customer.rewardPoints = Number(rewardPoints);

        // ✅ Verification
        if (emailVerified !== undefined) customer.emailVerified = emailVerified;
        if (phoneVerified !== undefined) customer.phoneVerified = phoneVerified;

        // 🖼 Profile Image
        if (req.file) {
            // ✅ FIXED: cloudinary now properly imported and used
            if (customer.profileImageId) {
                await cloudinary.uploader.destroy(customer.profileImageId);
            }
            const result = await uploadCustomerProfileImage(req.file.buffer);
            customer.profileImage = result.secure_url;
            customer.profileImageId = result.public_id;
        }

        await customer.save();

        const { password: _, ...safeData } = customer.toObject();

        res.json({
            success: true,
            message: "Customer updated successfully",
            data: safeData,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// @desc    Toggle customer status (active <-> blocked)
// @route   PATCH /api/customers/:id/toggle-status
// ─────────────────────────────────────────────
export const toggleCustomerStatus = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found" });
        }

        if (customer.status === "deleted") {
            return res.status(400).json({ success: false, message: "Cannot toggle a deleted customer" });
        }

        customer.status = customer.status === "active" ? "blocked" : "active";
        await customer.save();

        res.json({
            success: true,
            message: `Customer is now ${customer.status}`,
            data: { _id: customer._id, status: customer.status },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// @desc    Soft delete customer
// @route   DELETE /api/customers/:id
// ─────────────────────────────────────────────
export const deleteCustomer = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found" });
        }

        customer.status = "deleted";
        await customer.save();

        res.json({ success: true, message: "Customer deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// @desc    Add reward points to customer
// @route   POST /api/customers/:id/reward-points
// ─────────────────────────────────────────────
export const addRewardPoints = async (req, res) => {
    try {
        const { points, expiryDate, remark } = req.body;

        if (!points || isNaN(points) || Number(points) <= 0) {
            return res.status(400).json({ success: false, message: "Points must be a number greater than 0" });
        }

        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found" });
        }

        const numPoints = Number(points);

        // ✅ FIXED: type: "credit" added
        customer.rewardHistory.push({
            points: numPoints,
            type: "credit",
            remark: remark || "Admin added points",
            expiryDate: expiryDate ? new Date(expiryDate) : null,
        });

        customer.rewardPoints += numPoints;

        await customer.save();

        res.json({
            success: true,
            message: `${numPoints} reward points added successfully`,
            totalPoints: customer.rewardPoints,
            history: customer.rewardHistory,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ─────────────────────────────────────────────
// @desc    Deduct reward points from customer
// @route   POST /api/customers/:id/deduct-points
// ─────────────────────────────────────────────
export const deductRewardPoints = async (req, res) => {
    try {
        const { points, remark } = req.body;

        if (!points || isNaN(points) || Number(points) <= 0) {
            return res.status(400).json({ success: false, message: "Points must be a number greater than 0" });
        }

        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found" });
        }

        const numPoints = Number(points);

        if (customer.rewardPoints < numPoints) {
            return res.status(400).json({ success: false, message: "Insufficient reward points" });
        }

        customer.rewardHistory.push({
            points: -numPoints, // negative for debit
            type: "debit",
            remark: remark || "Points deducted",
        });

        customer.rewardPoints -= numPoints;

        await customer.save();

        res.json({
            success: true,
            message: `${numPoints} reward points deducted successfully`,
            totalPoints: customer.rewardPoints,
            history: customer.rewardHistory,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};