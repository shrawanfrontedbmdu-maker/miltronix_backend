import Category from "../models/category.model.js";
import { uploadToCloud } from "../config/cloudinary.js";

// ================= CREATE CATEGORY =================
export const createCategory = async (req, res) => {
  try {
    const {
      categoryKey,
      pageTitle,
      pageSubtitle = "",
      description = "",
      featureDescription = "",
      status = "active",
    } = req.body;

    if (!categoryKey || !pageTitle) {
      return res
        .status(400)
        .json({ message: "categoryKey & pageTitle required" });
    }

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const exists = await Category.findOne({
      categoryKey: categoryKey.toLowerCase(),
    });

    if (exists)
      return res.status(400).json({ message: "Category already exists" });

    // ===== MAIN IMAGE =====
    let imageUrl = "/images/placeholder.png";
    const mainImage = req.files?.image?.[0];

    if (mainImage) {
      const result = await uploadToCloud(mainImage.buffer, "categories");
      imageUrl = result.secure_url;
    }

    // ===== FEATURE ICONS UPLOAD =====
    let featuresData = [];

    const featureIcons = req.files?.featureIcons || [];
    const featureTitles = req.body.featureTitles || [];

    for (let i = 0; i < featureIcons.length; i++) {
      const result = await uploadToCloud(
        featureIcons[i].buffer,
        "categories/features"
      );

      featuresData.push({
        title: Array.isArray(featureTitles)
          ? featureTitles[i]
          : featureTitles,
        icon: result.secure_url,
      });
    }

    const category = await Category.create({
      categoryKey: categoryKey.toLowerCase(),
      pageTitle,
      pageSubtitle,
      description,
      featureDescription,
      features: featuresData,
      image: imageUrl,
      status,
    });

    res.status(201).json(category);
  } catch (err) {
    console.error("Create Category Error:", err);
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

    if (
      updateData.status &&
      !["active", "inactive"].includes(updateData.status)
    ) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    // ===== MAIN IMAGE =====
    const mainImage = req.files?.image?.[0];
    if (mainImage) {
      const result = await uploadToCloud(mainImage.buffer, "categories");
      updateData.image = result.secure_url;
    }

    // ===== FEATURE ICON UPDATE =====
    const featureIcons = req.files?.featureIcons || [];
    const featureTitles = req.body.featureTitles || [];

    if (featureIcons.length > 0) {
      let featuresData = [];

      for (let i = 0; i < featureIcons.length; i++) {
        const result = await uploadToCloud(
          featureIcons[i].buffer,
          "categories/features"
        );

        featuresData.push({
          title: Array.isArray(featureTitles)
            ? featureTitles[i]
            : featureTitles,
          icon: result.secure_url,
        });
      }

      updateData.features = featuresData;
    }

    const updated = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    console.error("Update Category Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ================= GET ALL =================
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
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

// ================= DELETE CATEGORY =================
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    await category.deleteOne();

    res.json({ message: "Category deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};