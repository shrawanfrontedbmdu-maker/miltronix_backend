import Review from "../models/review.model.js";
import flaggedKeywords from "../utils/flaggedKeywordsList.js";

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

    // FIX: Add the 'product' field to the validation check for completeness.
    if (!product || !reviewText || !rating) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const keywords = checkForFlaggedKeywords(reviewText);
    const images = req.files?.images ? req.files.images.map((file) => ({ url: file.path })) : [];
    const videos = req.files?.videos ? req.files.videos.map((file) => ({ url: file.path })) : [];

    const newReview = new Review({
      product,
      customer:id,
      reviewText,
      rating,
      flaggedKeywords: keywords,
      images,
      videos,
      name,
      email
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
    // FIX: Handle invalid MongoDB ObjectId format to prevent a 500 error.
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

    let review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ msg: "Review not found" });
    }

    review.status = status;
    await review.save();
    res.json(review);
  } catch (err) {
    console.error(err.message);
    // FIX: Handle invalid ObjectId format.
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
    // FIX: Handle invalid ObjectId format.
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: "Review not found" });
    }
    res.status(500).json({ message: "Server Error" });
  }
};

export const getReviewsByProductId = async (req, res) => {
  try {
    const { productId } = req.params;

    // Validate ObjectId
    if (!productId || productId.length !== 24) {
      return res.status(400).json({ msg: "Invalid product ID" });
    }

    // Fetch all reviews for this product
    const reviews = await Review.find({ product: productId }).sort({ createdAt: -1 });

    // Calculate average rating
    let averageRating = 0;

    if (reviews.length > 0) {
      const total = reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0);
      averageRating = (total / reviews.length).toFixed(1); // 1 decimal point
    }

    res.json({
      reviews,
      averageRating: Number(averageRating),
      totalReviews: reviews.length
    });

  } catch (err) {
    console.error(err.message);

    if (err.kind === "ObjectId") {
      return res.status(400).json({ msg: "Invalid product ID" });
    }

    res.status(500).json({ message: "Server Error" });
  }
};

