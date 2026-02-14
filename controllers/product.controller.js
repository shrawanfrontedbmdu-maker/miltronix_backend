import Product from "../models/product.model.js";
import Category from "../models/category.model.js";
import { uploadImage, deleteImage } from "../utils/cloudinary.js";

/* ================= HELPERS ================= */
const parseJSON = (value, fallback) => {
  if (!value) return fallback;
  try {
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return fallback;
  }
};

const generateSlug = (text) =>
  text.toLowerCase().trim().replace(/\s+/g, "-");

/* ================= CREATE PRODUCT ================= */
export const createProduct = async (req, res) => {
  try {
    let {
      name,
      slug,
      productKey,
      description,
      category,
      images,
      specifications,
      keyFeatures,
      mrp,
      sellingPrice,
      costPrice,
      sku,
      brand,
      modelNumber,
      variants,
      stockQuantity,
      warranty,
      returnPolicy,
      dimensions,
      tags,
      isRecommended,
      isFeatured,
      isDigital,
      status,
      metaTitle,
      metaDescription,
      keywords,
    } = req.body;

    // Parse JSON fields
    specifications = parseJSON(specifications, []);
    keyFeatures = parseJSON(keyFeatures, []);
    variants = parseJSON(variants, []);
    dimensions = parseJSON(dimensions, {});
    tags = parseJSON(tags, []);
    keywords = parseJSON(keywords, []);
    images = parseJSON(images, []);

    // Trim
    name = name?.trim();
    productKey = productKey?.trim();
    description = description?.trim();
    warranty = warranty?.trim();
    returnPolicy = returnPolicy?.trim();

    if (!slug && name) slug = generateSlug(name);

    // Required fields
    if (!name || !productKey || !description || !category || !warranty || !returnPolicy) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Category check
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      return res.status(400).json({ success: false, message: "Invalid category" });
    }

    /* ===== IMAGE HANDLING ===== */
    let finalImages = [];

    if (req.files && req.files.length > 0) {
      finalImages = await Promise.all(
        req.files.map(async (file) => {
          const img = await uploadImage(file.buffer);
          return { url: img.secure_url, public_id: img.public_id, alt: "" };
        })
      );
    } else if (images.length > 0) {
      finalImages = images;
    } else {
      return res.status(400).json({ success: false, message: "At least one image required" });
    }

    /* ===== VARIANT RULE ===== */
    if (variants.length > 0) {
      sku = undefined;
      sellingPrice = undefined;
      mrp = undefined;

      for (const v of variants) {
        if (!v.sku || v.price == null || v.stockQuantity == null) {
          return res.status(400).json({
            success: false,
            message: "Each variant must have sku, price, stockQuantity",
          });
        }
      }
    } else {
      if (!sku || sellingPrice == null) {
        return res.status(400).json({
          success: false,
          message: "Non-variant product must have sku and sellingPrice",
        });
      }
    }

    /* ===== CREATE PRODUCT ===== */
    const product = await Product.create({
      name,
      slug,
      productKey,
      description,
      category,
      images: finalImages,
      specifications,
      keyFeatures,
      mrp,
      sellingPrice,
      costPrice,
      brand,
      modelNumber,
      sku,
      variants,
      stockQuantity,
      warranty,
      returnPolicy,
      dimensions,
      tags,
      keywords,
      isRecommended,
      isFeatured,
      isDigital,
      status,
      metaTitle,
      metaDescription,
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });

  } catch (error) {
    console.error("Create product error:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: `Duplicate value: ${JSON.stringify(error.keyValue)}`,
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= GET ALL PRODUCTS ================= */
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("category", "name categoryKey")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: products.length, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= GET PRODUCT BY ID ================= */
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category", "name categoryKey");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= UPDATE PRODUCT ================= */
export const updateProduct = async (req, res) => {
  try {
    let updateData = { ...req.body };

    updateData.specifications = parseJSON(updateData.specifications, []);
    updateData.keyFeatures = parseJSON(updateData.keyFeatures, []);
    updateData.variants = parseJSON(updateData.variants, []);
    updateData.dimensions = parseJSON(updateData.dimensions, {});
    updateData.tags = parseJSON(updateData.tags, []);
    updateData.keywords = parseJSON(updateData.keywords, []);

    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ success: false, message: "Product not found" });

    /* ===== VARIANT RULE ===== */
    if (updateData.variants.length > 0) {
      updateData.sku = undefined;
      updateData.sellingPrice = undefined;
      updateData.mrp = undefined;
    }

    /* ===== IMAGE UPDATE ===== */
    if (req.files && req.files.length > 0) {
      for (const img of product.images) {
        if (img.public_id) await deleteImage(img.public_id);
      }

      const uploads = await Promise.all(
        req.files.map((file) => uploadImage(file.buffer))
      );

      updateData.images = uploads.map((img) => ({
        url: img.secure_url,
        public_id: img.public_id,
        alt: "",
      }));
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Product updated successfully",
      product: updated,
    });

  } catch (error) {
    console.error("Update product error:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: `Duplicate value: ${JSON.stringify(error.keyValue)}`,
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= DELETE PRODUCT ================= */
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    for (const img of product.images) {
      if (img.public_id) await deleteImage(img.public_id);
    }

    await product.deleteOne();

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
