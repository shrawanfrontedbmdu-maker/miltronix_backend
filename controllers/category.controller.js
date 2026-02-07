import Category from "../models/category.model.js";
import { uploadToCloud } from "../config/cloudinary.js";

// helper to get file by fieldname
const getFileByField = (files, field) => {
  return files?.find((f) => f.fieldname === field);
};

// ================= CREATE CATEGORY =================
export const createCategory = async (req, res) => {
  try {
    const {
      categoryKey,
      pageTitle,
      pageSubtitle = "",
      description = "",
      status = "active",
      infoSection,
    } = req.body;

    if (!categoryKey || !pageTitle) {
      return res.status(400).json({ message: "categoryKey & pageTitle required" });
    }

    const exists = await Category.findOne({
      categoryKey: categoryKey.toLowerCase(),
    });
    if (exists) return res.status(400).json({ message: "Category already exists" });

    console.log("FILES:", req.files);

    // ===== MAIN IMAGE =====
    let imageUrl = "/images/placeholder.png";
    const mainImage = getFileByField(req.files, "image");

    if (mainImage) {
      const result = await uploadToCloud(mainImage.buffer, "categories");
      imageUrl = result.secure_url;
    }

    // ===== INFO SECTION =====
    let parsedInfoSection = infoSection ? JSON.parse(infoSection) : null;

    if (parsedInfoSection) {
      // infoSection image
      const infoImage = getFileByField(req.files, "infoSectionImage");
      if (infoImage) {
        const result = await uploadToCloud(infoImage.buffer, "categories");
        parsedInfoSection.image = result.secure_url;
      } else {
        parsedInfoSection.image =
          parsedInfoSection.image || "/images/placeholder.png";
      }

      // cards images
      parsedInfoSection.cards = parsedInfoSection.cards || [];

      for (let i = 0; i < parsedInfoSection.cards.length; i++) {
        const cardFile = getFileByField(req.files, `cards[${i}][image]`);

        if (cardFile) {
          const result = await uploadToCloud(cardFile.buffer, "categories");
          parsedInfoSection.cards[i].image = result.secure_url;
        } else {
          parsedInfoSection.cards[i].image =
            parsedInfoSection.cards[i].image || "/images/placeholder.png";
        }
      }
    }

    const category = await Category.create({
      categoryKey: categoryKey.toLowerCase(),
      pageTitle,
      pageSubtitle,
      description,
      status,
      image: imageUrl,
      infoSection: parsedInfoSection,
    });

    res.status(201).json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// ================= GET ALL CATEGORIES =================
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= GET CATEGORY BY ID =================
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

// ================= UPDATE CATEGORY =================
export const updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    const updateData = { ...req.body };

    console.log("FILES:", req.files);

    // ===== MAIN IMAGE =====
    const mainImage = getFileByField(req.files, "image");
    if (mainImage) {
      const result = await uploadToCloud(mainImage.buffer, "categories");
      updateData.image = result.secure_url;
    }

    // ===== INFO SECTION =====
    if (updateData.infoSection) {
      const info =
        typeof updateData.infoSection === "string"
          ? JSON.parse(updateData.infoSection)
          : updateData.infoSection;

      // infoSection image
      const infoImage = getFileByField(req.files, "infoSectionImage");
      if (infoImage) {
        const result = await uploadToCloud(infoImage.buffer, "categories");
        info.image = result.secure_url;
      } else {
        info.image =
          info.image || category.infoSection?.image || "/images/placeholder.png";
      }

      // cards
      info.cards = info.cards || [];

      for (let i = 0; i < info.cards.length; i++) {
        const cardFile = getFileByField(req.files, `cards[${i}][image]`);

        if (cardFile) {
          const result = await uploadToCloud(cardFile.buffer, "categories");
          info.cards[i].image = result.secure_url;
        } else {
          info.cards[i].image =
            info.cards[i].image ||
            category.infoSection?.cards[i]?.image ||
            "/images/placeholder.png";
        }
      }

      updateData.infoSection = info;
    }

    if (!updateData.status) updateData.status = category.status;
    if (!updateData.description)
      updateData.description = category.description;

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

// ================= DELETE CATEGORY =================
export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Category not found" });

    await category.deleteOne();
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
