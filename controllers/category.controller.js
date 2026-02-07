import Category from "../models/category.model.js";
import { uploadToCloud } from "../config/cloudinary.js";

// helper
const getFileByField = (files, field) => {
  return files?.find((f) => f.fieldname === field);
};

// ================= CREATE CATEGORY =================
export const createCategory = async (req, res) => {
  try {
    const {
      categoryKey,
      pageTitle,
      pageSubtitle = "",
      description = "",
    } = req.body;

    if (!categoryKey || !pageTitle) {
      return res
        .status(400)
        .json({ message: "categoryKey & pageTitle required" });
    }

    const exists = await Category.findOne({
      categoryKey: categoryKey.toLowerCase(),
    });
    if (exists)
      return res.status(400).json({ message: "Category already exists" });

    console.log("FILES:", req.files);

    // ===== MAIN IMAGE =====
    let imageUrl = "/images/placeholder.png";
    const mainImage = getFileByField(req.files, "image");

    if (mainImage) {
      const result = await uploadToCloud(mainImage.buffer, "categories");
      imageUrl = result.secure_url;
    }

    const category = await Category.create({
      categoryKey: categoryKey.toLowerCase(),
      pageTitle,
      pageSubtitle,
      description,
      image: imageUrl,
    });

    res.status(201).json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ================= GET ALL =================
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= GET BY ID =================
export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    res.json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= UPDATE CATEGORY =================
export const updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    const updateData = { ...req.body };

    console.log("FILES:", req.files);

    // ===== MAIN IMAGE =====
    const mainImage = getFileByField(req.files, "image");
    if (mainImage) {
      const result = await uploadToCloud(mainImage.buffer, "categories");
      updateData.image = result.secure_url;
    }

    const updated = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ================= DELETE =================
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    await category.deleteOne();
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
