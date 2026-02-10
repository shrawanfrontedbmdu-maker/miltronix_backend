import Product from "../models/product.model.js";
import Category from "../models/category.model.js";
import { uploadImage, deleteImage } from "../utils/cloudinary.js";

/* ================= HELPER ================= */
const parseJSON = (value, fallback) => {
  if (!value) return fallback;
  try {
    return typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return fallback;
  }
};

const generateSlug = (text) => {
  return text.toLowerCase().replace(/\s+/g, "-");
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
      images,
      isRecommended = false,
      status = "active",
    } = req.body;

    variants = parseJSON(variants, []);
    supplier = parseJSON(supplier, []);
    shipping = parseJSON(shipping, []);
    tags = parseJSON(tags, []);
    images = parseJSON(images, []);

    if (!slug) slug = generateSlug(name);

    if (!name || !productKey || !description || !category || !warranty || !returnPolicy || !hsnCode) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) return res.status(400).json({ message: "Invalid category" });

    /* ===== IMAGE HANDLING ===== */
    let finalImages = [];

    if (req.files && req.files.length > 0) {
      finalImages = await Promise.all(
        req.files.map(async (file) => {
          const img = await uploadImage(file.buffer);
          return { url: img.secure_url, public_id: img.public_id, alt: "" };
        })
      );
    } else if (images && images.length > 0) {
      finalImages = images;
    } else {
      return res.status(400).json({ message: "At least one product image is required" });
    }

    /* ===== VARIANT LOGIC ===== */
    if (variants.length > 0) {
      sellingPrice = undefined;
      mrp = undefined;
      sku = undefined;

      for (const v of variants) {
        if (!v.sku || !v.price || !v.stockQuantity) {
          return res.status(400).json({
            message: "Each variant must have sku, price and stockQuantity",
          });
        }
      }
    } else {
      if (!sellingPrice || !sku) {
        return res.status(400).json({
          message: "Non-variant product must have sellingPrice and SKU",
        });
      }
    }

    /* ===== HSN VALIDATION ===== */
    if (!/^\d{2}(\d{2})?(\d{2})?$/.test(hsnCode)) {
      return res.status(400).json({ message: "HSN must be 2, 4, or 6 digits" });
    }

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
      isRecommended: isRecommended === "true" || isRecommended === true,
      status: status.toLowerCase(),
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });

  } catch (error) {
    console.error("Create product error:", error);
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
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (categoryKey) filter.categoryKey = categoryKey;
    if (stockStatus) filter.stockStatus = stockStatus;

    if (isRecommended !== undefined) {
      filter.isRecommended = isRecommended === "true";
    }

    if (minPrice || maxPrice) {
      filter.$or = [
        {
          sellingPrice: {
            ...(minPrice && { $gte: Number(minPrice) }),
            ...(maxPrice && { $lte: Number(maxPrice) }),
          },
        },
        {
          "variants.price": {
            ...(minPrice && { $gte: Number(minPrice) }),
            ...(maxPrice && { $lte: Number(maxPrice) }),
          },
        },
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

    updateData.variants = parseJSON(updateData.variants, []);
    updateData.tags = parseJSON(updateData.tags, []);
    updateData.supplier = parseJSON(updateData.supplier, []);
    updateData.shipping = parseJSON(updateData.shipping, []);
    updateData.images = parseJSON(updateData.images, []);

    if (updateData.status) updateData.status = updateData.status.toLowerCase();

    /* IMAGE UPDATE */
    if (req.files && req.files.length > 0) {
      const uploads = await Promise.all(req.files.map(file => uploadImage(file.buffer)));
      const newImages = uploads.map(img => ({
        url: img.secure_url,
        public_id: img.public_id,
        alt: "",
      }));

      updateData.images = newImages;

      const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      );

      if (updatedProduct) {
        for (const img of updatedProduct.images) {
          if (img.public_id) await deleteImage(img.public_id);
        }
      }

      return res.json({
        success: true,
        message: "Product updated successfully",
        product: updatedProduct,
      });
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
    res.status(500).json({ message: error.message });
  }
};

/* ================= DELETE PRODUCT ================= */
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    for (const img of product.images) {
      if (img.public_id) await deleteImage(img.public_id);
    }

    await product.deleteOne();

    res.json({
      success: true,
      message: "Product deleted successfully",
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
