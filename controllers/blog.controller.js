import Blogs from "../models/blog.model.js";
import { uploadBlogImage } from "../utils/cloudinary.js";
import mongoose from "mongoose";

// export const createBlog = async (req, res) => {
//   try {
//     const { title, excerpt, category, tags } = req.body;

//     let parsedContentBlocks = [];
//     if (req.body.contentBlocks) {
//       parsedContentBlocks = JSON.parse(req.body.contentBlocks);
//     }

//     if (!req.files || req.files.length === 0) {
//       return res.status(400).json({ message: "At least one image file is required" });
//     }

//     const uploadPromises = req.files.map((file) => uploadBlogImage(file.buffer));
//     const uploadResults = await Promise.all(uploadPromises);

//     const contentBlocks = parsedContentBlocks.map((block, index) => ({
//       text: block.text || "",
//       image: uploadResults[index]?.secure_url || null,
//     }));

//     const newBlog = await Blogs.create({
//       title,
//       excerpt,
//       category,
//       tags,
//       contentBlocks,
//     });

//     res.status(200).json({
//       message: "Blog created successfully",
//       newBlog,
//     });
//   } catch (error) {
//     console.error("Error creating blog:", error);
//     res.status(500).json({
//       message: "Error creating blog",
//       error,
//     });
//   }
// };

export const createBlog = async (req, res) => {
  try {
    const {
      title,
      excerpt,
      category,
      status,
      tags,
      seoTitle,
      seoDescription,
      seoKeywords,
      isFeatured,
      isCommentEnabled,
      featuredAlt,
      author
    } = req.body;

    if (!title || !excerpt) {
      return res.status(400).json({ message: "Title and excerpt are required" });
    }

    const parsedTags = tags ? JSON.parse(tags) : [];
    const parsedKeywords = seoKeywords ? JSON.parse(seoKeywords) : [];
    const parsedContentBlocks = req.body.contentBlocks
      ? JSON.parse(req.body.contentBlocks)
      : [];

    let uploadResults = [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file => uploadBlogImage(file.buffer));
      uploadResults = await Promise.all(uploadPromises);
    }

    let imgIndex = 0;

    const featuredImage = uploadResults[imgIndex]
      ? {
        url: uploadResults[imgIndex].secure_url,
        alt: featuredAlt || ""
      }
      : null;
    imgIndex++;

    const contentBlocks = parsedContentBlocks.map(block => {
      if (block.type === "image") {
        const imageUrl = uploadResults[imgIndex]
          ? uploadResults[imgIndex].secure_url
          : null;
        imgIndex++;
        return {
          ...block,
          url: imageUrl
        };
      }
      return block;
    });

    const finalStatus =
      status && ["draft", "published"].includes(status.toLowerCase())
        ? status.toLowerCase()
        : "draft";

    let parsedAuthor = {};

    if (author) {
      parsedAuthor = typeof author === "string" ? JSON.parse(author) : author;
    }

    const finalAuthor = {
      name: parsedAuthor.name?.trim() || "Guest Author",
      email: parsedAuthor.email?.trim() || "guest@example.com",
      image:
        parsedAuthor.image ||
        "https://cdn-icons-png.flaticon.com/512/149/149071.png" // dummy profile pic
    };

    const calculateReadTime = blocks => {
      const wordsPerMinute = 200;
      let totalWords = 0;

      blocks.forEach(block => {
        if (block.content) {
          totalWords += block.content.split(/\s+/).length;
        }
      });

      return Math.max(1, Math.ceil(totalWords / wordsPerMinute));
    };

    const readTime = calculateReadTime(contentBlocks);

    const newBlog = await Blogs.create({
      title,
      excerpt,
      category,
      status: finalStatus,
      tags: parsedTags,
      seoTitle,
      seoDescription,
      seoKeywords: parsedKeywords,
      isFeatured: isFeatured === "true" || isFeatured === true,
      isCommentEnabled: isCommentEnabled === "true" || isCommentEnabled === true,
      featuredImage,
      contentBlocks,
      author: finalAuthor,
      readTime
    });

    res.status(201).json({
      message: "Blog created successfully",
      blog: newBlog
    });

  } catch (error) {
    console.error("Error creating blog:", error);
    res.status(500).json({
      message: "Error creating blog",
      error: error.message
    });
  }
};


export const getBlogs = async (req, res) => {
  try {
    const blogs = await Blogs.find();

    if (!blogs) {
      return res.status(404).json({
        messgae: "No blog found! create one",
      });
    }

    res.status(200).json({
      messgae: "succesgully get blogs",
      blogs,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error getting blogs",
      error: error.message,
    });
  }
};

export const getBlogById = async (req, res) => {
  try {
    const blog = await Blogs.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    res.status(200).json(blog);
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving blog",
      error: error.message,
    });
  }
};

// export const editBlog = async (req, res) => {
//   try {
//     const blogId = req.params.id;

//     const { title, excerpt, category, tags } = req.body;

//     let parsedContentBlocks = [];
//     if (req.body.contentBlocks) {
//       parsedContentBlocks = JSON.parse(req.body.contentBlocks);
//     }

//     let updatedContentBlocks = [...parsedContentBlocks];

//     if (req.files && req.files.length > 0) {
//       const uploadPromises = req.files.map((file) => uploadBlogImage(file.buffer));
//       const uploadResults = await Promise.all(uploadPromises);

//       updatedContentBlocks = parsedContentBlocks.map((block, index) => ({
//         ...block,
//         image: uploadResults[index]?.secure_url || block.image || null,
//       }));
//     }

//     const updatedBlog = await Blogs.findByIdAndUpdate(
//       blogId,
//       {
//         title,
//         excerpt,
//         category,
//         tags,
//         contentBlocks: updatedContentBlocks,
//       },
//       {
//         new: true,
//         runValidators: true,
//       }
//     );

//     if (!updatedBlog) {
//       return res.status(404).json({ message: "Blog not found" });
//     }

//     res.status(200).json({
//       message: "Blog updated successfully",
//       updatedBlog,
//     });
//   } catch (error) {
//     console.error("Error updating blog:", error);
//     res.status(500).json({
//       message: "Error updating blog",
//       error: error.message,
//     });
//   }
// };


// export const deleteBlog = async (req, res) => {
//   try {
//     const deletedBlog = await Blogs.findByIdAndDelete(req.params.id);

//     if (!deletedBlog) {
//       return res.status(404).json({ message: "Blog not found" });
//     }

//     res.status(200).json({ message: "Blog deleted successfully" });
//   } catch (error) {
//     res.status(500).json({
//       message: "Error deleting blog",
//       error: error.message,
//     });
//   }
// };

export const editBlog = async (req, res) => {
  try {
    const blogId = req.params.id;

    let {
      title,
      excerpt,
      category,
      tags,
      status,
      author,
      featuredAlt
    } = req.body;

    let parsedTags;
    if (tags) {
      parsedTags = typeof tags === "string" ? JSON.parse(tags) : tags;
    }

    let parsedContentBlocks = [];
    if (req.body.contentBlocks) {
      parsedContentBlocks =
        typeof req.body.contentBlocks === "string"
          ? JSON.parse(req.body.contentBlocks)
          : req.body.contentBlocks;
    }

    let uploadResults = [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file =>
        uploadBlogImage(file.buffer)
      );
      uploadResults = await Promise.all(uploadPromises);
    }

    let imgIndex = 0;

    let featuredImage;
    if (uploadResults[imgIndex]) {
      featuredImage = {
        url: uploadResults[imgIndex].secure_url,
        alt: featuredAlt || ""
      };
      imgIndex++;
    }

    const updatedContentBlocks = parsedContentBlocks.map(block => {
      if (block.type === "image") {
        const newImageUrl = uploadResults[imgIndex]
          ? uploadResults[imgIndex].secure_url
          : block.url || null;

        imgIndex++;
        return { ...block, url: newImageUrl };
      }
      return block;
    });

    const finalStatus =
      status && ["draft", "published"].includes(status.toLowerCase())
        ? status.toLowerCase()
        : undefined;

    let finalAuthor;
    if (author) {
      const parsedAuthor =
        typeof author === "string" ? JSON.parse(author) : author;

      finalAuthor = {
        name: parsedAuthor.name?.trim() || "Guest Author",
        email: parsedAuthor.email?.trim() || "guest@example.com",
        image:
          parsedAuthor.image ||
          "https://cdn-icons-png.flaticon.com/512/149/149071.png"
      };
    }

    const calculateReadTime = blocks => {
      const wordsPerMinute = 200;
      let totalWords = 0;

      blocks.forEach(block => {
        if (block.content) {
          totalWords += block.content.split(/\s+/).length;
        }
      });

      return Math.max(1, Math.ceil(totalWords / wordsPerMinute));
    };

    const readTime = calculateReadTime(updatedContentBlocks);

    const updateData = {
      ...(title && { title }),
      ...(excerpt && { excerpt }),
      ...(category && { category }),
      ...(parsedTags && { tags: parsedTags }),
      ...(parsedContentBlocks.length > 0 && { contentBlocks: updatedContentBlocks }),
      ...(featuredImage && { featuredImage }),
      ...(finalStatus && { status: finalStatus }),
      ...(finalAuthor && { author: finalAuthor }),
      readTime
    };

    const updatedBlog = await Blogs.findByIdAndUpdate(blogId, updateData, {
      new: true,
      runValidators: true
    });

    if (!updatedBlog) {
      return res.status(404).json({ message: "Blog not found" });
    }

    res.status(200).json({
      message: "Blog updated successfully",
      blog: updatedBlog
    });

  } catch (error) {
    console.error("Error updating blog:", error);
    res.status(500).json({
      message: "Error updating blog",
      error: error.message
    });
  }
};


export const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid blog ID",
      });
    }

    const deletedBlog = await Blogs.findByIdAndDelete(id);
    if (!deletedBlog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Blog deleted successfully",
    });

  } catch (error) {
    console.error("🔥 Delete Blog Error:", error); // CHECK THIS IN TERMINAL

    return res.status(500).json({
      success: false,
      message: "Internal server error while deleting blog",
    });
  }
};


export const getBlogsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const blogs = await Blogs.find({ category });
    if (!blogs || blogs.length === 0) {
      return res.status(404).json({ message: "No blogs found for this category" });
    }

    res.status(200).json({
      message: "Successfully retrieved blogs for category",
      blogs,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error getting blogs by category",
      error: error.message,
    });
  }
};

export const getBlogsByStatus = async (req, res) => {
  try {
    const { status } = req.params;

    const blogs = await Blogs.find({ status });

    if (!blogs || blogs.length === 0) {
      return res.status(404).json({
        message: "Blog not found with this status",
        error: "No blogs found"
      });
    }

    res.status(200).json({
      message: "success in getting blogs by status",
      blogs,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error getting blogs by status",
      error: error.message,
    });
  }
};

export const getBlogsByTag = async (req, res) => {
  try {
    const { tags } = req.params;
    const blogs = await Blogs.find({ tags: { $in: tags.split(",") } });
    if (!blogs || blogs.length === 0) {
      return res.status(404).json({ message: "No blogs found for these tags" });
    }
    res.status(200).json({
      message: "Successfully retrieved blogs by tag",
      blogs,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error getting blogs by tag",
      error: error.message,
    });

  }
};

export const toggleBlogStatus = async (req, res) => {
  try {
    const blogId = req.params.id;
    const { status } = req.body;
    console.log("khush Alam")

    if (!status || !['draft', 'published', 'archived'].includes(status.toLowerCase())) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const blog = await Blogs.findById(blogId);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    blog.status = status.toLowerCase();
    blog.updatedAt = new Date();

    if (status.toLowerCase() === 'published' && !blog.publishedAt) {
      blog.publishedAt = new Date();
    }

    await blog.save();

    res.status(200).json({ message: 'Blog status updated', blog });
  } catch (error) {
    console.error('Error toggling blog status:', error);
    res.status(500).json({ message: 'Error toggling blog status', error: error.message });
  }
};

