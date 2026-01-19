import Category from "../models/category.model.js";

export const createCategory = async (req, res) => {
  try {
    const { title, description, createdBy, stock, tagID, parent } = req.body;

    if (parent) {
      const parentCategory = await Category.findById(parent);
      if (!parentCategory) {
        return res.status(400).json({ message: "Parent category not found" });
      }
    }

    const newCategory = await Category.create({
      title,
      description,
      createdBy,
      stock,
      tagID,
      parent,
      isSubCategory: !!parent,
    });
    res
      .status(201)
      .json({ message: "Category created successfully", newCategory });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating Category", error: error.message });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().populate("parent", "title");
    res.status(200).json(categories);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching Category", error: error.message });
  }
};

export const editCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, createdBy, stock, tagID, parent } = req.body;

    if (parent) {
      if (parent === id) {
        return res
          .status(400)
          .json({ message: "Category cannot be its own parent" });
      }
      const parentCategory = await Category.findById(parent);
      if (!parentCategory) {
        return res.status(400).json({ message: "Parent category not found" });
      }
    }

    const editedCategory = await Category.findByIdAndUpdate(
      id,
      {
        title,
        description,
        createdBy,
        stock,
        tagID,
        parent,
        isSubCategory: !!parent,
      },
      { new: true }
    ).populate("parent", "name");

    if (!editedCategory)
      return res.status(404).json({ message: "Category not Found" });

    res
      .status(200)
      .json({ message: "Category edited successfully", editedCategory });
  } catch (error) {
    res.status(500).json({ message: "Error editing category", error });
  }
};

export const getParentCategories = async (req, res) => {
  try {
    const parentCategories = await Category.find({ isSubCategory: false });
    res.status(200).json(parentCategories);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error fetching parent categories",
        error: error.message,
      });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const subcategories = await Category.find({ parent: id });
    if (subcategories.length > 0) {
      return res.status(400).json({
        message:
          "Cannot delete category with subcategories. Please delete or reassign subcategories first.",
      });
    }

    const deletedCategory = await Category.findByIdAndDelete(id);

    if (!deletedCategory)
      return res.status(404).json({ message: "Category not Found" });

    res.status(200).json({ messgae: "Category delted" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};
