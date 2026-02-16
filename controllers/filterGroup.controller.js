import FilterGroup from "../models/filterGroup.model.js";
import FilterOption from "../models/filterOption.model.js";
import Category from "../models/category.model.js";

/* ================= CREATE FILTER GROUP ================= */
export const createFilterGroup = async (req, res) => {
  try {
    const { name, displayName, category, filterType, description } = req.body;

    if (!name || !displayName || !category) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const filterGroup = await FilterGroup.create({
      name,
      displayName,
      category,
      filterType: filterType || "checkbox",
      description,
    });

    return res.status(201).json({ success: true, filterGroup });
  } catch (error) {
    console.error("Create filter group error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= GET FILTER GROUPS BY CATEGORY ================= */
export const getFilterGroupsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const filterGroups = await FilterGroup.find({
      category: categoryId,
      status: "active",
    })
      .populate({
        path: "category",
        select: "categoryKey pageTitle",
      })
      .sort({ displayOrder: 1 });

    // Populate filter options for each group
    const groupsWithOptions = await Promise.all(
      filterGroups.map(async (group) => {
        const options = await FilterOption.find({
          filterGroup: group._id,
          status: "active",
        }).sort({ displayOrder: 1 });

        return {
          ...group.toObject(),
          options,
        };
      })
    );

    return res.json({ success: true, count: groupsWithOptions.length, filterGroups: groupsWithOptions });
  } catch (error) {
    console.error("Get filter groups error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= GET FILTER GROUP BY ID ================= */
export const getFilterGroupById = async (req, res) => {
  try {
    const filterGroup = await FilterGroup.findById(req.params.id)
      .populate("category", "categoryKey pageTitle");

    if (!filterGroup) {
      return res.status(404).json({ success: false, message: "Filter group not found" });
    }

    const options = await FilterOption.find({
      filterGroup: filterGroup._id,
      status: "active",
    }).sort({ displayOrder: 1 });

    return res.json({ success: true, filterGroup: { ...filterGroup.toObject(), options } });
  } catch (error) {
    console.error("Get filter group error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= UPDATE FILTER GROUP ================= */
export const updateFilterGroup = async (req, res) => {
  try {
    const updateData = {};

    if (req.body.name) updateData.name = req.body.name;
    if (req.body.displayName) updateData.displayName = req.body.displayName;
    if (req.body.filterType) updateData.filterType = req.body.filterType;
    if (req.body.description) updateData.description = req.body.description;
    if (req.body.status) updateData.status = req.body.status;
    if (req.body.displayOrder !== undefined) updateData.displayOrder = req.body.displayOrder;

    const filterGroup = await FilterGroup.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate("category", "categoryKey pageTitle");

    if (!filterGroup) {
      return res.status(404).json({ success: false, message: "Filter group not found" });
    }

    const options = await FilterOption.find({
      filterGroup: filterGroup._id,
      status: "active",
    }).sort({ displayOrder: 1 });

    return res.json({
      success: true,
      message: "Filter group updated",
      filterGroup: { ...filterGroup.toObject(), options },
    });
  } catch (error) {
    console.error("Update filter group error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= DELETE FILTER GROUP ================= */
export const deleteFilterGroup = async (req, res) => {
  try {
    const filterGroup = await FilterGroup.findByIdAndDelete(req.params.id);

    if (!filterGroup) {
      return res.status(404).json({ success: false, message: "Filter group not found" });
    }

    // Also delete associated filter options
    await FilterOption.deleteMany({ filterGroup: req.params.id });

    return res.json({ success: true, message: "Filter group and associated options deleted" });
  } catch (error) {
    console.error("Delete filter group error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
