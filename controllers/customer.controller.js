import { Customer } from "../models/customer.model.js";
import { uploadCustomerProfileImage } from "../utils/cloudinary.js"

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

// export const updateCustomer = async (req, res) => {
//     try {
//         const customer = await Customer.findById(req.params.id);
//         if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });

//         Object.keys(req.body).forEach((key) => {
//             customer[key] = req.body[key];
//         });

//         await customer.save();

//         res.json({ success: true, message: "Customer updated", data: customer });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// };
export const updateCustomer = async (req, res) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found" });
        }

        const { name, phone, password } = req.body;

        // ===== BASIC INFO UPDATE =====
        if (name !== undefined && name.trim() !== "") {
            customer.name = name.trim();
        }

        if (phone !== undefined && phone.trim() !== "") {
            customer.phone = phone;
        }

        // ===== PASSWORD UPDATE =====
        if (password !== undefined && password !== "") {
            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: "Password must be at least 6 characters",
                });
            }
            customer.password = password; // will hash via pre-save middleware
        }

        // ===== PROFILE IMAGE UPDATE =====
        if (req.file) {
            if (customer.profileImageId) {
                await cloudinary.uploader.destroy(customer.profileImageId);
            }

            const result = await uploadCustomerProfileImage(req.file.buffer);
            customer.profileImage = result.secure_url;
            customer.profileImageId = result.public_id;
        }

        await customer.save(); // triggers password hash + updatedAt middleware

        res.json({
            success: true,
            message: "Customer updated successfully",
            data: {
                _id: customer._id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                profileImage: customer.profileImage,
                status: customer.status,
            },
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