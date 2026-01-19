import Banner from "../models/banner.model.js";
import { uploadBannerImage } from "../utils/cloudinary.js";

export const createBanner = async (req, res) => {
  try {
    const {
      imageAltText,
      title,
      description,
      priority,
      destinationUrl,
      bannerFor,
      startDate,
      endDate,
    } = req.body;

    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one image file is required" });
    }

    const uploadPromises = req.files.map((file) =>
      uploadBannerImage(file.buffer)
    );
    const uploadResults = await Promise.all(uploadPromises);

    const images = uploadResults.map((result) => ({
      url: result.secure_url,
      public_id: result.public_id,
    }));

    const newBanner = await Banner.create({
      imageUrl: images[0].url,
      imageAltText,
      title,
      description,
      priority,
      destinationUrl,
      bannerFor,
      startDate,
      endDate,
    });

    res.status(201).json({
      message: "Banner created successfully",
      banner: newBanner,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating banner",
      error,
    });
    console.log("Error creating banner:     ", error);
    
  }
};

export const getBanner = async (req, res) => {
  try {
    const banners = await Banner.find();
    res.status(200).json({
      message: "Banners fetched successfully",
      banners,
    });
  } catch (error) {
    res.status(500).json({
      message: "error fetching banners",
      error,
    });
  }
};

export const getBannerById = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findById(id);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }
    res.status(200).json({
      message: "Banner fetched successfully",
      banner,
    });
  } catch (error) {
    res.status(500).json({
      message: "error getting banners",
    });
  }
};

export const deactivateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findByIdAndUpdate(
      id,
      { status: "InActive" },
      { new: true }
    );
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }
    res.status(200).json({
      message: "Banner deactivated successfully",
      banner,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deactivating banner",
      error,
    });
  }
};

export const editBanner = async (req, res) => {
  try {
    const {
      id,
      imageUrl,
      imageAltText,
      title,
      description,
      priority,
      destinationUrl,
      bannerFor,
      startDate,
      endDate,
      isActive,
    } = req.body;

    const banner = await Banner.findByIdAndUpdate(
      id,
      {
        imageUrl,
        imageAltText,
        title,
        description,
        priority,
        destinationUrl,
        bannerFor,
        startDate,
        endDate,
        isActive,
      },
      { new: true }
    );

    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    res.status(200).json({
      message: "Banner edited successfully",
      banner,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error editing banner",
      error,
    });
  }
};

export const duplicateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findById(id);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }
    const duplicatedBanner = await Banner.create({
      imageUrl: banner.imageUrl,
      imageAltText: banner.imageAltText,
      title: banner.title,
      description: banner.description,
      priority: banner.priority,
      destinationUrl: banner.destinationUrl,
      bannerFor: banner.bannerFor,
      startDate: banner.startDate,
      endDate: banner.endDate,
      isActive: banner.isActive,
    });
    res.status(201).json({
      message: "Banner duplicated successfully",
      banner: duplicatedBanner,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting banner",
      error,
    });
  }
};

export const getBannerByStatus = async (req, res) => {
  try {
    const { status } = req.query;
    const banners = await Banner.find({ status });
    res.status(200).json({
      message: "Banners fetched successfully",
      banners,
    });
  } catch (error) {
    res.status(500).json({
      message: "error getting banner",
    });
  }
};

export const getBannerByPlacement = async (req, res) => {
  try {
    const { placement } = req.query;
    const banners = await Banner.find({ placement });
    res.status(200).json({
      message: "Banners fetched successfully",
      banners,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error Getting Baner",
      error,
    });
  }
};

export const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findByIdAndDelete(id);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }
    res.status(200).json({
      message: "Banner deleted successfully",
      banner,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting Banner",
      error,
    });
  }
};
