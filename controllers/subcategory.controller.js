import Subcategory from "../models/subcategory.model.js";
import Category from "../models/category.model.js";

/* ================= CREATE SUBCATEGORY ================= */
export const createSubcategory = async (req, res) => {
  try {
    const { name, slug, category, description, image } = req.body;

    if (!name || !slug || !category) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const subcategory = await Subcategory.create({
      name,
      slug: slug.toLowerCase().trim(),
      category,
      description,
      image,
    });

    return res.status(201).json({ success: true, subcategory });
  } catch (error) {
    console.error("Create subcategory error:", error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Slug already exists" });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= GET ALL SUBCATEGORIES ================= */
export const getSubcategories = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category ? { category, status: "active" } : { status: "active" };

    const subcategories = await Subcategory.find(filter)
      .populate("category", "categoryKey pageTitle")
      .sort({ displayOrder: 1 });

    return res.json({ success: true, count: subcategories.length, subcategories });
  } catch (error) {
    console.error("Get subcategories error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= GET SUBCATEGORY BY ID ================= */
export const getSubcategoryById = async (req, res) => {
  try {
    const subcategory = await Subcategory.findById(req.params.id)
      .populate("category", "categoryKey pageTitle");

    if (!subcategory) {
      return res.status(404).json({ success: false, message: "Subcategory not found" });
    }

    return res.json({ success: true, subcategory });
  } catch (error) {
    console.error("Get subcategory error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= UPDATE SUBCATEGORY ================= */
export const updateSubcategory = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {};

    // Only update provided fields
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.slug) updateData.slug = req.body.slug.toLowerCase().trim();
    if (req.body.category) updateData.category = req.body.category;
    if (req.body.description) updateData.description = req.body.description;
    if (req.body.image) updateData.image = req.body.image;
    if (req.body.status) updateData.status = req.body.status;
    if (req.body.displayOrder !== undefined) updateData.displayOrder = req.body.displayOrder;

    const subcategory = await Subcategory.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate("category", "categoryKey pageTitle");

    if (!subcategory) {
      return res.status(404).json({ success: false, message: "Subcategory not found" });
    }

    return res.json({ success: true, message: "Subcategory updated", subcategory });
  } catch (error) {
    console.error("Update subcategory error:", error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Slug already exists" });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= DELETE SUBCATEGORY ================= */
export const deleteSubcategory = async (req, res) => {
  try {
    const subcategory = await Subcategory.findByIdAndDelete(req.params.id);

    if (!subcategory) {
      return res.status(404).json({ success: false, message: "Subcategory not found" });
    }

    return res.json({ success: true, message: "Subcategory deleted" });
  } catch (error) {
    console.error("Delete subcategory error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
