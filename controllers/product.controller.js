import Product from "../models/product.model.js";
import Category from "../models/category.model.js";
import { uploadImage } from "../utils/cloudinary.js";

/* ===================================================
   HELPERS
=================================================== */
const parseJSON = (value, fallback) => {
  try {
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return fallback;
  }
};

/* ===================================================
   CREATE PRODUCT
=================================================== */
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      slug,
      productKey,
      description,

      category, // ObjectId
      resolution,
      screenSize,

      mrp,
      sellingPrice,
      discountPercent,

      sku,
      brand,
      colour,
      variants,

      stockStatus,
      stockQuantity,

      specification,
      warranty,
      returnPolicy,
      hsnCode,
      barcode,

      supplier,
      shipping,

      tags,
      isRecommended,
      isActive,
      status,
    } = req.body;

    /* ---------- REQUIRED VALIDATION ---------- */
    if (
      !name ||
      !productKey ||
      !description ||
      !category ||
      !sellingPrice ||
      !warranty ||
      !returnPolicy ||
      !hsnCode
    ) {
      return res.status(400).json({
        message:
          "name, productKey, description, category, sellingPrice, warranty, returnPolicy, hsnCode are required",
      });
    }

    /* ---------- CATEGORY CHECK ---------- */
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      return res.status(400).json({ message: "Invalid category" });
    }

    /* ---------- IMAGE UPLOAD ---------- */
    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one image is required" });
    }

    const uploads = await Promise.all(
      req.files.map((file) => uploadImage(file.buffer))
    );

    const images = uploads.map((img) => ({
      url: img.secure_url,
      public_id: img.public_id,
    }));

    /* ---------- CREATE PRODUCT ---------- */
    const product = await Product.create({
      name,
      slug,
      productKey,
      description,

      category,
      categoryKey: categoryDoc.categoryKey,

      images,

      mrp,
      sellingPrice,
      discountPercent,

      sku,
      brand,
      colour,
      variants: parseJSON(variants, []),

      resolution,
      screenSize,

      stockStatus,
      stockQuantity: stockQuantity || 0,

      specification,
      warranty,
      returnPolicy,
      hsnCode,
      barcode,

      supplier: parseJSON(supplier, []),
      shipping: parseJSON(shipping, []),

      tags: parseJSON(tags, []),
      isRecommended,
      isActive,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error creating product",
      error: error.message,
    });
  }
};

/* ===================================================
   GET PRODUCTS (IMAGE BASED FILTERS)
=================================================== */
export const getProducts = async (req, res) => {
  try {
    const {
      search,
      categoryKey,
      minPrice,
      maxPrice,
      resolution,
      screenSize,
      stockStatus,
      isRecommended,
    } = req.query;

    const filter = { isActive: true };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (categoryKey) filter.categoryKey = categoryKey;
    if (resolution) filter.resolution = resolution;
    if (screenSize) filter.screenSize = Number(screenSize);
    if (stockStatus) filter.stockStatus = stockStatus;
    if (isRecommended) filter.isRecommended = true;

    if (minPrice || maxPrice) {
      filter.sellingPrice = {};
      if (minPrice) filter.sellingPrice.$gte = Number(minPrice);
      if (maxPrice) filter.sellingPrice.$lte = Number(maxPrice);
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

/* ===================================================
   GET PRODUCT BY ID
=================================================== */
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ message: "Product not found" });

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

/* ===================================================
   UPDATE PRODUCT
=================================================== */
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ message: "Product not found" });

    const updateData = { ...req.body };

    /* ---------- IMAGE UPDATE ---------- */
    if (req.files && req.files.length > 0) {
      // delete old images
      product.images.forEach((img) => deleteImage(img.public_id));

      const uploads = await Promise.all(
        req.files.map((file) => uploadImage(file.buffer))
      );

      updateData.images = uploads.map((img) => ({
        url: img.secure_url,
        public_id: img.public_id,
      }));
    }

    /* ---------- SAFE PARSE ---------- */
    if (updateData.variants)
      updateData.variants = parseJSON(updateData.variants, []);
    if (updateData.tags)
      updateData.tags = parseJSON(updateData.tags, []);
    if (updateData.supplier)
      updateData.supplier = parseJSON(updateData.supplier, []);
    if (updateData.shipping)
      updateData.shipping = parseJSON(updateData.shipping, []);

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json({
      message: "Product updated successfully",
      product: updated,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating product", error });
  }
};

/* ===================================================
   DELETE PRODUCT
=================================================== */
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product)
      return res.status(404).json({ message: "Product not found" });

    product.images.forEach((img) => deleteImage(img.public_id));
    await product.deleteOne();

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};
