import Banner from "../models/banner.model.js";
import { uploadBannerImage } from "../utils/cloudinary.js";

// export const createBanner = async (req, res) => {
//   try {
//     const {
//       imageAltText,
//       title,
//       description,
//       priority,
//       destinationUrl,
//       bannerFor,
//       startDate,
//       endDate,
//       status
//     } = req.body;

//     if (!req.files || req.files.length === 0) {
//       return res
//         .status(400)
//         .json({ message: "At least one image file is required" });
//     }

//     const uploadPromises = req.files.map((file) =>
//       uploadBannerImage(file.buffer)
//     );
//     const uploadResults = await Promise.all(uploadPromises);

//     const images = uploadResults.map((result) => ({
//       url: result.secure_url,
//       public_id: result.public_id,
//     }));

//     const newBanner = await Banner.create({
//       imageUrl: images[0].url,
//       imageAltText,
//       title,
//       description,
//       priority,
//       destinationUrl,
//       bannerFor,
//       startDate,
//       endDate,
//       status
//     });

//     res.status(201).json({
//       message: "Banner created successfully",
//       banner: newBanner,
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Error creating banner",
//       error,
//     });
//     console.log("Error creating banner:     ", error);

//   }
// };

export const createBanner = async (req, res) => {
  try {
    const {
      imageAlt,
      title,
      priority,
      link,
      linkTarget,
      placement,
      targetAudience,
      startDate,
      endDate,
      status,
      isClickable,
      trackingEnabled,
      notes
    } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: "At least one image file is required"
      });
    }

    const uploadPromises = req.files.map(file =>
      uploadBannerImage(file.buffer)
    );
    const uploadResults = await Promise.all(uploadPromises);

    const images = uploadResults.map(result => ({
      url: result.secure_url,
      public_id: result.public_id
    }));

    // Create banner
    const newBanner = await Banner.create({
      imageUrl: images[0].url, // first image as main banner
      imageAlt,
      title,
      priority,
      link,
      linkTarget,
      placement,
      targetAudience,
      startDate: startDate || null,
      endDate: endDate || null,
      status,
      isClickable,
      trackingEnabled,
      notes
    });

    res.status(201).json({
      message: "Banner created successfully",
      banner: newBanner
    });

  } catch (error) {
    console.log("Error creating banner:", error);
    res.status(500).json({
      message: "Error creating banner",
      error: error.message
    });
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

// export const editBanner = async (req, res) => {
//   try {
//     const {
//       id,
//       imageUrl,
//       imageAltText,
//       title,
//       description,
//       priority,
//       destinationUrl,
//       bannerFor,
//       startDate,
//       endDate,
//       isActive,
//       status
//     } = req.body;

//     const banner = await Banner.findByIdAndUpdate(
//       id,
//       {
//         imageUrl,
//         imageAltText,
//         title,
//         description,
//         priority,
//         destinationUrl,
//         bannerFor,
//         startDate,
//         endDate,
//         isActive,
//         status
//       },
//       { new: true }
//     );

//     if (!banner) {
//       return res.status(404).json({ message: "Banner not found" });
//     }

//     res.status(200).json({
//       message: "Banner edited successfully",
//       banner,
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Error editing banner",
//       error,
//     });
//   }
// };

export const editBanner = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findById(id);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    const {
      imageAlt,
      title,
      
      priority,
      link,
      linkTarget,
      placement,
      targetAudience,
      startDate,
      endDate,
      status,
      isClickable,
      trackingEnabled,
      notes
    } = req.body;

    if (req.file) {
      console.log("New image received:", req.file.originalname);

      const uploadResult = await uploadBannerImage(req.file.buffer);
      banner.imageUrl = uploadResult.secure_url;
    }

    if (imageAlt !== undefined) banner.imageAltText = imageAlt;
    if (title !== undefined) banner.title = title;
    if (priority !== undefined) banner.priority = priority;

    if (link !== undefined) banner.destinationUrl = link;
    if (placement !== undefined) banner.bannerFor = placement;
    if (targetAudience !== undefined) banner.targetAudience = targetAudience;
    if (linkTarget !== undefined) banner.linkTarget = linkTarget;

    if (startDate !== undefined) banner.startDate = startDate || null;
    if (endDate !== undefined) banner.endDate = endDate || null;

    if (status !== undefined) banner.status = status;
    if (isClickable !== undefined) banner.isClickable = isClickable;
    if (trackingEnabled !== undefined) banner.trackingEnabled = trackingEnabled;
    if (notes !== undefined) banner.notes = notes;

    await banner.save();

    res.status(200).json({
      message: "Banner updated successfully",
      banner
    });

  } catch (error) {
    console.error("Error editing banner:", error);
    res.status(500).json({
      message: "Error editing banner",
      error: error.message
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
export const toggleBannerStatus = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ message: "Banner not found" });

    banner.status = banner.status === "Active" ? "InActive" : "Active";

    await banner.save();
    res.json({ message: "Status updated", banner });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error toggling status" });
  }
};

