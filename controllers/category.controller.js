import Category from "../models/category.model.js";
import { uploadToCloud } from "../config/cloudinary.js";

// ================= CREATE CATEGORY =================
export const createCategory = async (req, res) => {
  console.log("FILES:", req.files);
  console.log("BODY:", req.body);

  try {
    const {
      categoryKey,
      pageTitle,
      pageSubtitle = "",
      description = "",
      status = "active",
    } = req.body;

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

    const mainImage = filesArray.find((f) => f.fieldname === "image");
    if (mainImage) {
      console.log("IMAGE RECEIVED:", mainImage.originalname);
      const result = await uploadToCloud(mainImage.buffer, "categories");
      imageUrl = result.secure_url;
    }

    // ===== FEATURES =====
    const features = {
      title: req.body.featuresTitle || "",
      description: req.body.featuresDescription || "",
      images: [],
    };

    const featureImageFiles = filesArray.filter((f) => f.fieldname === "featureImages");
    if (featureImageFiles.length > 0) {
      features.images = await Promise.all(
        featureImageFiles.map((file) =>
          uploadToCloud(file.buffer, "categories/features").then((r) => r.secure_url)
        )
      );
    }

    const category = await Category.create({
      categoryKey: categoryKey.toLowerCase(),
      pageTitle,
      pageSubtitle,
      description,
      image: imageUrl,
      features,
      status,
    });

    res.status(201).json(category);
  } catch (err) {
    console.error("Create Category Error:", err);
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

// ================= UPDATE CATEGORY =================
export const updateCategory = async (req, res) => {
   console.log("REQ FILES TYPE:", typeof req.files);
  console.log("REQ FILES IS ARRAY:", Array.isArray(req.files));
  console.log("REQ FILES:", req.files);
  console.log("REQ BODY:", req.body);
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    const updateData = {
      categoryKey: req.body.categoryKey || category.categoryKey,
      pageTitle: req.body.pageTitle || category.pageTitle,
      pageSubtitle: req.body.pageSubtitle ?? category.pageSubtitle,
      description: req.body.description ?? category.description,
      status: req.body.status || category.status,
    };

    if (!["active", "inactive"].includes(updateData.status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    // ===== MAIN IMAGE =====
    const filesArray = Array.isArray(req.files) ? req.files : [];

    const mainImage = filesArray.find((f) => f.fieldname === "image");
    if (mainImage) {
      console.log("IMAGE RECEIVED FOR UPDATE:", mainImage.originalname);
      const result = await uploadToCloud(mainImage.buffer, "categories");
      updateData.image = result.secure_url;
    }

    // ===== FEATURES =====
    const existingFeatures = category.features || {};

    const existingImages = req.body.existingFeatureImages
      ? Array.isArray(req.body.existingFeatureImages)
        ? req.body.existingFeatureImages
        : [req.body.existingFeatureImages]
      : existingFeatures.images || [];

    const featureImageFiles = filesArray.filter((f) => f.fieldname === "featureImages");

    const uploadedImages = await Promise.all(
      featureImageFiles.map((file) =>
        uploadToCloud(file.buffer, "categories/features").then((r) => r.secure_url)
      )
    );

    updateData.features = {
      title: req.body.featuresTitle ?? existingFeatures.title ?? "",
      description: req.body.featuresDescription ?? existingFeatures.description ?? "",
      images: [...existingImages, ...uploadedImages],
    };

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