import Role from "../models/role.model.js";


export const createRole = async (req, res) => {
  try {
    const { name, description, permissions, status, notes, userid, password } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Role name is required" });
    }

    if (!description?.trim()) {
      return res.status(400).json({ message: "Role description is required" });
    }

    if (!userid?.trim()) {
      return res.status(400).json({ message: "Email/Userid is required" });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(userid)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{6,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be 6+ chars with uppercase, lowercase, number and special character",
      });
    }

    if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
      return res.status(400).json({ message: "At least one permission is required" });
    }

    const existingRole = await Role.findOne({ name: name.toLowerCase().trim() });
    if (existingRole) {
      return res.status(400).json({ message: "Role already exists" });
    }

    const existingEmail = await Role.findOne({ userid: userid.toLowerCase().trim() });
    if (existingEmail) {
      return res.status(400).json({ message: "Email/Userid already in use" });
    }

    const cleanedPermissions = permissions.map((perm) => ({
      module: perm.module,
      actions: perm.actions,
    }));

    const newRole = await Role.create({
      name: name.toLowerCase().trim(),
      description: description.trim(),
      permissions: cleanedPermissions,
      status: ["active", "inactive"].includes(status) ? status : "inactive",
      notes: notes?.trim() || "",
      userid: userid.toLowerCase().trim(),
      password: password
    });


    res.status(201).json({
      message: "Role created successfully",
      role: newRole,
    });

  } catch (error) {
    console.error("Error creating role:", error);
    res.status(500).json({
      message: "Error creating role",
      error: error.message,
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
    const { name, description, permissions, status, notes, userid, password } = req.body;

    const role = await Role.findById(id);
    if (!role) return res.status(404).json({ message: "Role not found" });

    if (name) role.name = name.toLowerCase().trim();
    if (description) role.description = description.trim();
    if (permissions) role.permissions = permissions;
    if (notes !== undefined) role.notes = notes.trim();
    if (userid) role.userid = userid.toLowerCase().trim();
    if (status !== undefined) role.status = status === "active" ? "active" : "inactive";
    if (password) role.password = password;

    await role.save();

    res.status(200).json({
      message: "Role updated successfully",
      role
    });

  } catch (error) {
    console.error("Update Role Error:", error);
    res.status(500).json({ message: "Error updating role", error: error.message });
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
