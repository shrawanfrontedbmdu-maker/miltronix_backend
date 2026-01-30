import Category from "../models/category.model.js";
import fs from "fs";
import path from "path";

// ===================================================
// HELPERS
// ===================================================
const mapFiles = (files = []) => {
  const map = {};
  files.forEach((file) => {
    map[file.fieldname] = `/uploads/category/${file.filename}`;
  });
  return map;
};

const deleteFile = (filePath) => {
  if (!filePath || filePath.includes("placeholder")) return;

  const fullPath = path.join(
    "uploads/category",
    path.basename(filePath)
  );

  fs.unlink(fullPath, (err) => {
    if (err) console.log("Delete failed:", err.message);
  });
};

// ===================================================
// CREATE CATEGORY
// ===================================================
export const createCategory = async (req, res) => {
  try {
    const {
      categoryKey,
      pageTitle,
      pageSubtitle,
      description,
      breadcrumb,
      filterOptions,
    } = req.body;

    if (!categoryKey || !pageTitle) {
      return res.status(400).json({
        message: "categoryKey & pageTitle required",
      });
    }

    const exists = await Category.findOne({
      categoryKey: categoryKey.toLowerCase(),
    });

    if (exists) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const fileMap = mapFiles(req.files);

    // ================= INFO CARDS =================
    let infoCardsArray = [];
    if (req.body.infoSection && req.body.infoSection.cards) {
      infoCardsArray = Array.isArray(req.body.infoSection.cards)
        ? req.body.infoSection.cards
        : JSON.parse(req.body.infoSection.cards);

      infoCardsArray = infoCardsArray.map((c, idx) => ({
        ...c,
        image:
          fileMap[`infoSection[cards][${idx}][image]`] ||
          c.image ||
          "/images/placeholder.png",
      }));
    }

    // ================= INFO SECTION =================
    const infoSection = {
      title: req.body.infoSection?.title || "",
      subtitle: req.body.infoSection?.subtitle || "",
      description: req.body.infoSection?.description || "",
      image:
        fileMap["infoSection[image]"] ||
        req.body.infoSection?.image ||
        "/images/placeholder.png",
      cards: infoCardsArray,
    };

    // ================= CREATE CATEGORY =================
    const category = await Category.create({
      categoryKey: categoryKey.toLowerCase(),
      pageTitle,
      pageSubtitle,
      description,
      breadcrumb: Array.isArray(breadcrumb)
        ? breadcrumb
        : JSON.parse(breadcrumb || "[]"),
      image:
        fileMap["image"] ||
        req.body.image ||
        "/images/placeholder.png",
      filterOptions: filterOptions
        ? JSON.parse(filterOptions)
        : {},
      infoSection,
    });

    res.status(201).json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ===================================================
// GET ALL CATEGORIES
// ===================================================
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===================================================
// GET CATEGORY BY ID
// ===================================================
export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ===================================================
// UPDATE CATEGORY
// ===================================================
export const updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    const fileMap = mapFiles(req.files);
    const updateData = { ...req.body };

    // ================= UPDATE IMAGE =================
    if (fileMap["image"]) {
      deleteFile(category.image);
      updateData.image = fileMap["image"];
    }

    // ================= UPDATE INFO SECTION =================
    if (updateData.infoSection) {
      const info = updateData.infoSection;

      const cardsArray = info.cards
        ? Array.isArray(info.cards)
          ? info.cards
          : JSON.parse(info.cards)
        : [];

      const updatedCards = cardsArray.map((c, idx) => ({
        ...c,
        image:
          fileMap[`infoSection[cards][${idx}][image]`] ||
          c.image ||
          "/images/placeholder.png",
      }));

      updateData.infoSection = {
        ...info,
        cards: updatedCards,
        image:
          fileMap["infoSection[image]"] ||
          info.image ||
          "/images/placeholder.png",
      };
    }

    // ================= OTHER FIELDS =================
    if (updateData.filterOptions)
      updateData.filterOptions = JSON.parse(updateData.filterOptions);

    if (updateData.breadcrumb)
      updateData.breadcrumb = Array.isArray(updateData.breadcrumb)
        ? updateData.breadcrumb
        : JSON.parse(updateData.breadcrumb);

    const updated = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ===================================================
// DELETE CATEGORY
// ===================================================
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    // delete category + info images
    deleteFile(category.image);
    category.infoSection?.cards?.forEach((c) =>
      deleteFile(c.image)
    );

    await category.deleteOne();
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
