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

/* ================= APP-LEVEL UNIQUENESS CHECK ================= */
const isDuplicateSKU = async (sku, productId = null) => {
  if (!sku) return false;
  const query = { sku };
  if (productId) query._id = { $ne: productId };
  return !!(await Product.findOne(query));
};

const isDuplicateVariantSKU = async (variantSku, productId = null) => {
  if (!variantSku) return false;
  const query = { "variants.sku": variantSku };
  if (productId) query._id = { $ne: productId };
  return !!(await Product.findOne(query));
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

    // Required fields
    if (!name || !productKey || !description || !category || !warranty || !returnPolicy || !hsnCode)
      return res.status(400).json({ success: false, message: "Missing required fields" });

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
    } else if (images.length > 0) {
      finalImages = images;
    }

    /* ===== VARIANT LOGIC ===== */
    if (variants.length > 0) {
      sku = undefined; // root SKU not needed
      sellingPrice = undefined;
      mrp = undefined;

      // Validate variants
      const skusSet = new Set();
      for (const v of variants) {
        if (!v.sku || v.price === undefined || v.stockQuantity === undefined)
          return res.status(400).json({ success: false, message: "Each variant must have sku, price, stockQuantity" });

        if (v.price < 0 || v.stockQuantity < 0)
          return res.status(400).json({ success: false, message: "Variant price or stockQuantity cannot be negative" });

        if (skusSet.has(v.sku))
          return res.status(400).json({ success: false, message: `Duplicate SKU within variants: ${v.sku}` });

        if (await isDuplicateVariantSKU(v.sku))
          return res.status(400).json({ success: false, message: `Duplicate variant SKU across products: ${v.sku}` });

        skusSet.add(v.sku);
      }
    } else {
      // Non-variant product must have SKU & sellingPrice
      if (!sku || sellingPrice === undefined)
        return res.status(400).json({ success: false, message: "Non-variant product must have SKU and sellingPrice" });

      if (await isDuplicateSKU(sku))
        return res.status(400).json({ success: false, message: `Duplicate SKU: ${sku}` });
    }

    // HSN validation
    if (!/^[0-9]{2,6}$/.test(hsnCode))
      return res.status(400).json({ success: false, message: "Invalid HSN code" });

    /* ===== CREATE PRODUCT ===== */
    const product = await Product.create({
      name, slug, productKey, description,
      category, categoryKey: categoryDoc.categoryKey || generateSlug(categoryDoc.name),
      images: finalImages, mrp, sellingPrice, sku, brand, variants,
      stockStatus: stockStatus || "in-stock", stockQuantity: stockQuantity || 0,
      specification, weight, dimensions, warranty, returnPolicy, hsnCode,
      barcode, supplier, shipping, tags,
      isRecommended: !!isRecommended,
      status: status.toLowerCase()
    });

    res.status(201).json({ success: true, message: "Product created successfully", product });

  } catch (error) {
    console.error("Create product error:", error);
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
      updateData.sku = undefined;

      const skusSet = new Set();
      for (const v of updateData.variants) {
        if (!v.sku || v.price === undefined || v.stockQuantity === undefined)
          return res.status(400).json({ success: false, message: "Each variant must have sku, price, stockQuantity" });

        if (v.price < 0 || v.stockQuantity < 0)
          return res.status(400).json({ success: false, message: "Variant price or stockQuantity cannot be negative" });

        if (skusSet.has(v.sku))
          return res.status(400).json({ success: false, message: `Duplicate SKU within variants: ${v.sku}` });

        if (await isDuplicateVariantSKU(v.sku, req.params.id))
          return res.status(400).json({ success: false, message: `Duplicate variant SKU across products: ${v.sku}` });

        skusSet.add(v.sku);
      }
    } else {
      if (!updateData.sku && !existingProduct.variants.length)
        return res.status(400).json({ success: false, message: "Non-variant product must have SKU" });

      if (updateData.sku && await isDuplicateSKU(updateData.sku, req.params.id))
        return res.status(400).json({ success: false, message: `Duplicate SKU: ${updateData.sku}` });
    }

    /* ===== IMAGE UPDATE ===== */
    if (Array.isArray(req.files) && req.files.length > 0) {
      const uploads = await Promise.all(req.files.map(f => uploadImage(f.buffer)));
      const newImages = uploads.map(img => ({ url: img.secure_url, public_id: img.public_id, alt: "" }));

      // Delete old images
      for (const img of existingProduct.images) {
        if (img.public_id) await deleteImage(img.public_id);
      }

      updateData.images = newImages;
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    res.json({ success: true, message: "Product updated successfully", product: updated });

  } catch (error) {
    console.error("Update product error:", error);
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
