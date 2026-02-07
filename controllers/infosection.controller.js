import InfoSection from "../models/infosection.model.js";
import { uploadToCloud } from "../config/cloudinary.js";

// Helper to get file by fieldname
const getFileByField = (files, field) => {
  return files?.find((f) => f.fieldname === field);
};

// ===== Create a new InfoSection =====
export const createInfoSection = async (req, res) => {
  try {
    const { title, subtitle = "", description = "", cards = [] } = req.body;

    if (!title) return res.status(400).json({ message: "Title is required" });

    // ===== Main Image =====
    let imageUrl = "/images/placeholder.png";
    const mainImage = getFileByField(req.files, "image");
    if (mainImage) {
      const result = await uploadToCloud(mainImage.buffer, "infosections");
      imageUrl = result.secure_url;
    }

    // ===== Cards Images =====
    let cardsData = JSON.parse(cards || "[]"); // cards can come as JSON string
    for (let i = 0; i < cardsData.length; i++) {
      const cardFile = getFileByField(req.files, `cardImage_${i}`);
      if (cardFile) {
        const result = await uploadToCloud(cardFile.buffer, "infosections/cards");
        cardsData[i].image = result.secure_url;
      }
    }

    const infoSection = await InfoSection.create({
      title,
      subtitle,
      description,
      image: imageUrl,
      cards: cardsData,
    });

    res.status(201).json(infoSection);
  } catch (error) {
    console.error("Create InfoSection Error:", error);
    res.status(400).json({ message: error.message });
  }
};

// ===== Get all InfoSections =====
export const getAllInfoSections = async (req, res) => {
  try {
    const sections = await InfoSection.find();
    res.status(200).json(sections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===== Get single InfoSection by ID =====
export const getInfoSectionById = async (req, res) => {
  try {
    const section = await InfoSection.findById(req.params.id);
    if (!section) return res.status(404).json({ message: "InfoSection not found" });
    res.status(200).json(section);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===== Update InfoSection =====
export const updateInfoSection = async (req, res) => {
  try {
    const updateData = { ...req.body };

    // ===== Main Image =====
    const mainImage = getFileByField(req.files, "image");
    if (mainImage) {
      const result = await uploadToCloud(mainImage.buffer, "infosections");
      updateData.image = result.secure_url;
    }

    // ===== Cards Images =====
    if (updateData.cards) {
      let cardsData = JSON.parse(updateData.cards);
      for (let i = 0; i < cardsData.length; i++) {
        const cardFile = getFileByField(req.files, `cardImage_${i}`);
        if (cardFile) {
          const result = await uploadToCloud(cardFile.buffer, "infosections/cards");
          cardsData[i].image = result.secure_url;
        }
      }
      updateData.cards = cardsData;
    }

    const section = await InfoSection.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!section) return res.status(404).json({ message: "InfoSection not found" });
    res.status(200).json(section);
  } catch (error) {
    console.error("Update InfoSection Error:", error);
    res.status(400).json({ message: error.message });
  }
};

// ===== Delete InfoSection =====
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
