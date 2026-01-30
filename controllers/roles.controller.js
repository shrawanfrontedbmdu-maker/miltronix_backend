import Role from "../models/role.model.js";

export const createRole = async (req, res) => {
  try {
    const { name, description, permissions, status, createdAt, users } =
      req.body;

    const newRole = await Role.create({
      name,
      description,
      permissions,
      status,
      createdAt,
      users,
    });

    res.status(201).json({
      message: "Role created successfully",
      role: newRole,
    });
  } catch (error) {
    console.error("Error creating role:", error);
    res.status(500).json({
      message: "Error creating role",
      error,
    });
  }
};

export const getRoles = async (req, res) => {
  try {
    const roles = await Role.find();
    res.status(200).json({
      message: "Roles retrieved successfully",
      roles,
    });
  } catch (error) {
    console.error("Error retrieving roles:", error);
    res.status(500).json({
      message: "Error retrieving roles",
      error,
    });
  }
};

export const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }
    res.status(200).json({
      message: "Role retrieved successfully",
      role,
    });
  } catch (error) {
    console.error("Error retrieving role:", error);
    res.status(500).json({
      message: "Error retrieving role",
      error,
    });
  }
};

export const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, permissions, status } = req.body;

    const updatedRole = await Role.findByIdAndUpdate(
      id,
      { name, description, permissions, status },
      { new: true }
    );
    if (!updatedRole) {
      return res.status(404).json({ message: "Role not found" });
    }
    res.status(200).json({
      message: "Role updated successfully",
      role: updatedRole,
    });
  } catch (error) {
    console.error("Error updating role:", error);
    res.status(500).json({
      message: "Error updating role",
      error,
    });
  }
};

export const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedRole = await Role.findByIdAndDelete(id);
    if (!deletedRole) {
      return res.status(404).json({ message: "Role not found" });
    }
    res.status(200).json({
      message: "Role deleted successfully",
      role: deletedRole,
    });
  } catch (error) {
    console.error("Error deleting role:", error);
    res.status(500).json({
      message: "Error deleting role",
      error,
    });
  }
};

export const changeRoleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedRole = await Role.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    if (!updatedRole) {
      return res.status(404).json({ message: "Role not found" });
    }
    res.status(200).json({
      message: `Role status changed to ${status} successfully`,
      role: updatedRole,
    });
  } catch (error) {
    console.error("Error changing role status:", error);
    res.status(500).json({
      message: "Error changing role status",
      error,
    });
  }
};

export const getRolesByStatus = async (req, res) => {
  try {
    const { status } = req.query;
    const roles = await Role.find({ status });
    res.status(200).json({
      message: "Roles retrieved successfully",
      roles,
    });
  } catch (error) {
    console.error("Error retrieving roles by status:", error);
    res.status(500).json({
      message: "Error retrieving roles by status",
      error,
    });
  }
};
