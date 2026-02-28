import Review from "../models/review.model.js";
import Product from "../models/product.model.js";
import flaggedKeywords from "../utils/flaggedKeywordsList.js";
import { uploadToCloud } from "../config/cloudinary.js";

const checkForFlaggedKeywords = (text) => {
  if (!text || typeof text !== 'string') {
    return [];
  }
  const foundKeywords = [];
  const lowerCaseText = text.toLowerCase();
  flaggedKeywords.forEach((keyword) => {
    if (lowerCaseText.includes(keyword)) {
      foundKeywords.push(keyword);
    }
  });
  return foundKeywords;
};

export const createReview = async (req, res) => {
  try {
    const id = req.user._id;
    const { product, reviewText, rating } = req.body;

    if (!product || !reviewText || !rating) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const keywords = checkForFlaggedKeywords(reviewText);

    let images = [];
    if (req.files?.images && Array.isArray(req.files.images)) {
      for (const file of req.files.images) {
        try {
          const result = await uploadToCloud(file.buffer, "review-images");
          images.push({ url: result.secure_url, public_id: result.public_id });
        } catch (err) {
          console.error("Error uploading image to Cloudinary:", err);
        }
      }
    }

    let videos = [];
    if (req.files?.videos && Array.isArray(req.files.videos)) {
      for (const file of req.files.videos) {
        try {
          const result = await uploadToCloud(file.buffer, "review-videos");
          videos.push({ url: result.secure_url, public_id: result.public_id });
        } catch (err) {
          console.error("Error uploading video to Cloudinary:", err);
        }
      }
    }

    const newReview = new Review({
      product,
      customer: id,
      reviewText,
      rating,
      flaggedKeywords: keywords,
      images,
      videos,
    });

    const review = await newReview.save();
    res.status(201).json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

export const getAllReviews = async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status && ["pending", "approved", "deleted"].includes(status)) {
      query.status = status;
    }
    const reviews = await Review.find(query).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getReviewById = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ msg: "Review not found" });
    }
    res.json(review);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: "Review not found" });
    }
    res.status(500).json({ message: "Server Error" });
  }
};

export const updateReviewStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !["approved", "deleted"].includes(status)) {
      return res.status(400).json({ msg: "Invalid status provided" });
    }

    let review = await Review.findById(req.params.id).populate("product"); // ✅ populate add kiya
    if (!review) {
      return res.status(404).json({ msg: "Review not found" });
    }

    review.status = status;
    await review.save();

    // ✅ Approve hone pe product update karo
    if (status === "approved") {
      const productId = review.product?._id || review.product; // ✅ dono cases handle
      console.log("✅ productId:", productId);
      
      const allApproved = await Review.find({ product: productId, status: "approved" });
      console.log("✅ Approved reviews count:", allApproved.length);
      
      const avg = allApproved.reduce((sum, r) => sum + Number(r.rating || 0), 0) / allApproved.length;
      console.log("✅ avgRating:", avg);
      
      await Product.findByIdAndUpdate(productId, {
        avgRating: parseFloat(avg.toFixed(1)),
        reviewCount: allApproved.length,
      });
      console.log("✅ Product updated!");
    }

    res.json(review);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: "Review not found" });
    }
    res.status(500).json({ message: "Server Error" });
  }
};
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ msg: "Review not found" });
    }
    await review.deleteOne();
    res.json({ msg: "Review removed" });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: "Review not found" });
    }
    res.status(500).json({ message: "Server Error" });
  }
};

export const getReviewsByProductId = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId || productId.length !== 24) {
      return res.status(400).json({ msg: "Invalid product ID" });
    }

    const reviews = await Review.find({ product: productId })
      .populate("customer", "fullName email")
      .sort({ createdAt: -1 });

    let averageRating = 0;
    if (reviews.length > 0) {
      const total = reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0);
      averageRating = (total / reviews.length).toFixed(1);
    }

    res.json({
      reviews,
      averageRating: Number(averageRating),
      totalReviews: reviews.length,
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(400).json({ msg: "Invalid product ID" });
    }
    res.status(500).json({ message: "Server Error" });
  }
};

