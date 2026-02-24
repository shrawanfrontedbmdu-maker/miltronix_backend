import Product from "../models/product.model.js";
import Category from "../models/category.model.js";
import Subcategory from "../models/subcategory.model.js";
import FilterOption from "../models/filterOption.model.js";
import { uploadImage, deleteImage } from "../utils/cloudinary.js";
import mongoose from "mongoose";

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
      subcategory,
      filterOptions,
      images,
      specifications,
      keyFeatures,
      brand,
      variants,
      warranty,
      returnPolicy,
      tags,
      keywords,
      isRecommended,
      isFeatured,
      isDigital,
      // ✅ TOP DEAL FIELDS
      isTopDeal,
      topDealTitle,
      topDealDescription,
      status,
      metaTitle,
      metaDescription,
    } = req.body;

    specifications  = parseJSON(specifications);
    keyFeatures     = parseJSON(keyFeatures);
    variants        = parseJSON(variants);
    tags            = parseJSON(tags);
    keywords        = parseJSON(keywords);
    filterOptions   = parseJSON(filterOptions);
    images          = parseJSON(images);

    /* ================= REQUIRED CHECK ================= */
    if (!name || !productKey || !description || !category || !warranty || !returnPolicy) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    if (!slug && name) slug = generateSlug(name);

    /* ================= CATEGORY CHECK ================= */
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      return res.status(400).json({ success: false, message: "Invalid category" });
    }

    /* ================= SUBCATEGORY CHECK ================= */
    if (subcategory) {
      const sub = await Subcategory.findById(subcategory);
      if (!sub) {
        return res.status(400).json({ success: false, message: "Invalid subcategory" });
      }
      if (sub.category.toString() !== category) {
        return res.status(400).json({
          success: false,
          message: "Subcategory does not belong to selected category",
        });
      }
    }

    /* ================= FILTER CHECK ================= */
    if (filterOptions?.length > 0) {
      const validFilters = await FilterOption.find({ _id: { $in: filterOptions } });
      if (validFilters.length !== filterOptions.length) {
        return res.status(400).json({ success: false, message: "Invalid filter options" });
      }
    }

    /* ================= IMAGE UPLOAD ================= */
    let finalImages = [];
    const variantFileMap = {};

    if (req.files && req.files.length > 0) {
      const mainFiles = [];
      req.files.forEach((file) => {
        const match = file.fieldname.match(/^variantImage_(\d+)$/);
        if (match) {
          const idx = parseInt(match[1], 10);
          variantFileMap[idx] = variantFileMap[idx] || [];
          variantFileMap[idx].push(file);
        } else {
          mainFiles.push(file);
        }
      });

      finalImages = await Promise.all(
        mainFiles.map(async (file) => {
          const uploaded = await uploadImage(file.buffer);
          return { url: uploaded.secure_url, public_id: uploaded.public_id, alt: name };
        })
      );

      if (variants && Array.isArray(variants)) {
        for (const [idxStr, files] of Object.entries(variantFileMap)) {
          const idx = parseInt(idxStr, 10);
          const uploadedImgs = await Promise.all(
            files.map(async (file) => {
              const u = await uploadImage(file.buffer);
              return { url: u.secure_url, public_id: u.public_id, alt: name };
            })
          );
          variants[idx] = variants[idx] || {};
          variants[idx].images = (variants[idx].images || []).concat(uploadedImgs);
        }
      }
    } else if (images?.length > 0) {
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

    variants = variants.map((v) => ({ ...v, images: v.images || [] }));

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
      name: name.trim(),
      slug,
      productKey: productKey.trim(),
      description: description.trim(),
      category,
      subcategory: subcategory || null,
      filterOptions: filterOptions || [],
      images: finalImages,
      specifications,
      keyFeatures,
      brand: brand?.trim(),
      variants,
      warranty: warranty.trim(),
      returnPolicy: returnPolicy.trim(),
      tags,
      keywords,
      isRecommended,
      isFeatured,
      isDigital,
      // ✅ TOP DEAL FIELDS
      isTopDeal: isTopDeal === true || isTopDeal === "true" || false,
      topDealTitle: isTopDeal ? topDealTitle?.trim() || "" : "",
      topDealDescription: isTopDeal ? topDealDescription?.trim() || "" : "",
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
    console.error("Create Product Error:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: `Duplicate value: ${JSON.stringify(error.keyValue)}`,
      });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};


/* ================= GET ALL PRODUCTS ================= */
export const getProducts = async (req, res) => {
  try {
    const {
      categoryKey,
      category,
      search,
      isRecommended,
      isFeatured,
      isTopDeal,   // ✅ ADDED
      status,
      minPrice,
      maxPrice,
      sort,
      page,
      limit,
    } = req.query;

    let filter = {};

    // filter by categoryId
    if (category) filter.category = category;

    // filter by categoryKey (slug)
    if (categoryKey) {
      const cat = await Category.findOne({ slug: categoryKey });
      if (!cat) return res.json({ success: true, products: [] });
      filter.category = cat._id;
    }

    if (search) filter.name = { $regex: search, $options: "i" };

    if (isRecommended !== undefined)
      filter.isRecommended = isRecommended === "true";

    if (isFeatured !== undefined)
      filter.isFeatured = isFeatured === "true";

    // ✅ isTopDeal filter
    if (isTopDeal !== undefined)
      filter.isTopDeal = isTopDeal === "true";

    if (status) filter.status = status;

    // Sort
    let sortOption = { createdAt: -1 };
    if (sort === "price_low")  sortOption = { "variants.0.price": 1 };
    if (sort === "price_high") sortOption = { "variants.0.price": -1 };
    if (sort === "latest")     sortOption = { createdAt: -1 };

    const products = await Product.find(filter)
      .populate("category", "name slug categoryKey")
      .sort(sortOption);

    res.json({ success: true, count: products.length, products });
  } catch (error) {
    console.error("getProducts error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


/* ================= GET PRODUCT BY ID ================= */
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category", "name categoryKey");

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
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

    /* ================= FIND PRODUCT ================= */
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    /* ================= SAFE FIELD UPDATES ================= */
    if (updateData.specifications)
      updateData.specifications = parseJSON(updateData.specifications);
    if (updateData.keyFeatures)
      updateData.keyFeatures = parseJSON(updateData.keyFeatures);
    if (updateData.tags)
      updateData.tags = parseJSON(updateData.tags);
    if (updateData.keywords)
      updateData.keywords = parseJSON(updateData.keywords);

    // ✅ TOP DEAL FIELDS — normalize boolean from string
    if (updateData.isTopDeal !== undefined) {
      updateData.isTopDeal =
        updateData.isTopDeal === true || updateData.isTopDeal === "true";
    }
    // Clear title/description if isTopDeal is being turned off
    if (updateData.isTopDeal === false) {
      updateData.topDealTitle       = "";
      updateData.topDealDescription = "";
    }

    /* ================= SAFE VARIANT UPDATE ================= */
    let variantFileMap = {};
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        const match = file.fieldname.match(/^variantImage_(\d+)$/);
        if (match) {
          const idx = parseInt(match[1], 10);
          variantFileMap[idx] = variantFileMap[idx] || [];
          variantFileMap[idx].push(file);
        }
      });
    }

    if (updateData.variants) {
      const newVariants = parseJSON(updateData.variants);

      updateData.variants = newVariants.map((newVariant) => {
        const existingVariant = product.variants.find(
          (v) => v.sku === newVariant.sku
        );
        return {
          ...newVariant,
          stockQuantity: existingVariant?.stockQuantity ?? 0,
          stockStatus:   existingVariant?.stockStatus   ?? "out-of-stock",
          hasStock:      existingVariant?.hasStock       ?? false,
          images:        newVariant.images || [],
        };
      });

      for (const [idxStr, files] of Object.entries(variantFileMap)) {
        const idx = parseInt(idxStr, 10);
        const uploadedImgs = await Promise.all(
          files.map(async (file) => {
            const u = await uploadImage(file.buffer);
            return { url: u.secure_url, public_id: u.public_id, alt: "" };
          })
        );
        if (updateData.variants[idx]) {
          updateData.variants[idx].images = (
            updateData.variants[idx].images || []
          ).concat(uploadedImgs);
        }
      }
    } else {
      delete updateData.variants;
    }

    /* ================= IMAGE UPDATE ================= */
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

    /* ================= UPDATE ================= */
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
    return res.status(500).json({ success: false, message: error.message });
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
    res.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


/* ================= GET FEATURED PRODUCTS ================= */
export const getFeaturedProducts = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category
      ? { isFeatured: true, category, status: "active" }
      : { isFeatured: true, status: "active" };

    const products = await Product.find(filter)
      .populate("category")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: products.length, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


/* ================= GET RECOMMENDED PRODUCTS ================= */
export const getRecommendedProducts = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category
      ? { isRecommended: true, category, status: "active" }
      : { isRecommended: true, status: "active" };

    const products = await Product.find(filter)
      .populate("category")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: products.length, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


/* ================= GET TOP DEAL PRODUCTS ================= */
// ✅ Dedicated endpoint — GET /products/top-deals
export const getTopDealProducts = async (req, res) => {
  try {
    const products = await Product.find({ isTopDeal: true, status: "active" })
      .populate("category", "name slug")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: products.length, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


/* ================= SEARCH PRODUCTS ================= */
export const searchProducts = async (req, res) => {
  try {
    const { q, category } = req.query;

    let filter = { status: "active", isArchived: false };

    if (q) filter.$text = { $search: q };
    if (category) filter.category = category;

    const products = await Product.find(
      filter,
      q ? { score: { $meta: "textScore" } } : {}
    )
      .sort(q ? { score: { $meta: "textScore" } } : { createdAt: -1 })
      .lean();

    res.json({ success: true, count: products.length, products });
  } catch (error) {
    console.error("Full search error:", error);
    res.status(500).json({ success: false, message: "Search failed" });
  }
};


/* ================= SEARCH SUGGESTIONS ================= */
export const searchSuggestions = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({ success: true, products: [] });
    }

    const products = await Product.find(
      { status: "active", isArchived: false, $text: { $search: q } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(6)
      .lean();

    res.json({ success: true, products });
  } catch (error) {
    console.error("Search suggestion error:", error);
    res.status(500).json({ success: false, message: "Search failed" });
  }
};