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

    const filesArray = Array.isArray(req.files) ? req.files : [];

    // ===== MAIN IMAGE =====
    let imageUrl = "/images/placeholder.png";
    const mainImage = filesArray.find(f => f.fieldname === "image");
    if (mainImage && mainImage.buffer) {
      const result = await uploadToCloud(mainImage.buffer, "categories");
      imageUrl = result.secure_url;
    }

    // ===== FEATURE IMAGES =====
    const featureImageFiles = filesArray.filter(f => f.fieldname === "featureImages");
    console.log("CREATE - Feature files found:", featureImageFiles.length);

    let featureImages = [];
    if (featureImageFiles.length > 0) {
      featureImages = await Promise.all(
        featureImageFiles.map(file => {
          console.log("Uploading feature file:", file.originalname, "Buffer size:", file.buffer?.length);
          return uploadToCloud(file.buffer, "categories").then(r => r.secure_url);
        })
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
    res.status(500).json({ message: err.message, stack: err.stack });
  }
};

// ================= UPDATE CATEGORY =================
export const updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    const filesArray = Array.isArray(req.files) ? req.files : [];

    console.log("UPDATE - REQ.BODY:", req.body);
    console.log("UPDATE - Total files received:", filesArray.length);
    console.log("UPDATE - Files:", filesArray.map(f => ({
      fieldname: f.fieldname,
      originalname: f.originalname,
      hasBuffer: !!f.buffer,
      bufferSize: f.buffer?.length,
    })));

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

    // ===== MAIN IMAGE =====
    const mainImage = filesArray.find(f => f.fieldname === "image");
    if (mainImage && mainImage.buffer) {
      try {
        console.log("Uploading main image:", mainImage.originalname);
        const result = await uploadToCloud(mainImage.buffer, "categories");
        updateData.image = result.secure_url;
        console.log("Main image uploaded:", updateData.image);
      } catch (e) {
        console.error("Main image upload failed:", e);
        return res.status(500).json({ message: "Main image upload failed", error: e.message });
      }
    }

    // ===== EXISTING FEATURE IMAGES =====
    let existingImages = [];
    if (req.body.existingFeatureImages) {
      if (Array.isArray(req.body.existingFeatureImages)) {
        existingImages = req.body.existingFeatureImages;
      } else if (typeof req.body.existingFeatureImages === "string") {
        existingImages = [req.body.existingFeatureImages];
      }
    } else if (category.features?.images?.length) {
      existingImages = category.features.images;
    }
    console.log("Existing feature images kept:", existingImages.length);

    // ===== NEW FEATURE IMAGES =====
    const featureImageFiles = filesArray.filter(f => f.fieldname === "featureImages");
    console.log("New feature image files received:", featureImageFiles.length);

    let uploadedImages = [];
    if (featureImageFiles.length > 0) {
      try {
        uploadedImages = await Promise.all(
          featureImageFiles.map(async (file) => {
            console.log("Uploading feature image:", file.originalname, "Buffer:", file.buffer?.length);
            if (!file.buffer) throw new Error(`Buffer missing for file: ${file.originalname}`);
            const result = await uploadToCloud(file.buffer, "categories/features");
            console.log("Feature image uploaded:", result.secure_url);
            return result.secure_url;
          })
        );
      } catch (e) {
        console.error("Feature image upload failed:", e);
        return res.status(500).json({ message: "Feature image upload failed", error: e.message });
      }
    }

    // ===== FEATURES UPDATE =====
    const existingFeatures = category.features || {};
    updateData.features = {
      title: req.body.featuresTitle ?? existingFeatures.title ?? "",
      description: req.body.featuresDescription ?? existingFeatures.description ?? "",
      images: [...existingImages, ...uploadedImages],
    };

    console.log("Final feature images count:", updateData.features.images.length);

    // ===== SAVE =====
    const updated = await Category.findByIdAndUpdate(req.params.id, updateData, { new: true });
    console.log("Category updated successfully:", updated._id);

    res.json(updated);
  } catch (err) {
    console.error("Update Category Error FULL:", err);
    res.status(500).json({ message: err.message, stack: err.stack });
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