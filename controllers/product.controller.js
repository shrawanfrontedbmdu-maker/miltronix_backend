import Product from "../models/product.model.js";
import Category from "../models/category.model.js";
import Subcategory from "../models/subcategory.model.js";
import FilterOption from "../models/filterOption.model.js";
import TopDeal from "../models/TopDeal.model.js";
import { uploadImage, deleteImage } from "../utils/cloudinary.js";
import mongoose from "mongoose";

/* ================= HELPERS ================= */
const parseJSON = (value, fallback = []) => {
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
      status,
      metaTitle,
      metaDescription,
    } = req.body;

    specifications = parseJSON(specifications, []);
    keyFeatures = parseJSON(keyFeatures, []);
    variants = parseJSON(variants, []);
    tags = parseJSON(tags, []);
    keywords = parseJSON(keywords, []);
    filterOptions = parseJSON(filterOptions, []);
    images = parseJSON(images, []);

    /* ── Required check ── */
    if (!name || !productKey || !description || !category || !warranty || !returnPolicy) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    if (!slug && name) slug = generateSlug(name);

    /* ── Category check ── */
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      return res.status(400).json({ success: false, message: "Invalid category" });
    }

    /* ── Subcategory check ── */
    if (subcategory) {
      const sub = await Subcategory.findById(subcategory);
      if (!sub) {
        return res.status(400).json({ success: false, message: "Invalid subcategory" });
      }
      if (sub.category.toString() !== category) {
        return res.status(400).json({ success: false, message: "Subcategory does not belong to selected category" });
      }
    }

    /* ── Filter check ── */
    if (filterOptions?.length > 0) {
      const validFilters = await FilterOption.find({ _id: { $in: filterOptions } });
      if (validFilters.length !== filterOptions.length) {
        return res.status(400).json({ success: false, message: "Invalid filter options" });
      }
    }

    /* ── Image upload ── */
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

      // Main images upload
      finalImages = await Promise.all(
        mainFiles.map(async (file) => {
          const uploaded = await uploadImage(file.buffer);
          return { url: uploaded.secure_url, public_id: uploaded.public_id, alt: name };
        })
      );

      // Variant images upload
      if (Array.isArray(variants)) {
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
      return res.status(400).json({ success: false, message: "At least one product image is required" });
    }

    /* ── Variant validation ── */
    if (!Array.isArray(variants) || variants.length === 0) {
      return res.status(400).json({ success: false, message: "At least one variant is required" });
    }

    variants = variants.map((v) => ({ ...v, images: v.images || [] }));

    for (const v of variants) {
      if (!v.sku || v.price == null) {
        return res.status(400).json({ success: false, message: "Each variant must have sku and price" });
      }
      v.stockQuantity = 0;
      v.hasStock = false;
      if (!v.currency) v.currency = "INR";
    }

    /* ── Create ── */
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
      status,
      metaTitle,
      metaDescription,
      createdBy: req.admin?._id,
    });

    return res.status(201).json({ success: true, message: "Product created successfully", product });

  } catch (error) {
    console.error("Create Product Error:", error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: `Duplicate value: ${JSON.stringify(error.keyValue)}` });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= GET ALL PRODUCTS ================= */
export const getProducts = async (req, res) => {
  try {
    const { categoryKey, category, search, maxPrice, filterOptions } = req.query;

    let filter = { isArchived: false };

    if (category) filter.category = category;

    if (categoryKey) {
      const cat = await Category.findOne({ slug: categoryKey });
      if (!cat) return res.json({ success: true, products: [] });
      filter.category = cat._id;
    }

    if (search) filter.name = { $regex: search, $options: "i" };

    // ⭐ Price filter — variants mein se koi bhi variant maxPrice ke andar ho
    if (maxPrice) {
      filter["variants"] = {
        $elemMatch: { price: { $lte: Number(maxPrice) } },
      };
    }

    // ⭐ FilterOptions — string IDs ko mongoose.Types.ObjectId mein convert karo
    if (filterOptions) {
      const ids = filterOptions
        .split(",")
        .map((id) => id.trim())
       .filter((id) => mongoose.isValidObjectId(id))  // ✅ ye lagao         // invalid IDs skip
        .map((id) => new mongoose.Types.ObjectId(id));       // string → ObjectId

      if (ids.length > 0) {
        // Product ke filterOptions array mein se koi bhi ek match ho
        filter.filterOptions = { $in: ids };
      }
    }

    const products = await Product.find(filter)
      .populate("category", "name slug categoryKey")
      .sort({ createdAt: -1 });

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
      .populate("category", "name categoryKey")
      .populate("topDeal", "title description image isActive");

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

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Parse JSON fields
    if (updateData.specifications) updateData.specifications = parseJSON(updateData.specifications, []);
    if (updateData.keyFeatures) updateData.keyFeatures = parseJSON(updateData.keyFeatures, []);
    if (updateData.tags) updateData.tags = parseJSON(updateData.tags, []);
    if (updateData.keywords) updateData.keywords = parseJSON(updateData.keywords, []);

    /* ── imagesToDelete — frontend se aaye public_ids Cloudinary se hatao ── */
    if (updateData.imagesToDelete) {
      const toDelete = parseJSON(updateData.imagesToDelete, []);
      if (toDelete.length > 0) {
        await Promise.all(toDelete.map((pid) => deleteImage(pid)));
      }
      delete updateData.imagesToDelete;
    }

    /* ── Files — main aur variant alag karo ── */
    const mainFiles = [];
    const variantFileMap = {};

    if (req.files && req.files.length > 0) {
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
    }

    /* ── Main images update ── */
    if (mainFiles.length > 0) {
      // Purani main images Cloudinary se delete karo
      for (const img of product.images) {
        if (img.public_id) await deleteImage(img.public_id);
      }
      // Nayi upload karo
      const uploads = await Promise.all(
        mainFiles.map(async (file) => {
          const u = await uploadImage(file.buffer);
          return { url: u.secure_url, public_id: u.public_id, alt: updateData.name || "" };
        })
      );
      updateData.images = uploads;
    }

    /* ── Variant update ── */
    if (updateData.variants) {
      const newVariants = parseJSON(updateData.variants, []);

      updateData.variants = newVariants.map((newVariant) => {
        // Stock fields existing se preserve karo
        const existingVariant = product.variants.find((v) => v.sku === newVariant.sku);
        return {
          ...newVariant,
          stockQuantity: existingVariant?.stockQuantity ?? 0,
          stockStatus: existingVariant?.stockStatus ?? "out-of-stock",
          hasStock: existingVariant?.hasStock ?? false,
          images: newVariant.images || [],
        };
      });

      // Variant images upload karo
      for (const [idxStr, files] of Object.entries(variantFileMap)) {
        const idx = parseInt(idxStr, 10);
        if (!updateData.variants[idx]) continue;

        const uploadedImgs = await Promise.all(
          files.map(async (file) => {
            const u = await uploadImage(file.buffer);
            return { url: u.secure_url, public_id: u.public_id, alt: "" };
          })
        );
        updateData.variants[idx].images = (updateData.variants[idx].images || []).concat(uploadedImgs);
      }
    } else {
      // Variants field nahi aaya to existing rakhni chahiye
      delete updateData.variants;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    return res.json({ success: true, message: "Product updated successfully", product: updatedProduct });

  } catch (error) {
    console.error("Update product error:", error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: `Duplicate value error: ${JSON.stringify(error.keyValue)}` });
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

    // Agar product kisi TopDeal mein tha to wahan se bhi hata do
    if (product.topDeal) {
      await TopDeal.findByIdAndUpdate(product.topDeal, {
        $pull: { products: product._id },
      });
    }

    // Main product images Cloudinary se delete karo
    for (const img of product.images) {
      if (img.public_id) await deleteImage(img.public_id);
    }

    // Variant images bhi delete karo
    for (const variant of product.variants) {
      for (const img of variant.images || []) {
        if (img.public_id) await deleteImage(img.public_id);
      }
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
    const filter = {
      isFeatured: true,
      status: "active",
      isArchived: false,
      ...(category && { category }),
    };

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
    const filter = {
      isRecommended: true,
      status: "active",
      isArchived: false,
      ...(category && { category }),
    };

    const products = await Product.find(filter)
      .populate("category")
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

    const products = await Product.find(filter, q ? { score: { $meta: "textScore" } } : {})
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

/* ================= TOP DEAL — GET ACTIVE (frontend) ================= */
export const getTopDealProducts = async (req, res) => {
  try {
    const topDeal = await TopDeal.findOne({ isActive: true, isArchived: false })
      .populate({
        path: "products",
        match: { status: "active", isArchived: false },
        populate: { path: "category", select: "name slug categoryKey" },
      });

    if (!topDeal) return res.json({ success: true, deal: null });

    res.json({ success: true, deal: topDeal });
  } catch (error) {
    console.error("getTopDealProducts error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= TOP DEAL — ADD PRODUCT ================= */
export const addProductToDeal = async (req, res) => {
  try {
    const { productId } = req.body;
    const dealId = req.params.id;

    if (!productId) {
      return res.status(400).json({ success: false, message: "productId is required" });
    }

    const [product, topDeal] = await Promise.all([
      Product.findById(productId),
      TopDeal.findById(dealId),
    ]);

    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    if (!topDeal) return res.status(404).json({ success: false, message: "TopDeal not found" });

    // Agar product pehle kisi aur deal mein tha to wahan se hata do
    if (product.topDeal && product.topDeal.toString() !== dealId) {
      await TopDeal.findByIdAndUpdate(product.topDeal, {
        $pull: { products: product._id },
      });
    }

    // Dono sides sync
    await Promise.all([
      Product.findByIdAndUpdate(productId, { $set: { topDeal: dealId } }),
      TopDeal.findByIdAndUpdate(dealId, { $addToSet: { products: productId } }),
    ]);

    res.json({ success: true, message: "Product added to deal" });
  } catch (error) {
    console.error("addProductToDeal error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= TOP DEAL — REMOVE PRODUCT ================= */
export const removeProductFromDeal = async (req, res) => {
  try {
    const { productId } = req.body;
    const dealId = req.params.id;

    if (!productId) {
      return res.status(400).json({ success: false, message: "productId is required" });
    }

    // Dono sides sync
    await Promise.all([
      Product.findByIdAndUpdate(productId, { $set: { topDeal: null } }),
      TopDeal.findByIdAndUpdate(dealId, { $pull: { products: productId } }),
    ]);

    res.json({ success: true, message: "Product removed from deal" });
  } catch (error) {
    console.error("removeProductFromDeal error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};