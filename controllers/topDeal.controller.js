import TopDeal from "../models/TopDeal.model.js";
import Product from "../models/product.model.js";
import cloudinary from "../config/cloudinary.js";

/* ─── helper: buffer → cloudinary (memoryStorage ke liye) ─── */
const uploadBuffer = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    ).end(buffer);
  });
};

/* ─── helper: multiple files upload ─── */
const uploadFiles = async (files, folder) => {
  const results = await Promise.all(
    files.map((file) => uploadBuffer(file.buffer, folder))
  );
  return results.map((r) => ({
    url: r.secure_url,
    public_id: r.public_id,
  }));
};

/* ─── helper: multiple public_ids destroy ─── */
const destroyFiles = async (images = []) => {
  if (!images.length) return;
  await Promise.all(
    images
      .filter((img) => img?.public_id)
      .map((img) => cloudinary.uploader.destroy(img.public_id))
  );
};

/* ─── helper: safe JSON parse ─── */
const safeParseArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

/* ─── helper: upload.any() → req.files is array ─── */
const getFilesByField = (files = [], fieldname) =>
  files.filter((f) => f.fieldname === fieldname);

/* ================= GET ALL TOP DEALS ================= */
export const getAllTopDeals = async (req, res) => {
  try {
    const topDeals = await TopDeal.find({ isArchived: false })
      .populate("products", "name slug images variants status")
      .sort({ createdAt: -1 });

    res.json({ success: true, topDeals });
  } catch (error) {
    console.error("getAllTopDeals error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= GET SINGLE TOP DEAL ================= */
export const getTopDealById = async (req, res) => {
  try {
    const topDeal = await TopDeal.findById(req.params.id).populate(
      "products",
      "name slug images variants status"
    );

    if (!topDeal) {
      return res.status(404).json({ success: false, message: "TopDeal not found" });
    }

    res.json({ success: true, topDeal });
  } catch (error) {
    console.error("getTopDealById error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= CREATE TOP DEAL ================= */
export const createTopDeal = async (req, res) => {
  try {
    const { title, description, products } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }

    const files       = req.files || [];
    const imageFiles  = getFilesByField(files, "image");
    const imagesFiles = getFilesByField(files, "images");

    // Primary image upload
    let imageData = null;
    if (imageFiles.length) {
      const [uploaded] = await uploadFiles(imageFiles, "top-deals");
      imageData = { ...uploaded, alt: title };
    }

    // Additional images upload
    let imagesData = [];
    if (imagesFiles.length) {
      const uploaded = await uploadFiles(imagesFiles, "top-deals");
      imagesData = uploaded.map((img) => ({ ...img, alt: title }));
    }

    const topDeal = await TopDeal.create({
      title:       title.trim(),
      description: description?.trim() || "",
      products:    safeParseArray(products),
      image:       imageData,
      images:      imagesData,
    });

    res.status(201).json({
      success: true,
      message: "Top Deal created successfully",
      topDeal,
    });
  } catch (error) {
    console.error("createTopDeal error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= UPDATE TOP DEAL ================= */
export const updateTopDeal = async (req, res) => {
  try {
    const { title, description, products, imagesToDelete } = req.body;

    const topDeal = await TopDeal.findById(req.params.id);
    if (!topDeal) {
      return res.status(404).json({ success: false, message: "TopDeal not found" });
    }

    const files       = req.files || [];
    const imageFiles  = getFilesByField(files, "image");
    const imagesFiles = getFilesByField(files, "images");

    // Primary image replace
    if (imageFiles.length) {
      if (topDeal.image?.public_id) {
        await cloudinary.uploader.destroy(topDeal.image.public_id);
      }
      const [uploaded] = await uploadFiles(imageFiles, "top-deals");
      topDeal.image = { ...uploaded, alt: title || topDeal.title };
    }

    // Specific images delete
    const toDelete = safeParseArray(imagesToDelete);
    if (toDelete.length) {
      await Promise.all(toDelete.map((pid) => cloudinary.uploader.destroy(pid)));
      topDeal.images = topDeal.images.filter(
        (img) => !toDelete.includes(img.public_id)
      );
    }

    // New additional images add
    if (imagesFiles.length) {
      const uploaded = await uploadFiles(imagesFiles, "top-deals");
      const newImages = uploaded.map((img) => ({
        ...img,
        alt: title || topDeal.title,
      }));
      topDeal.images = [...topDeal.images, ...newImages];
    }

    if (title)                     topDeal.title       = title.trim();
    if (description !== undefined) topDeal.description = description.trim();
    if (products !== undefined)    topDeal.products    = safeParseArray(products);

    await topDeal.save();

    res.json({ success: true, message: "Top Deal updated successfully", topDeal });
  } catch (error) {
    console.error("updateTopDeal error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= TOGGLE ACTIVE STATUS ================= */
export const toggleTopDealStatus = async (req, res) => {
  try {
    const topDeal = await TopDeal.findById(req.params.id);
    if (!topDeal) {
      return res.status(404).json({ success: false, message: "TopDeal not found" });
    }

    topDeal.isActive = !topDeal.isActive;
    await topDeal.save();

    res.json({
      success: true,
      message: `Top Deal ${topDeal.isActive ? "activated" : "deactivated"}`,
      isActive: topDeal.isActive,
    });
  } catch (error) {
    console.error("toggleTopDealStatus error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= ADD PRODUCT TO DEAL ================= */
export const addProductToDeal = async (req, res) => {
  try {
    const { productId } = req.body;
    const { id: dealId } = req.params;

    if (!productId) {
      return res.status(400).json({ success: false, message: "productId required" });
    }

    const [topDeal, product] = await Promise.all([
      TopDeal.findById(dealId),
      Product.findById(productId),
    ]);

    if (!topDeal) return res.status(404).json({ success: false, message: "TopDeal not found" });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    const alreadyInDeal = topDeal.products.some((p) => p.toString() === productId);
    if (!alreadyInDeal) {
      topDeal.products.push(productId);
      await topDeal.save();
    }

    product.topDeal = dealId;
    await product.save();

    res.json({ success: true, message: "Product added to Top Deal", topDeal });
  } catch (error) {
    console.error("addProductToDeal error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= REMOVE PRODUCT FROM DEAL ================= */
export const removeProductFromDeal = async (req, res) => {
  try {
    const { productId } = req.body;
    const { id: dealId } = req.params;

    if (!productId) {
      return res.status(400).json({ success: false, message: "productId required" });
    }

    const [topDeal, product] = await Promise.all([
      TopDeal.findById(dealId),
      Product.findById(productId),
    ]);

    if (!topDeal) return res.status(404).json({ success: false, message: "TopDeal not found" });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    topDeal.products = topDeal.products.filter((p) => p.toString() !== productId);
    await topDeal.save();

    product.topDeal = null;
    await product.save();

    res.json({ success: true, message: "Product removed from Top Deal", topDeal });
  } catch (error) {
    console.error("removeProductFromDeal error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= DELETE TOP DEAL ================= */
export const deleteTopDeal = async (req, res) => {
  try {
    const topDeal = await TopDeal.findById(req.params.id);
    if (!topDeal) {
      return res.status(404).json({ success: false, message: "TopDeal not found" });
    }

    if (topDeal.image?.public_id) {
      await cloudinary.uploader.destroy(topDeal.image.public_id);
    }

    await destroyFiles(topDeal.images);

    if (topDeal.products.length) {
      await Product.updateMany(
        { _id: { $in: topDeal.products } },
        { $set: { topDeal: null } }
      );
    }

    await topDeal.deleteOne();

    res.json({ success: true, message: "Top Deal deleted successfully" });
  } catch (error) {
    console.error("deleteTopDeal error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};