import Product from "../models/product.model.js";
import Category from "../models/category.model.js";
import { uploadImage, deleteImage } from "../utils/cloudinary.js";

/* Helper to parse JSON fields safely */
const parseJSON = (value, fallback) => {
  try {
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return fallback;
  }
};

/* ================= CREATE PRODUCT ================= */
export const createProduct = async (req, res) => {
  try {
    let {
      name,
      slug,
      productKey,
      description,
      category,
      mrp,
      sellingPrice,
      sku,
      brand,
      variants,
      stockStatus,
      stockQuantity,
      specification,
      weight,
      dimensions,
      warranty,
      returnPolicy,
      hsnCode,
      barcode,
      supplier,
      shipping,
      tags,
      isRecommended = false,
      status = "active",
    } = req.body;

    // Parse JSON fields
    variants = parseJSON(variants, []);
    supplier = parseJSON(supplier, []);
    shipping = parseJSON(shipping, []);
    tags = parseJSON(tags, []);

    // Validate required fields
    if (!name || !productKey || !description || !category || !warranty || !returnPolicy || !hsnCode) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check category exists
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) return res.status(400).json({ message: "Invalid category" });

    // Handle images
    let finalImages = [];
    if (req.files?.length > 0) {
      const uploads = await Promise.all(req.files.map(file => uploadImage(file.buffer)));
      finalImages = uploads.map(img => ({
        url: img.secure_url,
        public_id: img.public_id,
      }));
    }
    if (finalImages.length === 0) return res.status(400).json({ message: "At least one product image is required" });

    // Price logic
    if (variants.length > 0) {
      sellingPrice = undefined;
      mrp = undefined;
    } else {
      if (!sellingPrice) return res.status(400).json({ message: "sellingPrice required for non-variant product" });
    }

    // Create product
    const product = await Product.create({
      name,
      slug,
      productKey,
      description,
      category,
      categoryKey: categoryDoc.categoryKey,
      images: finalImages,
      mrp,
      sellingPrice,
      sku,
      brand,
      variants,
      stockStatus: stockStatus || "in-stock",
      stockQuantity: stockQuantity || 0,
      specification,
      weight,
      dimensions,
      warranty,
      returnPolicy,
      hsnCode,
      barcode,
      supplier,
      shipping,
      tags,
      isRecommended,
      status,
    });

    res.status(201).json({ success: true, message: "Product created successfully", product });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= GET PRODUCTS ================= */
export const getProducts = async (req, res) => {
  try {
    const { search, categoryKey, minPrice, maxPrice, stockStatus, isRecommended } = req.query;

    const filter = { status: "active" };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    if (categoryKey) filter.categoryKey = categoryKey;
    if (stockStatus) filter.stockStatus = stockStatus;
    if (isRecommended) filter.isRecommended = true;

    if (minPrice || maxPrice) {
      filter.$or = [
        { sellingPrice: { ...(minPrice && { $gte: Number(minPrice) }), ...(maxPrice && { $lte: Number(maxPrice) }) } },
        { "variants.price": { ...(minPrice && { $gte: Number(minPrice) }), ...(maxPrice && { $lte: Number(maxPrice) }) } }
      ];
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= GET PRODUCT BY ID ================= */
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= UPDATE PRODUCT ================= */
export const updateProduct = async (req, res) => {
  try {
    let updateData = { ...req.body };

    // Parse JSON fields
    if (updateData.variants) updateData.variants = parseJSON(updateData.variants, []);
    if (updateData.tags) updateData.tags = parseJSON(updateData.tags, []);
    if (updateData.supplier) updateData.supplier = parseJSON(updateData.supplier, []);
    if (updateData.shipping) updateData.shipping = parseJSON(updateData.shipping, []);

    if (updateData.status) updateData.status = updateData.status.toLowerCase();

    // Handle new images
    if (req.files?.length > 0) {
      const uploads = await Promise.all(req.files.map(file => uploadImage(file.buffer)));
      updateData.images = uploads.map(img => ({
        url: img.secure_url,
        public_id: img.public_id,
      }));

      // Optionally delete old images
      const existing = await Product.findById(req.params.id);
      if (existing) {
        for (const img of existing.images) {
          await deleteImage(img.public_id);
        }
      }
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    res.json({ success: true, message: "Product updated", product: updated });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= DELETE PRODUCT ================= */
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Delete images from Cloudinary
    for (const img of product.images) {
      await deleteImage(img.public_id);
    }

    await product.deleteOne();
    res.json({ success: true, message: "Product deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
