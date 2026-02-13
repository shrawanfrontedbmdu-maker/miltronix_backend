import slugify from "slugify";
import Blog from "../models/blog.model.js";
import productModel from "../models/product.model.js";

export const generateBlogSlug = async (title, blogId = null) => {
  let baseSlug = slugify(title, { lower: true, strict: true });
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await Blog.findOne({ slug });
    if (!existing || existing._id.toString() === blogId) break;
    slug = `${baseSlug}-${counter++}`;
  }

  return slug;
};

export const generateProductSlug = async (ProductModel, name) => {
  let baseSlug = slugify(name, { lower: true, strict: true });
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await productModel.findOne({ slug });
    if (!existing) break;
    slug = `${baseSlug}-${counter++}`;
  }

  return slug;
};