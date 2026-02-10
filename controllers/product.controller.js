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

const generateSlug = (text) => text.toLowerCase().trim().replace(/\s+/g, "-");

/* ================= CREATE PRODUCT ================= */
export const createProduct = async (req, res) => {
  try {
    let {
      name, slug, productKey, description, category,
      mrp, sellingPrice, sku, brand, variants,
      stockStatus, stockQuantity,
      warranty, returnPolicy, hsnCode, barcode,
      supplier, shipping, tags, images,
      isRecommended = false, status = "active"
    } = req.body;

    // Parse JSON fields
    variants = parseJSON(variants, []);
    supplier = parseJSON(supplier, []);
    shipping = parseJSON(shipping, []);
    tags = parseJSON(tags, []);
    images = parseJSON(images, []);

    // Auto-generate slug if not provided
    if (!slug) slug = generateSlug(name);

    /* ===== REQUIRED FIELDS VALIDATION ===== */
    if (!name || !productKey || !description || !category || !warranty || !returnPolicy || !hsnCode) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required fields: name, productKey, description, category, warranty, returnPolicy, hsnCode" 
      });
    }

    /* ===== CATEGORY VALIDATION ===== */
    const categoryDoc = await Category.findById(category);
    if (!categoryDoc) {
      return res.status(400).json({ success: false, message: "Invalid category ID" });
    }

    /* ===== IMAGE HANDLING ===== */
    let finalImages = [];
    
    // Priority: uploaded files > body images
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
      return res.status(400).json({ 
        success: false, 
        message: "At least one product image is required" 
      });
    }

    /* ===== VARIANT LOGIC ===== */
    if (variants.length > 0) {
      // Validate each variant
      for (const v of variants) {
        if (!v.sku || !v.price || v.stockQuantity === undefined) {
          return res.status(400).json({
            success: false,
            message: "Each variant must have sku, price, and stockQuantity",
          });
        }
        
        // Ensure price and stockQuantity are valid numbers
        if (v.price < 0 || v.stockQuantity < 0) {
          return res.status(400).json({
            success: false,
            message: "Variant price and stockQuantity must be non-negative",
          });
        }
      }

      // For variant products, root-level price/sku should not be set
      sku = undefined;
      sellingPrice = undefined;
      mrp = undefined;
      
    } else {
      // Non-variant products MUST have SKU and sellingPrice
      if (!sku || sellingPrice === undefined) {
        return res.status(400).json({
          success: false,
          message: "Non-variant product must have sku and sellingPrice",
        });
      }

      // Validate pricing
      if (sellingPrice < 0) {
        return res.status(400).json({
          success: false,
          message: "Selling price must be non-negative",
        });
      }

      if (mrp !== undefined && mrp < 0) {
        return res.status(400).json({
          success: false,
          message: "MRP must be non-negative",
        });
      }
    }

    /* ===== HSN CODE VALIDATION ===== */
    if (!/^[0-9]{2,6}$/.test(hsnCode)) {
      return res.status(400).json({ 
        success: false, 
        message: "HSN code must be 2-6 digits" 
      });
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

    res.status(201).json({ 
      success: true, 
      message: "Product created successfully", 
      product 
    });

  } catch (error) {
    console.error("Create product error:", error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      const value = error.keyValue[field];
      return res.status(400).json({ 
        success: false, 
        message: `Duplicate ${field}: '${value}' already exists` 
      });
    }

    // Handle validation errors from middleware
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: error.message 
      });
    }

    // Generic error with specific message
    res.status(500).json({ 
      success: false, 
      message: error.message || "Failed to create product" 
    });
  }
};

/* ================= UPDATE PRODUCT ================= */
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({ 
        success: false, 
        message: "Product not found" 
      });
    }

    // Parse update data
    let updateData = { ...req.body };

    updateData.variants = parseJSON(updateData.variants, undefined);
    updateData.supplier = parseJSON(updateData.supplier, undefined);
    updateData.shipping = parseJSON(updateData.shipping, undefined);
    updateData.tags = parseJSON(updateData.tags, undefined);
    updateData.images = parseJSON(updateData.images, undefined);

    if (updateData.status) {
      updateData.status = updateData.status.toLowerCase();
    }

    /* ===== CATEGORY VALIDATION (if being updated) ===== */
    if (updateData.category) {
      const categoryDoc = await Category.findById(updateData.category);
      if (!categoryDoc) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid category ID" 
        });
      }
      updateData.categoryKey = categoryDoc.categoryKey || generateSlug(categoryDoc.name);
    }

    /* ===== VARIANT VALIDATION (if being updated) ===== */
    if (updateData.variants !== undefined) {
      if (updateData.variants.length > 0) {
        // Validate each variant
        for (const v of updateData.variants) {
          if (!v.sku || !v.price || v.stockQuantity === undefined) {
            return res.status(400).json({
              success: false,
              message: "Each variant must have sku, price, and stockQuantity",
            });
          }
          
          if (v.price < 0 || v.stockQuantity < 0) {
            return res.status(400).json({
              success: false,
              message: "Variant price and stockQuantity must be non-negative",
            });
          }
        }

        // When switching to variants, clear root-level fields
        updateData.sku = undefined;
        updateData.sellingPrice = undefined;
        updateData.mrp = undefined;
        
      } else {
        // When removing variants, require root SKU and price
        if (!updateData.sku && !existingProduct.sku) {
          return res.status(400).json({
            success: false,
            message: "SKU is required when removing variants",
          });
        }
        
        if (updateData.sellingPrice === undefined && !existingProduct.sellingPrice) {
          return res.status(400).json({
            success: false,
            message: "Selling price is required when removing variants",
          });
        }
      }
    }

    /* ===== HSN CODE VALIDATION (if being updated) ===== */
    if (updateData.hsnCode && !/^[0-9]{2,6}$/.test(updateData.hsnCode)) {
      return res.status(400).json({ 
        success: false, 
        message: "HSN code must be 2-6 digits" 
      });
    }

    /* ===== IMAGE UPDATE ===== */
    if (Array.isArray(req.files) && req.files.length > 0) {
      // Upload new images
      const uploads = await Promise.all(
        req.files.map(file => uploadImage(file.buffer))
      );
      const newImages = uploads.map(img => ({ 
        url: img.secure_url, 
        public_id: img.public_id, 
        alt: "" 
      }));

      // Delete old images from Cloudinary
      for (const img of existingProduct.images) {
        if (img.public_id) {
          await deleteImage(img.public_id).catch(err => 
            console.error("Failed to delete image:", err)
          );
        }
      }

      updateData.images = newImages;
    }

    /* ===== AUTO-GENERATE SLUG (if name changed but slug not provided) ===== */
    if (updateData.name && !updateData.slug) {
      updateData.slug = generateSlug(updateData.name);
    }

    // Remove undefined values to avoid overwriting with undefined
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    /* ===== UPDATE PRODUCT ===== */
    const updated = await Product.findByIdAndUpdate(
      id, 
      updateData, 
      { 
        new: true, 
        runValidators: true 
      }
    );

    res.json({ 
      success: true, 
      message: "Product updated successfully", 
      product: updated 
    });

  } catch (error) {
    console.error("Update product error:", error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      const value = error.keyValue[field];
      return res.status(400).json({ 
        success: false, 
        message: `Duplicate ${field}: '${value}' already exists` 
      });
    }

    // Handle validation errors from middleware
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: error.message 
      });
    }

    res.status(500).json({ 
      success: false, 
      message: error.message || "Failed to update product" 
    });
  }
};

/* ================= DELETE PRODUCT ================= */
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: "Product not found" 
      });
    }

    /* ===== DELETE IMAGES FROM CLOUDINARY ===== */
    for (const img of product.images) {
      if (img.public_id) {
        await deleteImage(img.public_id).catch(err => 
          console.error("Failed to delete image:", err)
        );
      }
    }

    /* ===== DELETE PRODUCT ===== */
    await product.deleteOne();

    res.json({ 
      success: true, 
      message: "Product deleted successfully" 
    });

  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Failed to delete product" 
    });
  }
};

/* ================= GET ALL PRODUCTS ================= */
export const getAllProducts = async (req, res) => {
  try {
    const { 
      category, 
      status, 
      isRecommended, 
      brand,
      minPrice,
      maxPrice,
      search,
      page = 1, 
      limit = 20,
      sort = '-createdAt'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (category) filter.category = category;
    if (status) filter.status = status.toLowerCase();
    if (isRecommended !== undefined) filter.isRecommended = isRecommended === 'true';
    if (brand) filter.brand = new RegExp(brand, 'i');
    
    // Price range filter
    if (minPrice || maxPrice) {
      filter.$or = [
        { sellingPrice: {} },
        { 'variants.price': {} }
      ];
      
      if (minPrice) {
        filter.$or[0].sellingPrice.$gte = Number(minPrice);
        filter.$or[1]['variants.price'].$gte = Number(minPrice);
      }
      
      if (maxPrice) {
        filter.$or[0].sellingPrice.$lte = Number(maxPrice);
        filter.$or[1]['variants.price'].$lte = Number(maxPrice);
      }
    }

    // Search by name, description, or SKU
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { sku: new RegExp(search, 'i') },
        { 'variants.sku': new RegExp(search, 'i') }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name categoryKey')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(filter)
    ]);

    res.json({
      success: true,
      products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    console.error("Get all products error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Failed to fetch products" 
    });
  }
};

/* ================= GET SINGLE PRODUCT ================= */
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id).populate('category', 'name categoryKey');
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: "Product not found" 
      });
    }

    res.json({ 
      success: true, 
      product 
    });

  } catch (error) {
    console.error("Get product by ID error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Failed to fetch product" 
    });
  }
};

/* ================= GET PRODUCT BY SLUG ================= */
export const getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const product = await Product.findOne({ slug }).populate('category', 'name categoryKey');
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: "Product not found" 
      });
    }

    res.json({ 
      success: true, 
      product 
    });

  } catch (error) {
    console.error("Get product by slug error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message || "Failed to fetch product" 
    });
  }
};