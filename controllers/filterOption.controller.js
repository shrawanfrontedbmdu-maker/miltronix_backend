import FilterOption from "../models/filterOption.model.js";
import FilterGroup from "../models/filterGroup.model.js";

/* ================= CREATE FILTER OPTION ================= */
export const createFilterOption = async (req, res) => {
  try {
    const { label, value, filterGroup, color } = req.body;

    if (!label || !value || !filterGroup) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const groupExists = await FilterGroup.findById(filterGroup);
    if (!groupExists) {
      return res.status(404).json({ success: false, message: "Filter group not found" });
    }

    const option = await FilterOption.create({
      label,
      value,
      filterGroup,
      color: color || null,
    });

    return res.status(201).json({ success: true, option });
  } catch (error) {
    console.error("Create filter option error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= GET FILTER OPTIONS BY GROUP ================= */
export const getFilterOptionsByGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    const options = await FilterOption.find({
      filterGroup: groupId,
      status: "active",
    }).sort({ displayOrder: 1 });

    return res.json({ success: true, count: options.length, options });
  } catch (error) {
    console.error("Get filter options error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= UPDATE FILTER OPTION ================= */
export const updateFilterOption = async (req, res) => {
  try {
    const updateData = {};

    if (req.body.label) updateData.label = req.body.label;
    if (req.body.value) updateData.value = req.body.value;
    if (req.body.color !== undefined) updateData.color = req.body.color;
    if (req.body.status) updateData.status = req.body.status;
    if (req.body.displayOrder !== undefined) updateData.displayOrder = req.body.displayOrder;

    const option = await FilterOption.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!option) {
      return res.status(404).json({ success: false, message: "Filter option not found" });
    }

    return res.json({ success: true, message: "Filter option updated", option });
  } catch (error) {
    console.error("Update filter option error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= DELETE FILTER OPTION ================= */
export const deleteFilterOption = async (req, res) => {
  try {
    const option = await FilterOption.findByIdAndDelete(req.params.id);

    if (!option) {
      return res.status(404).json({ success: false, message: "Filter option not found" });
    }

    return res.json({ success: true, message: "Filter option deleted" });
  } catch (error) {
    console.error("Delete filter option error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
