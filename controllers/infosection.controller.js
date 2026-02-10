import InfoSection from "../models/infosection.model.js";
import Category from "../models/category.model.js";
import { uploadToCloud } from "../config/cloudinary.js";

// ===== Helper: get file by fieldname =====
const getFileByField = (files, field) => files?.find(f => f.fieldname === field);

// ===== CREATE InfoSection =====
export const createInfoSection = async (req, res) => {
  try {
    const body = req.body || {};
    const { title, subtitle = "", description = "", cards: cardsRaw, category } = body;

    if (!title) return res.status(400).json({ message: "Title is required" });

    // ===== Validate category (optional) =====
    let categoryId = null;
    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) return res.status(400).json({ message: "Invalid category ID" });
      categoryId = category;
    }

    // ===== Main image =====
    let imageUrl = "/images/placeholder.png";
    const mainImage = getFileByField(req.files, "image");
    if (mainImage) {
      const result = await uploadToCloud(mainImage.buffer, "infosections");
      imageUrl = result.secure_url;
    }

    // ===== Cards handling =====
    let cardsData = [];
    if (cardsRaw) {
      try {
        cardsData = JSON.parse(cardsRaw);
      } catch {
        cardsData = [];
      }
    }

    if (!Array.isArray(cardsData)) cardsData = [];

    for (let i = 0; i < cardsData.length; i++) {
      const cardFile = getFileByField(req.files, `cardImage_${i}`);
      if (cardFile) {
        const result = await uploadToCloud(cardFile.buffer, "infosections/cards");
        cardsData[i].icon = result.secure_url;
      } else {
        cardsData[i].icon = cardsData[i].icon || "";
      }
      cardsData[i].title = cardsData[i].title || "Untitled Card";
      cardsData[i].description = cardsData[i].description || "";
    }

    // ===== Save to DB =====
    const infoSection = await InfoSection.create({
      title,
      subtitle,
      description,
      image: imageUrl,
      cards: cardsData,
      category: categoryId,
    });

    // Populate category info for frontend
    await infoSection.populate("category", "categoryKey pageTitle");

    res.status(201).json(infoSection);
  } catch (error) {
    console.error("Create InfoSection Error:", error);
    res.status(400).json({ message: error.message });
  }
};

// ===== GET ALL InfoSections =====
export const getAllInfoSections = async (req, res) => {
  try {
    const sections = await InfoSection.find()
      .sort({ createdAt: -1 })
      .populate("category", "categoryKey pageTitle");
    res.status(200).json(sections);
  } catch (error) {
    console.error("Get All InfoSections Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ===== GET InfoSection BY ID =====
export const getInfoSectionById = async (req, res) => {
  try {
    const section = await InfoSection.findById(req.params.id)
      .populate("category", "categoryKey pageTitle");
    if (!section) return res.status(404).json({ message: "InfoSection not found" });
    res.status(200).json(section);
  } catch (error) {
    console.error("Get InfoSection By ID Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ===== UPDATE InfoSection =====
export const updateInfoSection = async (req, res) => {
  try {
    const body = req.body || {};
    const updateData = {};

    if (body.title) updateData.title = body.title;
    if (body.subtitle) updateData.subtitle = body.subtitle;
    if (body.description) updateData.description = body.description;

    // ===== Update category =====
    if (body.category) {
      const categoryExists = await Category.findById(body.category);
      if (!categoryExists) return res.status(400).json({ message: "Invalid category ID" });
      updateData.category = body.category;
    }

    // ===== Main image =====
    const mainImage = getFileByField(req.files, "image");
    if (mainImage) {
      const result = await uploadToCloud(mainImage.buffer, "infosections");
      updateData.image = result.secure_url;
    }

    // ===== Cards handling =====
    if (body.cards) {
      let cardsData = [];
      try {
        cardsData = JSON.parse(body.cards);
      } catch {
        cardsData = [];
      }
      if (!Array.isArray(cardsData)) cardsData = [];

      for (let i = 0; i < cardsData.length; i++) {
        const cardFile = getFileByField(req.files, `cardImage_${i}`);
        if (cardFile) {
          const result = await uploadToCloud(cardFile.buffer, "infosections/cards");
          cardsData[i].icon = result.secure_url;
        } else {
          cardsData[i].icon = cardsData[i].icon || "";
        }
        cardsData[i].title = cardsData[i].title || "Untitled Card";
        cardsData[i].description = cardsData[i].description || "";
      }

      updateData.cards = cardsData;
    }

    const section = await InfoSection.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate("category", "categoryKey pageTitle");

    if (!section) return res.status(404).json({ message: "InfoSection not found" });
    res.status(200).json(section);
  } catch (error) {
    console.error("Update InfoSection Error:", error);
    res.status(400).json({ message: error.message });
  }
};

// ===== DELETE InfoSection =====
export const deleteInfoSection = async (req, res) => {
  try {
    const section = await InfoSection.findByIdAndDelete(req.params.id);
    if (!section) return res.status(404).json({ message: "InfoSection not found" });
    res.status(200).json({ message: "InfoSection deleted successfully" });
  } catch (error) {
    console.error("Delete InfoSection Error:", error);
    res.status(500).json({ message: error.message });
  }
};
