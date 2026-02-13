import { Customer } from "../models/customer.model.js";
import { uploadCustomerProfileImage } from "../utils/cloudinary.js"
import mongoose from "mongoose";

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
            profileImageId: imageId,
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
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const loginCustomer = async (req, res) => {
    try {
        const { email, password } = req.body;

        const customer = await Customer.findOne({ email, status: "active" });
        if (!customer) return res.status(401).json({ success: false, message: "Invalid credentials" });

        const isMatch = await customer.matchPassword(password);
        if (!isMatch) return res.status(401).json({ success: false, message: "Invalid credentials" });

        res.json({ success: true, message: "Login successful", data: customer });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateCustomer = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found" });
        }

        const {
            name,
            email,
            phone,
            password,
            status,
            role,
            walletBalance,
            rewardPoints,
            emailVerified,
            phoneVerified,
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
            customer.password = password; // hashed by middleware
        }

        // 🚦 Account Control
        if (status) customer.status = status;
        if (role) customer.role = role;

        // 💰 Financials (Admin Adjustment)
        if (walletBalance !== undefined) customer.walletBalance = Number(walletBalance);
        if (rewardPoints !== undefined) customer.rewardPoints = Number(rewardPoints);

        // ✅ Verification
        if (emailVerified !== undefined) customer.emailVerified = emailVerified;
        if (phoneVerified !== undefined) customer.phoneVerified = phoneVerified;

        // 🖼 Profile Image
        if (req.file) {
            if (customer.profileImageId) {
                await cloudinary.uploader.destroy(customer.profileImageId);
            }
            const result = await uploadCustomerProfileImage(req.file.buffer);
            customer.profileImage = result.secure_url;
            customer.profileImageId = result.public_id;
        }

        await customer.save();

        res.json({
            success: true,
            message: "Customer updated successfully",
            data: customer,
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const toggleCustomerStatus = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });

        customer.status = customer.status === "active" ? "blocked" : "active";
        await customer.save();

        res.json({ success: true, message: `Customer is now ${customer.status}`, data: customer });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getAllCustomers = async (req, res) => {
    try {
        const customers = await Customer.find()
            .select("-password") // 🔒 hide password
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: customers.length,
            data: customers,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

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

export const addRewardPoints = async (req, res) => {
    try {
        const { points, expiryDate, remark } = req.body;

        if (!points || points <= 0) {
            return res.status(400).json({ success: false, message: "Points must be greater than 0" });
        }

        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found" });
        }

        // Add to history
        customer.rewardHistory.push({
            points,
            remark: remark || "Admin added points",
            expiryDate: expiryDate ? new Date(expiryDate) : null,
        });

        // Update total usable points
        customer.rewardPoints += points;

        await customer.save();

        res.json({
            success: true,
            message: "Reward points added successfully",
            totalPoints: customer.rewardPoints,
            history: customer.rewardHistory
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
