import Category from "../models/category.model.js";
import fs from "fs";
import path from "path";

// ================= HELPERS =================
const mapFiles = (files = []) => {
  const map = {};
  files.forEach((file) => {
    map[file.fieldname] = `/uploads/category/${file.filename}`;
  });
  return map;
};

const deleteFile = (filePath) => {
  if (!filePath || filePath.includes("placeholder")) return;

  const fullPath = path.join("uploads/category", path.basename(filePath));
  fs.unlink(fullPath, (err) => {
    if (err) console.log("Delete failed:", err.message);
  });
};

// ================= CREATE CATEGORY =================
export const createCategory = async (req, res) => {
  try {
    const { categoryKey, pageTitle, pageSubtitle, description, infoSection } = req.body;

    if (!categoryKey || !pageTitle) {
      return res.status(400).json({ message: "categoryKey & pageTitle required" });
    }

    // Check duplicate categoryKey
    const exists = await Category.findOne({ categoryKey: categoryKey.toLowerCase() });
    if (exists) return res.status(400).json({ message: "Category already exists" });

    const fileMap = mapFiles(req.files);

    // ===== INFO SECTION PARSING =====
    let parsedInfoSection = null;
    if (infoSection) {
      parsedInfoSection = typeof infoSection === "string" ? JSON.parse(infoSection) : infoSection;

      // Parse cards
      const cards = (parsedInfoSection.cards || []).map((c, idx) => ({
        title: c.title,
        description: c.description,
        image: fileMap[`infoSection[cards][${idx}][image]`] || c.image || "/images/placeholder.png",
      }));

      parsedInfoSection = {
        title: parsedInfoSection.title,
        subtitle: parsedInfoSection.subtitle || "",
        description: parsedInfoSection.description || "",
        image: fileMap["infoSection[image]"] || parsedInfoSection.image || "/images/placeholder.png",
        cards,
      };
    }

    // ===== CREATE CATEGORY =====
    const category = await Category.create({
      categoryKey: categoryKey.toLowerCase(),
      pageTitle,
      pageSubtitle,
      description,
      image: fileMap["image"] || req.body.image || "/images/placeholder.png",
      infoSection: parsedInfoSection, // either object or null
    });

    res.status(201).json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ================= GET ALL =================
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= GET BY ID =================
export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= UPDATE =================
export const updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    const fileMap = mapFiles(req.files);
    const updateData = { ...req.body };

    // Main image
    if (fileMap["image"]) {
      deleteFile(category.image);
      updateData.image = fileMap["image"];
    }

    // InfoSection
    if (updateData.infoSection) {
      const info = typeof updateData.infoSection === "string"
        ? JSON.parse(updateData.infoSection)
        : updateData.infoSection;

      const cards = (info.cards || []).map((c, idx) => ({
        title: c.title,
        description: c.description,
        image: fileMap[`infoSection[cards][${idx}][image]`] || c.image || "/images/placeholder.png",
      }));

      updateData.infoSection = {
        title: info.title,
        subtitle: info.subtitle || "",
        description: info.description || "",
        image: fileMap["infoSection[image]"] || info.image || category.infoSection?.image || "/images/placeholder.png",
        cards,
      };
    }

    const updated = await Category.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ================= DELETE =================
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    deleteFile(category.image);
    deleteFile(category.infoSection?.image);
    category.infoSection?.cards?.forEach((c) => deleteFile(c.image));

    await category.deleteOne();
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
