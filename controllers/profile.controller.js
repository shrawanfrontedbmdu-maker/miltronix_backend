import AdminProfile from "../models/Profile.model.js";
import { uploadImage, deleteImage } from "../utils/cloudinary.js";

// ── GET /api/admin/profile/me ────────────────────────────
export const getMyProfile = async (req, res) => {
  try {
    let profile = await AdminProfile.findOne({ userId: req.user.userId })
      .populate("userId", "fullName name email");

    if (!profile) {
      await AdminProfile.create({ userId: req.user.userId });
      profile = await AdminProfile.findOne({ userId: req.user.userId })
        .populate("userId", "fullName name email");
    }

    res.status(200).json({ success: true, data: profile });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/admin/profile/create ──────────────────────
export const createProfile = async (req, res) => {
  try {
    const exists = await AdminProfile.findOne({ userId: req.user.userId });
    if (exists) {
      return res.status(400).json({ success: false, message: "Profile already exists" });
    }

    const profile = await AdminProfile.create({
      userId: req.user.userId,
      ...req.body,
    });

    res.status(201).json({ success: true, data: profile });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ── PUT /api/admin/profile/me ────────────────────────────
export const updateProfile = async (req, res) => {
  try {
    const allowedFields = ["bio", "phone"];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const profile = await AdminProfile.findOneAndUpdate(
      { userId: req.user.userId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!profile) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    res.status(200).json({ success: true, data: profile });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ── POST /api/admin/profile/me/avatar ───────────────────
export const uploadAvatarHandler = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image uploaded" });
    }

    const profile = await AdminProfile.findOne({ userId: req.user.userId });
    if (!profile) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    if (profile.avatarPublicId) {
      await deleteImage(profile.avatarPublicId);
    }

    const result = await uploadImage(req.file.buffer, {
      folder: "admin-panel/avatars",
      transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
      public_id: `avatar-${req.user.userId}`,
    });

    profile.avatar = result.secure_url;
    profile.avatarPublicId = result.public_id;
    await profile.save();

    res.status(200).json({
      success: true,
      message: "Avatar uploaded successfully",
      avatar: profile.avatar,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/admin/profile/me/avatar ─────────────────
export const deleteAvatarHandler = async (req, res) => {
  try {
    const profile = await AdminProfile.findOne({ userId: req.user.userId });

    if (!profile?.avatar) {
      return res.status(400).json({ success: false, message: "No avatar to delete" });
    }

    if (profile.avatarPublicId) {
      await deleteImage(profile.avatarPublicId);
    }

    profile.avatar = "";
    profile.avatarPublicId = "";
    await profile.save();

    res.status(200).json({ success: true, message: "Avatar deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE /api/admin/profile/me ────────────────────────
export const deleteProfile = async (req, res) => {
  try {
    const profile = await AdminProfile.findOneAndDelete({ userId: req.user.userId });

    if (!profile) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }

    if (profile.avatarPublicId) {
      await deleteImage(profile.avatarPublicId);
    }

    res.status(200).json({ success: true, message: "Profile deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};