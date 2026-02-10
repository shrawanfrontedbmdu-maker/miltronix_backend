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

const generateSlug = (text) => text.toLowerCase().trim().replace(/\s+/g, "-");



/* ================= GET PRODUCT BY ID ================= */
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find product by ID and populate category details
    const product = await Product.findById(id).populate("category", "name categoryKey");

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, product });

  } catch (error) {
    console.error("Get product by ID error:", error);

    // Handle invalid ObjectId
    if (error.kind === "ObjectId") {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= GET ALL PRODUCTS ================= */
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("category", "name categoryKey")
      .sort({ createdAt: -1 }); // latest first

    res.json({ success: true, count: products.length, products });
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


/* ================= CREATE PRODUCT ================= */
export const createProduct = async (req, res) => {
  try {
    let {
      name, slug, productKey, description, category,
      mrp, sellingPrice, sku, brand, variants,
      stockStatus, stockQuantity, specification, weight, dimensions,
      warranty, returnPolicy, hsnCode, barcode,
      supplier, shipping, tags, images,
      isRecommended = false, status = "active"
    } = req.body;

    variants = parseJSON(variants, []);
    supplier = parseJSON(supplier, []);
    shipping = parseJSON(shipping, []);
    tags = parseJSON(tags, []);
    images = parseJSON(images, []);

    if (!slug) slug = generateSlug(name);

    // Required fields check
    if (!name || !productKey || !description || !category || !warranty || !returnPolicy || !hsnCode) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) return res.status(400).json({ success: false, message: "Invalid category" });

    /* ===== IMAGE HANDLING ===== */
    let finalImages = [];
    if (Array.isArray(req.files) && req.files.length > 0) {
      finalImages = await Promise.all(
        req.files.map(async (file) => {
          const img = await uploadImage(file.buffer);
          return { url: img.secure_url, public_id: img.public_id, alt: "" };
        })
      );
    } else if (Array.isArray(images) && images.length > 0) {
      finalImages = images;
    } else {
      return res.status(400).json({ success: false, message: "At least one image is required" });
    }

    /* ===== VARIANT LOGIC ===== */
    if (variants.length > 0) {
      // Root SKU not needed for variant products
      sku = undefined;
      sellingPrice = undefined;
      mrp = undefined;

      // Validate each variant
      for (const v of variants) {
        if (!v.sku || v.price === undefined || v.stockQuantity === undefined) {
          return res.status(400).json({
            success: false,
            message: "Each variant must have sku, price, and stockQuantity",
          });
        }
        if (v.price < 0 || v.stockQuantity < 0) {
          return res.status(400).json({
            success: false,
            message: "Variant price and stockQuantity cannot be negative",
          });
        }
        // Check global uniqueness of variant SKU
        const exists = await Product.findOne({ "variants.sku": v.sku });
        if (exists) {
          return res.status(400).json({ success: false, message: `Duplicate variant SKU: ${v.sku}` });
        }
      }

      // Check duplicate SKUs within product
      const skus = variants.map(v => v.sku);
      if (skus.length !== new Set(skus).size) {
        return res.status(400).json({ success: false, message: "Duplicate SKUs within variants" });
      }

    } else {
      // Non-variant products must have SKU and sellingPrice
      if (!sku || !sellingPrice) {
        return res.status(400).json({
          success: false,
          message: "Non-variant product must have sku and sellingPrice",
        });
      }
      // Check global uniqueness of root SKU
      const existingSKU = await Product.findOne({ sku });
      if (existingSKU) return res.status(400).json({ success: false, message: `Duplicate SKU: ${sku}` });
    }

    // HSN validation
    if (!/^[0-9]{2,6}$/.test(hsnCode)) {
      return res.status(400).json({ success: false, message: "Invalid HSN code" });
    }

    /* ===== CREATE PRODUCT ===== */
    const product = await Product.create({
      name,
      slug,
      productKey,
      description,
      category,
      categoryKey: categoryDoc.categoryKey || generateSlug(categoryDoc.name),
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
      isRecommended: isRecommended === true || isRecommended === "true",
      status: status.toLowerCase(),
    });

    res.status(201).json({ success: true, message: "Product created successfully", product });

  } catch (error) {
    console.error("Create product error:", error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: `Duplicate value: ${JSON.stringify(error.keyValue)}` });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};



/* ================= UPDATE PRODUCT ================= */
export const updateProduct = async (req, res) => {
  try {
    let updateData = { ...req.body };

    updateData.variants = parseJSON(updateData.variants, []);
    updateData.supplier = parseJSON(updateData.supplier, []);
    updateData.shipping = parseJSON(updateData.shipping, []);
    updateData.tags = parseJSON(updateData.tags, []);
    updateData.images = parseJSON(updateData.images, []);

    if (updateData.status) updateData.status = updateData.status.toLowerCase();

    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) return res.status(404).json({ success: false, message: "Product not found" });

    /* ===== VARIANT LOGIC ===== */
    if (updateData.variants.length > 0) {
      updateData.sku = undefined; // no root SKU

      // Validate each variant
      for (const v of updateData.variants) {
        if (!v.sku || v.price === undefined || v.stockQuantity === undefined) {
          return res.status(400).json({
            success: false,
            message: "Each variant must have sku, price, and stockQuantity",
          });
        }
        if (v.price < 0 || v.stockQuantity < 0) {
          return res.status(400).json({
            success: false,
            message: "Variant price and stockQuantity cannot be negative",
          });
        }
        // Check global uniqueness excluding current product
        const exists = await Product.findOne({ 
          "variants.sku": v.sku, 
          _id: { $ne: req.params.id } 
        });
        if (exists) return res.status(400).json({ success: false, message: `Duplicate variant SKU: ${v.sku}` });
      }

      // Check duplicate SKUs within product
      const skus = updateData.variants.map(v => v.sku);
      if (skus.length !== new Set(skus).size) {
        return res.status(400).json({ success: false, message: "Duplicate SKUs within variants" });
      }

    } else {
      // Non-variant product must have SKU
      if (!updateData.sku && !existingProduct.variants.length) {
        return res.status(400).json({ success: false, message: "Non-variant product must have SKU" });
      }
      if (updateData.sku) {
        const existingSKU = await Product.findOne({ sku: updateData.sku, _id: { $ne: req.params.id } });
        if (existingSKU) return res.status(400).json({ success: false, message: `Duplicate SKU: ${updateData.sku}` });
      }
    }

    /* ===== IMAGE UPDATE ===== */
    if (Array.isArray(req.files) && req.files.length > 0) {
      const uploads = await Promise.all(req.files.map(file => uploadImage(file.buffer)));
      const newImages = uploads.map(img => ({ url: img.secure_url, public_id: img.public_id, alt: "" }));

      // Delete old images from Cloudinary
      for (const img of existingProduct.images) {
        if (img.public_id) await deleteImage(img.public_id);
      }

      updateData.images = newImages;
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });

    res.json({ success: true, message: "Product updated successfully", product: updated });

  } catch (error) {
    console.error("Update product error:", error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: `Duplicate value: ${JSON.stringify(error.keyValue)}` });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= DELETE PRODUCT ================= */
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    for (const img of product.images) {
      if (img.public_id) await deleteImage(img.public_id);
    }

    await product.deleteOne();

    res.json({ success: true, message: "Product deleted successfully" });

  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
