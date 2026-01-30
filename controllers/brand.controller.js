import brandmodel from "../models/brand.model.js";

export const getBrand = async (req, res) => {
    try {
        const brand = await brandmodel.find();
        if (brand.length !== 0) {
            return res.status(200).json({
                success: true,
                message: "Brand fetched successfully",
                brand: brand
            })
        } else {
            return res.status(400).json({
                message: "No Any Brand's are present"
            })
        }
    } catch (error) {
        res.status(500).json({
            message: "error fetching brands",
            error,
        });
    }
}

export const getBrandByid = async (req, res) => {
    try {
        const { id } = req.params;
        const brand = await brandmodel.findById(id);
        if (!brand) {
            return res.status(404).json({ message: "brand not found" });
        }
        res.status(200).json({
            message: "brand fetched successfully",
            brand,
        });
    } catch (error) {
        res.status(500).json({
            message: "error getting brands",
        });
    }
};

export const deleteBrand = async (req, res) => {
    try {
        const { id } = req.params;
        const brand = await brandmodel.findByIdAndDelete(id);
        if (!brand) {
            return res.status(404).json({ message: "brand not found" });
        }
        res.status(200).json({
            message: "brand deleted successfully",
            brand,
        });
    } catch (error) {
        res.status(500).json({
            message: "Error deleting brand",
            error,
        });
    }
};

export const createBrand = async (req, res) => {
    try {
        const { name } = req.body;

        // 1️⃣ Body validation
        if (!name || name.trim() === "") {
            return res.status(400).json({
                success: false,
                message: "Brand name is required"
            });
        }

        // 2️⃣ Check duplicate brand
        const existname = await brandmodel.findOne({
            name: name.trim()
        });

        if (existname) {
            return res.status(400).json({
                success: false,
                message: "Same brand name already exists"
            });
        }

        // 3️⃣ Create new brand
        const newbrand = new brandmodel({
            name: name.trim()
        });

        await newbrand.save();

        return res.status(201).json({
            success: true,
            message: "New brand created successfully",
            data: newbrand
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Error in creating brand",
            error: error.message
        });
    }
};


export const editBrand = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!id) {
            return res.status(400).json({ message: "Brand ID required" });
        }

        if (!name || name.trim() === "") {
            return res.status(400).json({ message: "Brand name required" });
        } 
        const updatedBrand = await brandmodel.findByIdAndUpdate(
            id,
            { name: name.trim() },
            { new: true, runValidators: true }
        );

        if (!updatedBrand) {
            return res.status(404).json({ message: "Brand not found" });
        }

        return res.status(200).json({
            success: true,
            message: "Brand updated successfully",
            data: updatedBrand
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Update failed",
            error: error.message
        });
    }
};
