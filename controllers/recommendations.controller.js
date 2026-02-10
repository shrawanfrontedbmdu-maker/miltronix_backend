import Recommendation from "../models/recommendations.model.js"; // Using same model
import { uploadImage, deleteImage } from "../utils/cloudinary.js";

/* ========== CREATE RECOMMENDED PRODUCT ========== */
export const createRecommendation = async (req, res) => {
  try {
    const { productId, title, price, oldPrice, saveAmount } = req.body;

    if (!req.file) return res.status(400).json({ success: false, message: "Image is required" });

    // Upload image to Cloudinary
    const result = await uploadImage(req.file.path, "recommendations");

    const newProduct = new Recommendation({
      productId,
      title,
      price,
      oldPrice,
      saveAmount,
      image: result.secure_url,
    });

    await newProduct.save();
    res.status(201).json({ success: true, data: newProduct });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ========== GET ALL RECOMMENDATIONS ========== */
export const getRecommendations = async (req, res) => {
  try {
    const products = await Recommendation.find().sort({ createdAt: -1 });
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ========== GET SINGLE RECOMMENDATION ========== */
export const getRecommendation = async (req, res) => {
  try {
    const product = await Recommendation.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ========== UPDATE RECOMMENDATION ========== */
export const updateRecommendation = async (req, res) => {
  try {
    const { title, price, oldPrice, saveAmount } = req.body;
    const product = await Recommendation.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    // If new image uploaded
    if (req.file) {
      if (product.image) {
        await deleteImage(product.image); // delete old image from Cloudinary
      }
      const result = await uploadImage(req.file.path, "recommendations");
      product.image = result.secure_url;
    }

    // Update fields
    product.title = title || product.title;
    product.price = price || product.price;
    product.oldPrice = oldPrice || product.oldPrice;
    product.saveAmount = saveAmount || product.saveAmount;

    await product.save();
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ========== DELETE RECOMMENDATION ========== */
export const deleteRecommendation = async (req, res) => {
  try {
    const product = await Recommendation.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    if (product.image) {
      await deleteImage(product.image); // remove from Cloudinary
    }

    await product.remove();
    res.json({ success: true, message: "Recommendation deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
