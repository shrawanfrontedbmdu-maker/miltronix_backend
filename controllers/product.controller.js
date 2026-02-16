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
      brand,
      variants,
      warranty,
      returnPolicy,
      tags,
      isRecommended,
      isFeatured,
      isDigital,
      status,
      metaTitle,
      metaDescription,
      keywords,
      modelNumber,
      sku,
    } = req.body;

    /* ================= PARSE JSON FIELDS ================= */
    specifications = parseJSON(specifications, []);
    keyFeatures = parseJSON(keyFeatures, []);
    variants = parseJSON(variants, []);
    tags = parseJSON(tags, []);
    keywords = parseJSON(keywords, []);
    images = parseJSON(images, []);

    /* ================= TRIM FIELDS ================= */
    name = name?.trim();
    productKey = productKey?.trim();
    description = description?.trim();
    warranty = warranty?.trim();
    returnPolicy = returnPolicy?.trim();
    brand = brand?.trim();

    if (!slug && name) slug = generateSlug(name);

    /* ================= REQUIRED FIELDS ================= */
    if (!name || !productKey || !description || !category || !warranty || !returnPolicy) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    /* ================= CATEGORY CHECK ================= */
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      return res.status(400).json({
        success: false,
        message: "Invalid category",
      });
    }

    /* ================= IMAGE HANDLING ================= */
    let finalImages = [];

    if (req.files && req.files.length > 0) {
      finalImages = await Promise.all(
        req.files.map(async (file) => {
          const img = await uploadImage(file.buffer);
          return {
            url: img.secure_url,
            public_id: img.public_id,
            alt: name,
          };
        })
      );
    } else if (images.length > 0) {
      finalImages = images;
    } else {
      return res.status(400).json({
        success: false,
        message: "At least one product image is required",
      });
    }

    /* ================= VARIANT VALIDATION ================= */
    if (!Array.isArray(variants) || variants.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one variant is required",
      });
    }

    for (const v of variants) {
      if (!v.sku || v.price == null) {
        return res.status(400).json({
          success: false,
          message: "Each variant must have sku and price",
        });
      }

      v.stockQuantity = 0;
      v.hasStock = false;

      if (!v.currency) v.currency = "INR";
    }

    /* ================= CREATE PRODUCT ================= */
    const product = await Product.create({
      name,
      slug,
      productKey,
      description,
      category,
      images: finalImages,
      specifications,
      keyFeatures,
      brand,
      modelNumber,
      sku,
      variants,
      warranty,
      returnPolicy,
      tags,
      keywords,
      isRecommended,
      isFeatured,
      isDigital,
      status,
      metaTitle,
      metaDescription,
      createdBy: req.admin?._id,
    });

    return res.status(201).json({
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

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= GET ALL PRODUCTS ================= */
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("category", "name categoryKey")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: products.length,
      products,
    });
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

    const parseJSON = (value) => {
      try {
        return typeof value === "string" ? JSON.parse(value) : value;
      } catch {
        return undefined;
      }
    };

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (updateData.specifications)
      updateData.specifications = parseJSON(updateData.specifications);

    if (updateData.keyFeatures)
      updateData.keyFeatures = parseJSON(updateData.keyFeatures);

    if (updateData.tags)
      updateData.tags = parseJSON(updateData.tags);

    if (updateData.keywords)
      updateData.keywords = parseJSON(updateData.keywords);

    if (updateData.variants) {
      const newVariants = parseJSON(updateData.variants);

      updateData.variants = newVariants.map((newVariant) => {
        const existingVariant = product.variants.find(
          (v) => v.sku === newVariant.sku
        );

        return {
          ...newVariant,
          stockQuantity: existingVariant?.stockQuantity ?? 0,
          stockStatus: existingVariant?.stockStatus ?? "out-of-stock",
          hasStock: existingVariant?.hasStock ?? false,
        };
      });
    } else {
      delete updateData.variants;
    }

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

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return res.json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct,
    });

  } catch (error) {
    console.error("Update product error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: `Duplicate value error: ${JSON.stringify(error.keyValue)}`,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
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