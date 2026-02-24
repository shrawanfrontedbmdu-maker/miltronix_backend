import TopDeal from "../models/TopDeal.model.js";
import cloudinary from "../config/cloudinary.js";

/* ================= CREATE TOP DEAL ================= */
export const createTopDeal = async (req, res) => {
  try {
    const { title, description, products } = req.body;

    let imageData = null;

    if (req.files?.image) {
      const file = req.files.image[0];

      const result = await cloudinary.uploader.upload(file.path, {
        folder: "top-deals",
      });

      imageData = {
        url: result.secure_url,
        public_id: result.public_id,
        alt: title,
      };
    }

    const topDeal = await TopDeal.create({
      title,
      description,
      products: JSON.parse(products),
      image: imageData,
    });

    res.status(201).json({
      success: true,
      message: "Top Deal created successfully",
      topDeal,
    });

  } catch (error) {
    console.error("createTopDeal error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= UPDATE TOP DEAL ================= */
export const updateTopDeal = async (req, res) => {
  try {
    const { title, description, products } = req.body;

    const topDeal = await TopDeal.findById(req.params.id);
    if (!topDeal) return res.status(404).json({ message: "TopDeal not found" });

    if (req.files?.image) {
      if (topDeal.image?.public_id) {
        await cloudinary.uploader.destroy(topDeal.image.public_id);
      }

      const file = req.files.image[0];
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "top-deals",
      });

      topDeal.image = {
        url: result.secure_url,
        public_id: result.public_id,
        alt: title,
      };
    }

    topDeal.title = title;
    topDeal.description = description;
    topDeal.products = JSON.parse(products);

    await topDeal.save();

    res.json({
      success: true,
      message: "Top Deal updated successfully",
      topDeal,
    });

  } catch (error) {
    console.error("updateTopDeal error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= DELETE TOP DEAL ================= */
export const deleteTopDeal = async (req, res) => {
  try {
    const topDeal = await TopDeal.findById(req.params.id);
    if (!topDeal) return res.status(404).json({ message: "TopDeal not found" });

    if (topDeal.image?.public_id) {
      await cloudinary.uploader.destroy(topDeal.image.public_id);
    }

    await topDeal.deleteOne();

    res.json({
      success: true,
      message: "Top Deal deleted",
    });

  } catch (error) {
    console.error("deleteTopDeal error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};