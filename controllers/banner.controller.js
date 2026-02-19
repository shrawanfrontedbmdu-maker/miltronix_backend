import Banner from "../models/banner.model.js";
import { uploadBannerImage } from "../utils/cloudinary.js";


export const createBanner = async (req, res) => {
  try {
    const {
      bannertype,
      theme,
      title,
      description,
      startDate,
      status
    } = req.body;

    if (!req.file) {
      return res.status(400).json({
        message: "Banner image is required"
      });
    }

    if (!bannertype || !theme || !title || !description) {
      return res.status(400).json({
        success: false,
        message: "All Feilds are Required"
      })
    }

    const uploadResult = await uploadBannerImage(req.file.buffer);

    const newBanner = await Banner.create({
      bannertype,
      theme,
      title,
      description,
      bennerimg: uploadResult.secure_url,
      startDate: startDate || null,
      status
    });

    res.status(201).json({
      message: "Banner created successfully",
      banner: newBanner
    });

  } catch (error) {
    console.error("Create Banner Error:", error);
    res.status(500).json({
      message: "Error creating banner",
      error: error.message
    });
  }
};


export const getBanner = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ createdAt: -1 });

    res.status(200).json({
      message: "Banners fetched successfully",
      banners
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching banners",
      error: error.message
    });
  }
};


export const getBannerById = async (req, res) => {
  try {
    const { id } = req.params
    if (!id) {
      return res.status(404).json({
        message: "Id not Found",
        success: false
      })
    }
    const banner = await Banner.findById(id);

    if (!banner)
      return res.status(404).json({ message: "Banner not found" });

    res.status(200).json({
      message: "Banner fetched successfully",
      data: banner
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching banner",
      error: error.message
    });
  }
};



export const editBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner)
      return res.status(404).json({ message: "Banner not found" });

    const {
      bannertype,
      theme,
      title,
      description,
      startDate,
      endDate,
      status
    } = req.body;

    if (req.file) {
      const uploadResult = await uploadBannerImage(req.file.buffer);
      banner.bennerimg = uploadResult.secure_url;
    }

    if (bannertype !== undefined) banner.bannertype = bannertype;
    if (theme !== undefined) banner.theme = theme;
    if (title !== undefined) banner.title = title;
    if (description !== undefined) banner.description = description;
    if (startDate !== undefined) banner.startDate = startDate || null;
    if (endDate !== undefined) banner.endDate = endDate || null;
    if (status !== undefined) banner.status = status;

    await banner.save();

    res.status(200).json({
      message: "Banner updated successfully",
      banner
    });

  } catch (error) {
    console.error("Edit Banner Error:", error);
    res.status(500).json({
      message: "Error updating banner",
      error: error.message
    });
  }
};



export const deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);

    if (!banner)
      return res.status(404).json({ message: "Banner not found" });

    res.status(200).json({
      message: "Banner deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      message: "Error deleting banner",
      error: error.message
    });
  }
};



export const getBannerByStatus = async (req, res) => {
  try {
    const { status } = req.query;

    const banners = await Banner.find({ status });

    res.status(200).json({
      message: "Banners fetched successfully",
      banners
    });

  } catch (error) {
    res.status(500).json({
      message: "Error fetching banner",
      error: error.message
    });
  }
};



export const toggleBannerStatus = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner)
      return res.status(404).json({ message: "Banner not found" });

    banner.status = banner.status === "active" ? "inactive" : "active";

    await banner.save();

    res.status(200).json({
      message: "Banner status updated",
      banner
    });

  } catch (error) {
    res.status(500).json({
      message: "Error toggling status",
      error: error.message
    });
  }
};