// controllers/category.controller.js
import Category from "../models/category.model.js";
import { uploadToCloud } from "../config/cloudinary.js";

// ================= CREATE CATEGORY =================
export const createCategory = async (req, res) => {
  try {
    const { categoryKey, pageTitle, pageSubtitle = "", description = "", status = "active" } = req.body;

    if (!categoryKey || !pageTitle) {
      return res.status(400).json({ message: "categoryKey & pageTitle required" });
    }

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const exists = await Category.findOne({ categoryKey: categoryKey.toLowerCase() });
    if (exists) return res.status(400).json({ message: "Category already exists" });

    // ===== MAIN IMAGE =====
    let imageUrl = "/images/placeholder.png";
    const filesArray = Array.isArray(req.files) ? req.files : [];
    const mainImage = filesArray.find(f => f.fieldname === "image");
    if (mainImage) {
      const result = await uploadToCloud(mainImage.buffer, "categories");
      imageUrl = result.secure_url;
    }

    // ===== FEATURES =====
    const featureImageFiles = filesArray.filter(f => f.fieldname === "featureImages");
    let featureImages = [];
    if (featureImageFiles.length > 0) {
      featureImages = await Promise.all(
        featureImageFiles.map(file => uploadToCloud(file.buffer, "categories/features").then(r => r.secure_url))
      );
    }

    const category = await Category.create({
      categoryKey: categoryKey.toLowerCase(),
      pageTitle,
      pageSubtitle,
      description,
      image: imageUrl,
      features: {
        title: req.body.featuresTitle || "",
        description: req.body.featuresDescription || "",
        images: featureImages,
      },
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
  console.log("REQ.BODY:", req.body);
  console.log("REQ.FILES:", req.files);

  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    // ===== BASE UPDATE DATA =====
    const updateData = {
      categoryKey: req.body.categoryKey?.toLowerCase() || category.categoryKey,
      pageTitle: req.body.pageTitle || category.pageTitle,
      pageSubtitle: req.body.pageSubtitle ?? category.pageSubtitle,
      description: req.body.description ?? category.description,
      status: req.body.status || category.status,
    };

    if (!["active", "inactive"].includes(updateData.status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    // ===== HANDLE FILES =====
    const filesArray = Array.isArray(req.files) ? req.files : [];

    // ---- MAIN IMAGE ----
    const mainImage = filesArray.find(f => f.fieldname === "image");
    if (mainImage && mainImage.buffer) {
      try {
        const result = await uploadToCloud(mainImage.buffer, "categories");
        updateData.image = result.secure_url;
      } catch (e) {
        console.error("Main image upload failed:", e);
        return res.status(500).json({ message: "Main image upload failed" });
      }
    }

    // ---- FEATURES ----
    const existingFeatures = category.features || {};

    // Safely handle existingFeatureImages
    let existingImages = [];
    if (req.body.existingFeatureImages) {
      if (Array.isArray(req.body.existingFeatureImages)) {
        existingImages = req.body.existingFeatureImages;
      } else if (typeof req.body.existingFeatureImages === "string") {
        existingImages = [req.body.existingFeatureImages];
      }
    } else if (existingFeatures.images?.length) {
      existingImages = existingFeatures.images;
    }

    // New feature images
    const featureImageFiles = filesArray.filter(f => f.fieldname === "featureImages");
    let uploadedImages = [];
    if (featureImageFiles.length > 0) {
      try {
        uploadedImages = await Promise.all(
          featureImageFiles.map(file =>
            uploadToCloud(file.buffer, "categories/features").then(r => r.secure_url)
          )
        );
      } catch (e) {
        console.error("Feature images upload failed:", e);
        return res.status(500).json({ message: "Feature images upload failed" });
      }
    }

    updateData.features = {
      title: req.body.featuresTitle ?? existingFeatures.title ?? "",
      description: req.body.featuresDescription ?? existingFeatures.description ?? "",
      images: [...existingImages, ...uploadedImages],
    };

    // ===== UPDATE CATEGORY =====
    const updated = await Category.findByIdAndUpdate(req.params.id, updateData, { new: true });

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
    console.error("Get Categories Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ================= GET BY ID =================
export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json(category);
  } catch (err) {
    console.error("Get Category Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ================= DELETE CATEGORY =================
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });
    await category.deleteOne();
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("Delete Category Error:", err);
    res.status(500).json({ message: err.message });
  }
};