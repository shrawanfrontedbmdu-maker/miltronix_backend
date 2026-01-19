import Product from "../models/product.model.js";
import { uploadImage } from "../utils/cloudinary.js";

export const createProduct = async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      category,

      price,
      sellingprice,
      mrp,
      discountPrice,

      sku,
      productcode,

      colour,
      size,
      variants,
      brand,
      specification,

      stockStatus,
      stockQuantity,

      weight,
      dimensions,

      tag,
      tags,

      warranty,
      returnPolicy,

      barcode,
      hsnCode,

      supplier,   // array
      shipping,   // array

      isActive,
      status
    } = req.body;

    //  Required validations (schema ke hisaab se)
    if (
      !name ||
      !description ||
      !category ||
      !sellingprice ||
      !warranty ||
      !returnPolicy ||
      !hsnCode
    ) {
      return res.status(400).json({
        message:
          "name, description, category, sellingprice, warranty, returnPolicy, hsnCode are required"
      });
    }

    //  Image validation
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: "At least one image file is required"
      });
    }

    // ☁️
    const uploadPromises = req.files.map((file) =>
      uploadImage(file.buffer)
    );
    const uploadResults = await Promise.all(uploadPromises);

    const images = uploadResults.map((result) => ({
      url: result.secure_url,
      public_id: result.public_id
    }));

    // 🧩 Create Product
    const newProduct = await Product.create({
      name,
      slug,
      description,
      category,

      images,

      price,
      sellingprice,
      mrp,
      discountPrice,

      sku,
      productcode,

      colour,
      size,
      variants,
      brand,
      specification,

      stockStatus,
      stockQuantity: stockQuantity || 0,

      weight,
      dimensions,

      tag,
      tags,

      warranty,
      returnPolicy,

      barcode,
      hsnCode,

      supplier: supplier ? supplier : [],
      shipping: shipping ? shipping : [],

      isActive,
      status
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product: newProduct
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      message: "Error creating Product",
      error: error.message,
    });
  }
};
export const getProducts = async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, stockStatus } = req.query;

    const filter = {};

    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [
        { name: { $regex: regex } },
        { description: { $regex: regex } },
      ];
    }

    if (category) {
      filter.category = category;
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (stockStatus) {
      filter.stockStatus = stockStatus;
    }

    const products = await Product.find(filter);
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

// export const updateProduct = async (req, res) => {
// try {
//   const { id } = req.params;

//   if (!req.body) {
//     return res.status(400).json({ message: "Request body is missing." });
//   }

//   const {
//     name,
//     description,
//     category,
//     imageUrl,
//     price,
//     colour,
//     specification,
//     stockQuantity,
//     stockStatus,
//     brand,
//     isActive,
//   } = req.body;

//   const updatedProduct = await Product.findByIdAndUpdate(
//     id,
//     {
//       name,
//       description,
//       category,
//       imageUrl,
//       price,
//       colour,
//       specification,
//       stockQuantity,
//       stockStatus,
//       brand,
//       isActive,
//     },
//     { new: true }
//   );
//   res.status(200).json({ message: "Product Updated", updatedProduct });
// } catch (error) {
//   console.log("Error updating product:", error);
//   res.status(500).json({ message: "Error updating Product", error });
// }
// };

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.body) {
      return res.status(400).json({ message: "Request body is missing." });
    }

    // Destructure request body
    const {
      name,
      slug,
      description,
      category,
      images,
      price,
      sellingprice,
      mrp,
      discountPrice,
      colour,
      size,
      variants,
      brand,
      specification,
      stockQuantity,
      stockStatus,
      tags,
      warranty,
      returnPolicy,
      barcode,
      hsnCode,
      supplier,
      shipping,
      isActive,
      status,
      productcode
    } = req.body;

    // Create update object dynamically
    const updateData = {
      name,
      slug,
      description,
      category,
      images, // array of objects [{url, public_id}]
      price,
      sellingprice,
      mrp,
      discountPrice,
      colour,
      size,
      variants,
      brand,
      specification,
      stockQuantity,
      stockStatus,
      tags,
      warranty,
      returnPolicy,
      barcode,
      hsnCode,
      supplier, // array of objects
      shipping, // array of objects
      isActive,
      status,
      productcode
    };

    // Remove undefined fields (optional)
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) delete updateData[key];
    });

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found." });
    }

    res.status(200).json({ message: "Product updated successfully", updatedProduct });

  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Error updating product", error });
  }
};


export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct)
      return res.status(404).json({ message: "Product not Found" });

    res.status(200).json({ messgae: "product delted" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};
